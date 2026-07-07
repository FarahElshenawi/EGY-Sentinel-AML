"""
EGY-Sentinel AML — ML Risk Scorer (DS-1/3)
============================================

Loads the pre-trained RandomForest model and exposes a per-account
fraud probability. The model was trained on the full 6.36M-row PaySim
dataset by DS-1/3 and saved as a scikit-learn Pipeline
(StandardScaler + OneHotEncoder + RandomForestClassifier).

Model artifact:
    models/randomforest_paysim_fraud_model.joblib

Pipeline:
    1. Engineer features (same as rule_scorer)
    2. Compute frequency features
    3. Filter to account's transactions
    4. Predict fraud probability for each transaction
    5. Aggregate to account-level: max probability (most suspicious txn wins)

Public API:
    load_model() -> sklearn.pipeline.Pipeline
    predict_fraud_probability(account_id, df) -> dict
        Returns {account_id, ml_prob, ml_score, transaction_count}
"""
from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any

import joblib
import pandas as pd

from .features import (
    engineer_features,
    compute_frequency_features,
    get_account_transactions,
)

logger = logging.getLogger(__name__)

# ─── Model path ──────────────────────────────────────────────────────

# Try a few candidate locations for the model artifact
_MODEL_CANDIDATES = [
    Path(__file__).resolve().parents[2] / "models" / "randomforest_paysim_fraud_model.joblib",
    Path("/home/z/my-project/models/randomforest_paysim_fraud_model.joblib"),
    Path.cwd() / "models" / "randomforest_paysim_fraud_model.joblib",
]

_model_cache: Any = None
_model_loaded_from: Path | None = None


def _find_model_path() -> Path | None:
    """Find the first existing model artifact path."""
    for candidate in _MODEL_CANDIDATES:
        if candidate.exists():
            return candidate
    return None


def load_model() -> Any:
    """Load the trained RandomForest pipeline (cached after first call).

    Returns:
        sklearn.pipeline.Pipeline with steps:
        ['preprocessor', 'classifier']
    """
    global _model_cache, _model_loaded_from
    if _model_cache is not None:
        return _model_cache

    model_path = _find_model_path()
    if model_path is None:
        raise FileNotFoundError(
            f"Model artifact not found. Tried: {[str(p) for p in _MODEL_CANDIDATES]}"
        )

    logger.info(f"Loading RandomForest model from {model_path}")
    _model_cache = joblib.load(model_path)
    _model_loaded_from = model_path
    logger.info(
        f"Model loaded: Pipeline with steps {list(_model_cache.named_steps.keys())}"
    )
    return _model_cache


# ─── Model feature columns (must match training) ─────────────────────

# These are the 18 numeric + 1 categorical = 19 features the model was
# trained on, taken from the saved preprocessor's ColumnTransformer.
MODEL_NUMERIC_FEATURES = [
    "step", "amount", "oldbalanceOrg", "newbalanceOrig",
    "oldbalanceDest", "newbalanceDest", "log_amount",
    "balance_diff_orig", "balance_diff_dest", "balance_diff_ratio",
    "orig_balance_drained", "dest_balance_zero_both",
    "errorBalanceOrig", "errorBalanceDest", "high_amount_flag",
    "hour_of_day", "sender_frequency", "receiver_frequency",
]
MODEL_CATEGORICAL_FEATURES = ["type"]
MODEL_INPUT_FEATURES = MODEL_NUMERIC_FEATURES + MODEL_CATEGORICAL_FEATURES


# ─── Prediction ──────────────────────────────────────────────────────

def predict_fraud_probability(
    account_id: str,
    df: pd.DataFrame,
) -> dict[str, Any]:
    """Predict the fraud probability for an account.

    Engineers features, filters to the account's transactions, runs the
    model, and aggregates per-transaction probabilities to an account-level
    score using the MAX probability (the most suspicious transaction wins).

    Args:
        account_id: PaySim account ID.
        df: PaySim-format DataFrame.

    Returns:
        Dict with:
            account_id: str
            ml_prob: float (0.0-1.0) — max transaction probability
            ml_score: float (0.0-100.0) — ml_prob * 100
            transaction_count: int
            probabilities: list[float]  (per-transaction)
    """
    if df is None or df.empty:
        return {
            "account_id": account_id,
            "ml_prob": 0.0,
            "ml_score": 0.0,
            "transaction_count": 0,
            "probabilities": [],
        }

    # Engineer + compute frequency features on the full DataFrame
    df_featured = engineer_features(df)
    df_featured = compute_frequency_features(df_featured)

    # Filter to this account's transactions
    account_df = get_account_transactions(account_id, df_featured)

    if account_df.empty:
        logger.info(f"Account {account_id} has no transactions — ml_prob 0")
        return {
            "account_id": account_id,
            "ml_prob": 0.0,
            "ml_score": 0.0,
            "transaction_count": 0,
            "probabilities": [],
        }

    # Build the input feature matrix (must match training feature order)
    try:
        X = account_df[MODEL_INPUT_FEATURES]
    except KeyError as e:
        missing = set(MODEL_INPUT_FEATURES) - set(account_df.columns)
        raise ValueError(
            f"Missing required feature columns: {missing}. "
            f"Did you call engineer_features() first?"
        ) from e

    # Load model and predict
    try:
        model = load_model()
        probabilities = model.predict_proba(X)[:, 1].tolist()
    except Exception as e:
        logger.error(f"ML prediction failed for {account_id}: {e}")
        return {
            "account_id": account_id,
            "ml_prob": 0.0,
            "ml_score": 0.0,
            "transaction_count": len(account_df),
            "probabilities": [],
            "error": str(e),
        }

    # Aggregate: max probability (most suspicious txn wins)
    max_prob = max(probabilities) if probabilities else 0.0

    logger.info(
        f"Account {account_id} | {len(probabilities)} txns | "
        f"max_prob={max_prob:.4f} | ml_score={max_prob * 100:.1f}"
    )

    return {
        "account_id": account_id,
        "ml_prob": round(max_prob, 4),
        "ml_score": round(max_prob * 100, 2),
        "transaction_count": len(probabilities),
        "probabilities": probabilities,
    }
