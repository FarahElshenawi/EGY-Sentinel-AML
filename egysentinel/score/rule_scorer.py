"""
EGY-Sentinel AML — Rule-Based Risk Scorer (DS-1/3)
====================================================

Ports the rule-based scoring function from DS-1/3's
paysim-fraud-detection.ipynb (cell 56) into a reusable module.

The rule scorer is a transparent, auditable fraud-risk score (0-100)
computed from 7 human-interpretable business rules. It operates on
transaction-level features and aggregates to an account-level score
by averaging across all of an account's transactions.

Rule weights (sum to 100):
    Rule 1: type is TRANSFER or CASH_OUT                          +25
    Rule 2: amount above 99th percentile (high_amount_flag)       +20
    Rule 3: sender balance fully drained (orig_balance_drained)   +25
    Rule 4: receiver is zero-balance "mule" (dest_balance_zero_both) +15
    Rule 5: high sender frequency (top 1%)                        +10
    Rule 6: high receiver frequency (top 1%)                      +10
    Rule 7: significant balance error                             +15
                                                                  ----
                                                                    120 (capped at 100)

Risk bands (per locked account.json schema):
    low:      0 - 30
    medium:  31 - 65
    high:    66 - 100

Public API:
    score_transaction(row, sender_freq_99, receiver_freq_99, error_threshold) -> int
    score_account(account_id, df) -> dict
    risk_band_from_score(score) -> str
"""
from __future__ import annotations

import logging
from typing import Any

import pandas as pd

from .features import (
    engineer_features,
    compute_frequency_features,
    get_account_transactions,
)

logger = logging.getLogger(__name__)


# ─── Rule weights (auditable, sum to 100 before cap) ─────────────────

WEIGHTS: dict[str, int] = {
    "risky_type": 25,           # TRANSFER or CASH_OUT
    "high_amount": 20,          # above 99th percentile
    "balance_drained": 25,      # sender account drained
    "mule_receiver": 15,        # zero-balance receiver
    "high_sender_freq": 10,     # top 1% sender frequency
    "high_receiver_freq": 10,   # top 1% receiver frequency
    "balance_error": 15,        # significant balance mismatch
}


# ─── Transaction-level scorer ────────────────────────────────────────

def score_transaction(
    row: pd.Series,
    sender_freq_99: float,
    receiver_freq_99: float,
    error_threshold: float,
) -> int:
    """Compute the rule-based risk score (0-100) for a single transaction.

    Args:
        row: A pandas Series with engineered features
             (must have: type, high_amount_flag, orig_balance_drained,
              dest_balance_zero_both, sender_frequency, receiver_frequency,
              errorBalanceOrig, errorBalanceDest).
        sender_freq_99: 99th percentile of sender_frequency (training set).
        receiver_freq_99: 99th percentile of receiver_frequency (training set).
        error_threshold: 95th percentile of |errorBalanceOrig| (training set).

    Returns:
        Integer score 0-100.
    """
    score = 0

    # Rule 1: risky transaction type
    if row.get("type") in ("TRANSFER", "CASH_OUT"):
        score += WEIGHTS["risky_type"]

    # Rule 2: unusually large transaction amount
    if row.get("high_amount_flag", 0) == 1:
        score += WEIGHTS["high_amount"]

    # Rule 3: sender account fully drained
    if row.get("orig_balance_drained", 0) == 1:
        score += WEIGHTS["balance_drained"]

    # Rule 4: receiver looks like a pass-through "mule" account
    if row.get("dest_balance_zero_both", 0) == 1:
        score += WEIGHTS["mule_receiver"]

    # Rule 5: sender is a top-1% most-frequent account
    if row.get("sender_frequency", 0) >= sender_freq_99:
        score += WEIGHTS["high_sender_freq"]

    # Rule 6: receiver is a top-1% most-frequent account
    if row.get("receiver_frequency", 0) >= receiver_freq_99:
        score += WEIGHTS["high_receiver_freq"]

    # Rule 7: significant balance-accounting mismatch
    if (
        abs(row.get("errorBalanceOrig", 0)) > error_threshold
        or abs(row.get("errorBalanceDest", 0)) > error_threshold
    ):
        score += WEIGHTS["balance_error"]

    return min(score, 100)


# ─── Account-level scorer ────────────────────────────────────────────

def score_account(
    account_id: str,
    df: pd.DataFrame,
) -> dict[str, Any]:
    """Compute the rule-based risk score for an account.

    Engineers features on the full DataFrame, filters to the account's
    transactions, scores each transaction, and returns the AVERAGE score
    plus the account-level risk band.

    Args:
        account_id: The PaySim account ID (nameOrig or nameDest).
        df: PaySim-format DataFrame with at minimum: step, type, amount,
            nameOrig, nameDest, oldbalanceOrg, newbalanceOrig,
            oldbalanceDest, newbalanceDest.

    Returns:
        Dict with:
            account_id: str
            risk_score: float (0-100)
            risk_band: str ("low" | "medium" | "high")
            transaction_count: int
            max_transaction_score: int
            scores: list[int]  (per-transaction scores)
    """
    if df is None or df.empty:
        return {
            "account_id": account_id,
            "risk_score": 0.0,
            "risk_band": "low",
            "transaction_count": 0,
            "max_transaction_score": 0,
            "scores": [],
        }

    # Engineer features on the full DataFrame (needed for frequency features)
    df_featured = engineer_features(df)
    df_featured = compute_frequency_features(df_featured)

    # Compute thresholds from the full dataset
    # (In production these would come from the training set only.)
    sender_freq_99 = df_featured["sender_frequency"].quantile(0.99)
    receiver_freq_99 = df_featured["receiver_frequency"].quantile(0.99)
    error_threshold = df_featured["errorBalanceOrig"].abs().quantile(0.95)

    # Filter to this account's transactions
    account_df = get_account_transactions(account_id, df_featured)

    if account_df.empty:
        logger.info(f"Account {account_id} has no transactions — score 0")
        return {
            "account_id": account_id,
            "risk_score": 0.0,
            "risk_band": "low",
            "transaction_count": 0,
            "max_transaction_score": 0,
            "scores": [],
        }

    # Score each transaction
    scores = account_df.apply(
        lambda row: score_transaction(
            row, sender_freq_99, receiver_freq_99, error_threshold
        ),
        axis=1,
    ).tolist()

    avg_score = sum(scores) / len(scores)
    max_score = max(scores) if scores else 0
    risk_band = risk_band_from_score(avg_score)

    logger.info(
        f"Account {account_id} | {len(scores)} txns | "
        f"avg_score={avg_score:.1f} | max={max_score} | band={risk_band}"
    )

    return {
        "account_id": account_id,
        "risk_score": round(avg_score, 2),
        "risk_band": risk_band,
        "transaction_count": len(scores),
        "max_transaction_score": max_score,
        "scores": scores,
    }


# ─── Risk band helper ────────────────────────────────────────────────

def risk_band_from_score(score: float) -> str:
    """Map a 0-100 score to a risk band per locked account.json schema.

    Bands:
        low:    0  - 30
        medium: 31 - 65
        high:   66 - 100
    """
    if score <= 30:
        return "low"
    elif score <= 65:
        return "medium"
    else:
        return "high"
