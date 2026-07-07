"""Risk scoring modules (rule_scorer, ml_scorer, combine, features).

Public API:
    from egysentinel.score import (
        combine_account,         # full scoring pipeline
        combine_scores,          # just the hybrid formula
        score_account,           # rule-only scoring
        predict_fraud_probability,  # ML-only scoring
        risk_band_from_score,    # 0-100 -> "low"|"medium"|"high"
        engineer_features,       # feature engineering helper
    )
"""
from .features import (
    engineer_features,
    compute_frequency_features,
    get_account_transactions,
    get_account_features,
)
from .rule_scorer import (
    score_transaction,
    score_account,
    risk_band_from_score,
    WEIGHTS,
)
from .ml_scorer import (
    load_model,
    predict_fraud_probability,
    MODEL_INPUT_FEATURES,
)
from .combine import (
    combine_scores,
    combine_account,
)

__all__ = [
    # Features
    "engineer_features",
    "compute_frequency_features",
    "get_account_transactions",
    "get_account_features",
    # Rule scorer
    "score_transaction",
    "score_account",
    "risk_band_from_score",
    "WEIGHTS",
    # ML scorer
    "load_model",
    "predict_fraud_probability",
    "MODEL_INPUT_FEATURES",
    # Combine
    "combine_scores",
    "combine_account",
]
