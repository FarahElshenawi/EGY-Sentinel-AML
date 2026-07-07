"""
evidence.py — Evidence Assembly Helper for Case Builder Agent (AI-3)

Assembles the evidence JSON object that serves as input to the Case Builder Agent.
Pulls involved accounts, related transactions, pattern type, and risk score
from the alert data, graph patterns (patterns.csv), and the transaction DataFrame.

Usage:
    from agents.evidence import assemble_evidence
    evidence = assemble_evidence(
        account_id="C123456789",
        transactions_df=df,
        patterns_csv="data/patterns.csv",
        alert_id="ALERT-000001",
        risk_score=85.0,
        risk_band="high"
    )
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import pandas as pd


def load_patterns(patterns_csv: str | Path) -> pd.DataFrame:
    """Load the patterns.csv exported by DS-2's graph detectors.

    Expected columns: account_id, pattern_type, description, confidence (optional)
    """
    path = Path(patterns_csv)
    if not path.exists():
        return pd.DataFrame(columns=["account_id", "pattern_type", "description", "confidence"])

    df = pd.read_csv(path)
    return df


def get_involved_transactions(
    account_id: str,
    transactions_df: pd.DataFrame,
    max_transactions: int = 50,
) -> list[dict[str, Any]]:
    """Extract all transactions involving the flagged account.

    Filters rows where the account is either sender (nameOrig) or receiver (nameDest),
    sorts by step (chronological), and limits to max_transactions.

    Args:
        account_id: The flagged account ID.
        transactions_df: Full transaction DataFrame (from 50K sample).
        max_transactions: Safety cap to prevent oversized evidence.

    Returns:
        List of transaction dicts with keys: step, nameOrig, nameDest, amount, type.
    """
    if transactions_df is None or transactions_df.empty:
        return []

    required_cols = ["step", "nameOrig", "nameDest", "amount", "type"]
    missing = [c for c in required_cols if c not in transactions_df.columns]
    if missing:
        raise ValueError(f"Transaction DataFrame missing columns: {missing}")

    # Filter transactions where account is sender OR receiver
    mask = (transactions_df["nameOrig"] == account_id) | (
        transactions_df["nameDest"] == account_id
    )
    involved = transactions_df.loc[mask, required_cols].sort_values("step")

    # Cap to prevent oversized evidence payloads
    if len(involved) > max_transactions:
        involved = involved.head(max_transactions)

    return involved.to_dict(orient="records")


def get_involved_accounts(
    account_id: str,
    transactions: list[dict[str, Any]],
) -> list[str]:
    """Extract unique account IDs from a list of transactions.

    The subject account is always first in the list.

    Args:
        account_id: The primary flagged account.
        transactions: List of transaction dicts.

    Returns:
        Ordered list of unique account IDs (subject first).
    """
    accounts_set = {account_id}

    for txn in transactions:
        accounts_set.add(txn.get("nameOrig", ""))
        accounts_set.add(txn.get("nameDest", ""))

    # Remove empty strings
    accounts_set.discard("")

    # Subject account always first
    result = [account_id]
    for acc in sorted(accounts_set):
        if acc != account_id:
            result.append(acc)

    return result


def get_pattern_for_account(
    account_id: str,
    patterns_df: pd.DataFrame,
) -> tuple[Optional[str], Optional[dict[str, Any]]]:
    """Look up the detected pattern for a given account from patterns.csv.

    Args:
        account_id: The flagged account.
        patterns_df: DataFrame from patterns.csv.

    Returns:
        Tuple of (pattern_type, pattern_details_dict).
        pattern_type is one of: circular, fan_out, fan_in, layering, dense_cluster.
        pattern_details contains description and optional confidence.
    """
    if patterns_df.empty:
        return None, None

    match = patterns_df[patterns_df["account_id"] == account_id]

    if match.empty:
        return None, None

    row = match.iloc[0]
    pattern_type = str(row.get("pattern_type", ""))

    details: dict[str, Any] = {}
    if "description" in row and pd.notna(row["description"]):
        details["description"] = str(row["description"])
    if "confidence" in row and pd.notna(row["confidence"]):
        details["detector_confidence"] = float(row["confidence"])

    return pattern_type, details if details else None


def assemble_evidence(
    account_id: str,
    transactions_df: pd.DataFrame,
    alert_id: str,
    risk_score: float,
    risk_band: str,
    patterns_csv: str | Path = "data/patterns.csv",
) -> dict[str, Any]:
    """Assemble the complete evidence object for the Case Builder Agent.

    This is the main entry point. It gathers all data needed by the Case Builder
    to produce a SAR-style investigation report:
      - Alert metadata (account_id, alert_id, risk_score, risk_band)
      - Pattern detection results (from DS-2's patterns.csv)
      - All involved accounts
      - All related transactions (chronological)

    Args:
        account_id: The flagged high-risk account under investigation.
        transactions_df: The 50K sample transaction DataFrame.
        alert_id: Reference to the alert from AI-2.
        risk_score: Combined risk score (0-100) from DS-3's scoring pipeline.
        risk_band: Risk classification: low, medium, high, or critical.
        patterns_csv: Path to patterns.csv from DS-2.

    Returns:
        Evidence dict conforming to schemas/evidence.json.
    """
    # 1. Load patterns for this account
    patterns_df = load_patterns(patterns_csv)
    pattern_type, pattern_details = get_pattern_for_account(account_id, patterns_df)

    # 2. Get all transactions involving this account
    transactions = get_involved_transactions(account_id, transactions_df)

    # 3. Get all unique involved accounts
    accounts = get_involved_accounts(account_id, transactions)

    # 4. Build evidence object
    evidence: dict[str, Any] = {
        "account_id": account_id,
        "alert_id": alert_id,
        "risk_score": float(risk_score),
        "risk_band": risk_band,
        "pattern_type": pattern_type,
        "accounts": accounts,
        "transactions": transactions,
    }

    # 5. Attach optional pattern details if available
    if pattern_details is not None:
        evidence["pattern_details"] = pattern_details

    return evidence