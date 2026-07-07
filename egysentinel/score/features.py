"""
EGY-Sentinel AML — Feature Engineering (DS-1/3)
=================================================

Ports the feature engineering logic from DS-1/3's
paysim-fraud-detection.ipynb (cell 38) into a reusable module.

All features are derived ONLY from information available at transaction
time — no future leakage. This module is shared by both:
  - rule_scorer.py (uses derived flags)
  - ml_scorer.py   (feeds all features to the trained RandomForest)

Public API:
    engineer_features(df) -> pd.DataFrame
        Adds 10 engineered columns to the input DataFrame.

    get_account_transactions(account_id, df) -> pd.DataFrame
        Filters all transactions where account_id is sender OR receiver.

    compute_frequency_features(df) -> pd.DataFrame
        Adds sender_frequency and receiver_frequency columns.
        Computed on the FULL DataFrame (no train/test leak in demo mode).
"""
from __future__ import annotations

import numpy as np
import pandas as pd


# ─── Row-level feature engineering (leakage-safe) ─────────────────────

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add all engineered features to a PaySim-format DataFrame.

    Input columns required:
        step, type, amount, nameOrig, nameDest,
        oldbalanceOrg, newbalanceOrig, oldbalanceDest, newbalanceDest

    Columns added:
        log_amount, balance_diff_orig, balance_diff_dest,
        balance_diff_ratio, orig_balance_drained, dest_balance_zero_both,
        errorBalanceOrig, errorBalanceDest, high_amount_flag, hour_of_day
    """
    df = df.copy()

    # 1. Log-transformed amount (stabilizes heavy right skew)
    df["log_amount"] = np.log1p(df["amount"].clip(lower=0))

    # 2. Raw balance differences
    df["balance_diff_orig"] = df["newbalanceOrig"] - df["oldbalanceOrg"]
    df["balance_diff_dest"] = df["newbalanceDest"] - df["oldbalanceDest"]

    # 3. Ratio-based balance change (safe division)
    df["balance_diff_ratio"] = df["balance_diff_orig"] / (df["oldbalanceOrg"] + 1)

    # 4. Balance drained indicator: sender had money, now has exactly zero
    df["orig_balance_drained"] = (
        (df["oldbalanceOrg"] > 0) & (df["newbalanceOrig"] == 0)
    ).astype(int)

    # 5. Destination "mule account" indicator: zero balance before AND after
    df["dest_balance_zero_both"] = (
        (df["oldbalanceDest"] == 0) & (df["newbalanceDest"] == 0)
    ).astype(int)

    # 6. Balance error features (known strong PaySim fraud signals)
    df["errorBalanceOrig"] = df["newbalanceOrig"] + df["amount"] - df["oldbalanceOrg"]
    df["errorBalanceDest"] = df["oldbalanceDest"] + df["amount"] - df["newbalanceDest"]

    # 7. High-amount flag: above the 99th percentile
    amount_99th = df["amount"].quantile(0.99) if len(df) > 0 else 0
    df["high_amount_flag"] = (df["amount"] > amount_99th).astype(int)

    # 8. Cyclical time feature: hour of day derived from simulated step
    df["hour_of_day"] = df["step"] % 24

    return df


def compute_frequency_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add sender_frequency and receiver_frequency columns.

    In the original notebook, these were computed from the TRAINING set
    only to avoid leakage. For the demo (no train/test split), we compute
    them on the full dataset — acceptable for a demo, would need to be
    re-fit on a training set for production.

    Unseen accounts get a default frequency of 1 (i.e., "new account").
    """
    df = df.copy()

    orig_freq_map = df["nameOrig"].value_counts()
    dest_freq_map = df["nameDest"].value_counts()

    df["sender_frequency"] = (
        df["nameOrig"].map(orig_freq_map).fillna(1).astype(int)
    )
    df["receiver_frequency"] = (
        df["nameDest"].map(dest_freq_map).fillna(1).astype(int)
    )

    return df


# ─── Account-level helpers ───────────────────────────────────────────

def get_account_transactions(
    account_id: str,
    df: pd.DataFrame,
) -> pd.DataFrame:
    """Filter all transactions where account_id is sender OR receiver."""
    mask = (df["nameOrig"] == account_id) | (df["nameDest"] == account_id)
    return df.loc[mask].copy()


def get_account_features(
    account_id: str,
    df: pd.DataFrame,
) -> pd.DataFrame:
    """Return the engineered feature DataFrame for one account.

    Convenience function: filters transactions for the account, engineers
    features, computes frequency features, returns the full feature set
    ready for ML scoring.
    """
    account_df = get_account_transactions(account_id, df)
    if account_df.empty:
        return account_df
    account_df = engineer_features(account_df)
    account_df = compute_frequency_features(account_df)
    return account_df
