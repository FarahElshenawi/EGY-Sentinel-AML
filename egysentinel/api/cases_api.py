"""
EGY-Sentinel AML — Cases Summary API

Returns a pre-computed list of case summaries with the CORRECT risk score
from combine_account() — not the detector's pattern confidence score.

This solves the inconsistency where /detect shows score_raw*100 (detector
confidence) but /investigate shows the real risk score (rule + ML hybrid).
"""
import logging
from typing import Any

import pandas as pd
from fastapi import APIRouter
from pydantic import BaseModel, Field

from data.loader import load_sample, _ensure_patterns_cache
from egysentinel.score.combine import combine_account
from egysentinel.score.rule_scorer import risk_band_from_score

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["cases"])


class CaseSummary(BaseModel):
    account_id: str
    pattern_type: str
    pattern_label: str
    risk_score: float = Field(..., ge=0, le=100)
    risk_band: str
    priority: str
    accounts_in_pattern: int
    total_amount: float
    description: str


class CasesSummaryResponse(BaseModel):
    cases: list[CaseSummary]
    total: int
    stats: dict


def _pattern_label(detector: str) -> str:
    return {
        "circular": "Circular",
        "fan_out": "Fan-Out",
        "dense_cluster": "Dense Cluster",
    }.get(detector, "None")


def _priority_from_score(score: float) -> str:
    if score >= 85:
        return "critical"
    elif score >= 66:
        return "high"
    elif score >= 31:
        return "medium"
    return "low"


@router.get("/cases", response_model=CasesSummaryResponse)
async def get_cases_summary():
    """Get a list of all cases with the CORRECT risk score.

    This endpoint runs both the pattern detectors AND the risk scorer,
    so the score shown here matches the score in /investigate.

    Without this endpoint, the cases page would show score_raw*100
    (detector confidence) which is a different metric than the risk
    score (rule + ML hybrid).
    """
    try:
        df = load_sample()
    except FileNotFoundError:
        return CasesSummaryResponse(cases=[], total=0, stats={})

    # 1. Run pattern detection → get patterns per account
    patterns_by_account = _ensure_patterns_cache(df)

    # 2. For each flagged account, run the REAL risk scorer
    cases: list[CaseSummary] = []
    seen_accounts: set[str] = set()

    for account_id, account_patterns in patterns_by_account.items():
        if account_id in seen_accounts:
            continue
        seen_accounts.add(account_id)

        # Get the best (highest-scoring) pattern for this account
        best_pattern = max(account_patterns, key=lambda p: p.get("score_raw", 0))
        pattern_type = best_pattern["detector"]
        accounts_in_pattern = len(best_pattern.get("accounts", []))

        # Get the REAL risk score from combine_account()
        try:
            score_result = combine_account(account_id, df, use_ml=True)
            risk_score = score_result["risk_score"]
            risk_band = score_result["risk_band"]
        except Exception as e:
            logger.warning(f"Scoring failed for {account_id}: {e}")
            risk_score = 0.0
            risk_band = "low"

        # Compute total amount from the pattern evidence
        total_amount = best_pattern.get("evidence", {}).get("total_amount", 0.0)

        cases.append(CaseSummary(
            account_id=account_id,
            pattern_type=pattern_type,
            pattern_label=_pattern_label(pattern_type),
            risk_score=risk_score,
            risk_band=risk_band,
            priority=_priority_from_score(risk_score),
            accounts_in_pattern=accounts_in_pattern,
            total_amount=total_amount,
            description=f"{_pattern_label(pattern_type)} pattern · {accounts_in_pattern} accounts",
        ))

    # Sort by risk score descending
    cases.sort(key=lambda c: c.risk_score, reverse=True)

    # Build stats
    stats = {
        "total_cases": len(cases),
        "critical": len([c for c in cases if c.priority == "critical"]),
        "high": len([c for c in cases if c.priority == "high"]),
        "medium": len([c for c in cases if c.priority == "medium"]),
        "low": len([c for c in cases if c.priority == "low"]),
        "circular": len([c for c in cases if c.pattern_type == "circular"]),
        "fan_out": len([c for c in cases if c.pattern_type == "fan_out"]),
        "dense_cluster": len([c for c in cases if c.pattern_type == "dense_cluster"]),
    }

    return CasesSummaryResponse(cases=cases, total=len(cases), stats=stats)
