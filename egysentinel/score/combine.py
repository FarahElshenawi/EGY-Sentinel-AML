"""
EGY-Sentinel AML — Score Combiner (DS-1/3)
============================================

Combines the rule-based score and the ML probability into a single
final risk score using the hybrid formula from DS-1/3's notebook
(cell 62):

    final_score = 0.5 * rule_score + 0.5 * ml_prob * 100

This hybrid design is deliberate: the rule score provides regulatory-
friendly, fully auditable signal that is robust to model drift, while
the ML probability captures subtler, non-linear fraud patterns the
rules cannot express alone.

Public API:
    combine_scores(rule_score, ml_score=None) -> float
    combine_account(account_id, df) -> dict
        Full pipeline: rule_scorer + ml_scorer + combine
"""
from __future__ import annotations

import logging
from typing import Any

import pandas as pd

from .rule_scorer import score_account as rule_score_account, risk_band_from_score
from .ml_scorer import predict_fraud_probability

logger = logging.getLogger(__name__)


# ─── Hybrid formula weights (from notebook cell 62) ──────────────────

WEIGHT_RULE = 0.5
WEIGHT_ML = 0.5


def combine_scores(
    rule_score: float,
    ml_score: float | None = None,
) -> float:
    """Combine a rule score (0-100) and an ML score (0-100) into a final score.

    Formula:
        final = 0.5 * rule_score + 0.5 * ml_score

    If ml_score is None (model unavailable or not yet loaded), degrades
    to rule-only scoring:
        final = rule_score

    Args:
        rule_score: Rule-based score (0-100).
        ml_score: ML-derived score (0-100). None to skip ML.

    Returns:
        Final combined score (0-100), clamped.
    """
    if ml_score is None:
        # Rule-only fallback — ML unavailable
        return max(0.0, min(100.0, float(rule_score)))

    final = WEIGHT_RULE * float(rule_score) + WEIGHT_ML * float(ml_score)
    return max(0.0, min(100.0, final))


# ─── Full account scoring pipeline ───────────────────────────────────

def combine_account(
    account_id: str,
    df: pd.DataFrame,
    use_ml: bool = True,
) -> dict[str, Any]:
    """Run the full scoring pipeline on an account.

    1. Rule-score the account (always — auditable, deterministic)
    2. ML-score the account (optional — falls back if model unavailable)
    3. Combine using the hybrid formula
    4. Compute final risk band

    Args:
        account_id: PaySim account ID.
        df: PaySim-format DataFrame.
        use_ml: Whether to attempt ML scoring (default True). If the
                model can't be loaded, falls back to rule-only automatically.

    Returns:
        Dict with:
            account_id: str
            rule_score: float (0-100)
            ml_prob: float (0-1) or None if ML unavailable
            ml_score: float (0-100) or None if ML unavailable
            risk_score: float (0-100) — combined final score
            risk_band: str ("low" | "medium" | "high")
            transaction_count: int
            pattern_count: int  (always 0 — set by graph layer)
            ml_used: bool  (True if ML scoring succeeded)
    """
    # 1. Rule score
    rule_result = rule_score_account(account_id, df)
    rule_score = rule_result["risk_score"]

    # 2. ML score (optional)
    ml_result = None
    ml_prob = None
    ml_score = None
    ml_used = False

    if use_ml:
        try:
            ml_result = predict_fraud_probability(account_id, df)
            if "error" not in ml_result:
                ml_prob = ml_result["ml_prob"]
                ml_score = ml_result["ml_score"]
                ml_used = True
            else:
                logger.warning(
                    f"ML scoring returned error for {account_id}: "
                    f"{ml_result.get('error')}. Falling back to rule-only."
                )
        except Exception as e:
            logger.warning(
                f"ML scoring failed for {account_id}: {e}. "
                f"Falling back to rule-only."
            )

    # 3. Combine
    final_score = combine_scores(rule_score, ml_score)
    risk_band = risk_band_from_score(final_score)

    logger.info(
        f"Combined score for {account_id} | "
        f"rule={rule_score:.1f} | ml={ml_score if ml_score is not None else 'N/A'} | "
        f"final={final_score:.1f} | band={risk_band} | ml_used={ml_used}"
    )

    return {
        "account_id": account_id,
        "rule_score": rule_score,
        "ml_prob": ml_prob,
        "ml_score": ml_score,
        "risk_score": round(final_score, 2),
        "risk_band": risk_band,
        "transaction_count": rule_result["transaction_count"],
        "pattern_count": 0,  # set by graph detector layer, not scoring
        "ml_used": ml_used,
    }
