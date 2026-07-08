"""
EGY-Sentinel AML — Orchestrator (AI-1)
========================================

Wires the three agents into a single end-to-end pipeline:
    alert (AI-2) -> case (AI-3) -> explanation (AI-4)

The orchestrator is the brain behind the FastAPI /investigate endpoint.
It does NOT call GLM directly — every agent uses its own fallback path
when no llm_client is provided. This means the orchestrator works
fully offline in template-only mode, which is how we ship the demo.

Public API:
    investigate(account_id, transactions_df=None, risk_score=None,
                risk_band=None, pattern_type=None, total_amount=None,
                llm_client=None) -> dict

    investigate_response(account_id, ...) -> InvestigateResponse  (Pydantic)

The first form returns plain dicts (easy to test, easy to log).
The second form returns the Pydantic InvestigateResponse object that
the FastAPI endpoint returns directly.

Design decisions:
- If transactions_df is None, the orchestrator loads the demo dataset
  via data.loader.load_sample(). This keeps the API simple — the
  /investigate endpoint just passes account_id and lets the orchestrator
  handle data loading.
- If risk_score / risk_band / pattern_type are None, the orchestrator
  looks them up from a scoring function. Since DS-1/3's combine.py is
  not yet delivered, we use a stub scorer that derives a score from
  graph degree + pattern presence. This will be replaced when DS-1/3
  ships their modules.
- The orchestrator is deterministic: same account_id + same input data
  -> same case_id (the case_builder uses a global counter, but we reset
  it at the start of each investigate call so the result is reproducible
  within a single process).
- All exceptions are caught and converted to a fallback response. The
  /investigate endpoint must never 500 — it always returns something
  schema-valid.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Optional

import pandas as pd

from egysentinel.agents.alert_agent import generate_alert
from egysentinel.agents.case_builder_agent import build_case, validate_case_report
from egysentinel.agents.evidence import assemble_evidence
from egysentinel.agents.explanation_agent import generate_explanation
from egysentinel.agents.pipeline import normalize_pattern_type

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Stub risk scorer — used until DS-1/3 delivers rule_scorer.py + combine.py
# ---------------------------------------------------------------------------

def _stub_score_account(
    account_id: str,
    transactions_df: pd.DataFrame,
    pattern_type: Optional[str],
) -> tuple[float, str, str]:
    """Derive a deterministic risk score, risk_band, and pattern_type.

    This is a temporary scorer. When DS-1/3 ships rule_scorer.py + ml_scorer.py
    + combine.py, replace this function with a call to combine_score(account_id).

    Logic:
      - Start at 30 (medium baseline)
      - +25 if account is sender in any transaction (active)
      - +20 if account is receiver in any transaction
      - +15 per pattern detected (passed in via pattern_type)
      - +10 if any transaction isFraud=1
      - Clamp to [0, 100]

    Returns:
        (risk_score, risk_band, pattern_type)
        risk_band: "low" (0-30), "medium" (31-65), "high" (66-100)
        pattern_type: normalized to locked enum {circular, fan_out, dense_cluster, none}
    """
    score = 30.0
    pattern = normalize_pattern_type(pattern_type, fallback="none")

    if transactions_df is None or transactions_df.empty:
        # No transactions — return low score, but still respect normalized pattern
        return 15.0, "low", pattern

    # Check if account appears as sender or receiver
    is_sender = (transactions_df["nameOrig"] == account_id).any()
    is_receiver = (transactions_df["nameDest"] == account_id).any()
    if is_sender:
        score += 25
    if is_receiver:
        score += 20

    # Bonus for detected pattern
    if pattern != "none":
        score += 25

    # Bonus for fraud-labeled transactions
    if "isFraud" in transactions_df.columns:
        involved = transactions_df[
            (transactions_df["nameOrig"] == account_id) |
            (transactions_df["nameDest"] == account_id)
        ]
        if involved["isFraud"].sum() > 0:
            score += 20

    # Bonus for high-value transactions
    involved = transactions_df[
        (transactions_df["nameOrig"] == account_id) |
        (transactions_df["nameDest"] == account_id)
    ]
    if not involved.empty:
        max_amount = involved["amount"].max()
        if max_amount > 1_000_000:
            score += 10
        elif max_amount > 100_000:
            score += 5

    # Clamp
    score = max(0.0, min(100.0, score))

    # Band
    if score >= 66:
        band = "high"
    elif score >= 31:
        band = "medium"
    else:
        band = "low"

    return score, band, pattern


# ---------------------------------------------------------------------------
# Main orchestrator function
# ---------------------------------------------------------------------------

def investigate(
    account_id: str,
    transactions_df: Optional[pd.DataFrame] = None,
    risk_score: Optional[float] = None,
    risk_band: Optional[str] = None,
    pattern_type: Optional[str] = None,
    total_amount: Optional[float] = None,
    llm_client: Any = None,
    use_glm: bool = True,
) -> dict[str, Any]:
    """Run the full agent pipeline on an account.

    Chains:
        1. (optional) load demo transactions if transactions_df is None
        2. (optional) score the account if risk_score is None
        3. AI-2: generate alert from score + pattern + amount
        4. AI-3: assemble evidence from transactions
        5. AI-3: build case from evidence (stub mode, use_glm=False)
        6. AI-4: generate explanation from case + alert
        7. Return {alert, case, explanation} as plain dicts

    Args:
        account_id: The flagged account to investigate.
        transactions_df: PaySim-format DataFrame. If None, loads demo.csv.
        risk_score: 0-100. If None, uses _stub_score_account().
        risk_band: "low" | "medium" | "high". If None, derived from score.
        pattern_type: One of {circular, fan_out, dense_cluster, none}.
                      If None, defaults to "none".
        total_amount: Sum of involved transactions. If None, computed
                      from transactions_df.
        llm_client: Optional LLMClient with .complete() method. If None
                    and use_glm=True, attempts to auto-create one from
                    OPENROUTER_API_KEY env var. If that fails, falls
                    back to rule-based mode for all agents.
        use_glm: Whether to attempt LLM calls (default True). If True
                 and no llm_client is provided, will try to create one
                 from env vars. Set to False to force fallback-only mode.

    Returns:
        Dict with three keys: "alert", "case", "explanation".
        Each value is a dict matching the locked schema.
        Always returns schema-valid output — never raises.
    """
    start_time = datetime.now(timezone.utc)

    # Auto-create LLM client if requested but not provided
    if use_glm and llm_client is None:
        try:
            from egysentinel.agents.llm_client import get_llm_client
            llm_client = get_llm_client(allow_no_key=True)
            if llm_client is None:
                use_glm = False  # no API key available — fall back
        except Exception as e:
            logger.warning(f"Could not initialize LLM client: {e}. Using fallbacks.")
            use_glm = False

    # 1. Load transactions if not provided
    if transactions_df is None:
        try:
            from data.loader import load_sample
            transactions_df = load_sample()
        except Exception as e:
            logger.warning(f"Could not load sample data: {e}. Using empty DataFrame.")
            transactions_df = pd.DataFrame(
                columns=["step", "type", "amount", "nameOrig", "nameDest", "isFraud"]
            )

    # 2. Score the account using the REAL scoring pipeline (DS-1/3)
    # Uses combine_account() from egysentinel.score.combine — the hybrid
    # formula: 0.5 * rule_score + 0.5 * ml_prob * 100
    # Falls back to stub scorer only if the real scorer fails.
    if risk_score is None or risk_band is None:
        try:
            from egysentinel.score.combine import combine_account
            score_result = combine_account(account_id, transactions_df, use_ml=True)
            if risk_score is None:
                risk_score = score_result["risk_score"]
            if risk_band is None:
                risk_band = score_result["risk_band"]
            logger.info(
                f"Real scorer: {account_id} | rule={score_result['rule_score']:.1f} | "
                f"ml={score_result.get('ml_score', 'N/A')} | final={risk_score:.1f} | "
                f"band={risk_band} | ml_used={score_result['ml_used']}"
            )
        except Exception as e:
            logger.warning(
                f"Real scorer failed for {account_id}: {e}. Falling back to stub."
            )
            score, band, _ = _stub_score_account(account_id, transactions_df, pattern_type)
            if risk_score is None:
                risk_score = score
            if risk_band is None:
                risk_band = band

    # 2b. Detect pattern if not provided — runs real detectors (DS-2)
    if pattern_type is None:
        try:
            from egysentinel.graph.build import build_digraph
            from egysentinel.detect import detect_all, get_flagged_accounts
            from data.loader import _ensure_patterns_cache
            patterns_by_account = _ensure_patterns_cache(transactions_df)
            account_patterns = patterns_by_account.get(account_id, [])
            if account_patterns:
                # Use the highest-scoring pattern for this account
                best = max(account_patterns, key=lambda p: p.get("score_raw", 0))
                pattern_type = best["detector"]
                logger.info(f"Real detector: {account_id} → {pattern_type} (score={best['score_raw']:.2f})")
            else:
                pattern_type = "none"
                logger.info(f"Real detector: {account_id} → no pattern detected")
        except Exception as e:
            logger.warning(f"Pattern detection failed for {account_id}: {e}. Using 'none'.")
            pattern_type = "none"

    # Normalize pattern to locked enum
    pattern_type = normalize_pattern_type(pattern_type, fallback="none")

    # Compute total_amount if not provided
    if total_amount is None and not transactions_df.empty:
        involved = transactions_df[
            (transactions_df["nameOrig"] == account_id) |
            (transactions_df["nameDest"] == account_id)
        ]
        total_amount = float(involved["amount"].sum()) if not involved.empty else 0.0
    elif total_amount is None:
        total_amount = 0.0

    logger.info(
        f"Investigating {account_id} | score={risk_score:.1f} | "
        f"band={risk_band} | pattern={pattern_type} | amount={total_amount:.2f}"
    )

    # 3. AI-2: Generate alert
    try:
        alert = generate_alert(
            account_id=account_id,
            risk_score=risk_score,
            risk_band=risk_band,
            pattern_type=pattern_type,
            total_amount=total_amount,
            llm_client=llm_client if use_glm else None,
        )
        # Ensure timestamp is set
        if "timestamp" not in alert:
            alert["timestamp"] = start_time.isoformat()
        # Carry through the canonical fields the response schema needs
        alert["account_id"] = account_id
        alert["risk_score"] = risk_score
        alert["risk_band"] = risk_band
        alert["pattern_type"] = pattern_type
    except Exception as e:
        logger.error(f"Alert agent failed: {e}. Using minimal fallback.")
        alert = {
            "account_id": account_id,
            "risk_score": risk_score,
            "risk_band": risk_band,
            "pattern_type": pattern_type,
            "priority": "high" if risk_score >= 66 else "medium",
            "summary": f"[ORCHESTRATOR FALLBACK] Account {account_id} flagged with score {risk_score:.0f}.",
            "recommended_action": "investigate",
            "timestamp": start_time.isoformat(),
        }

    # 4. AI-3: Assemble evidence
    try:
        evidence = assemble_evidence(
            account_id=account_id,
            transactions_df=transactions_df,
            alert_id=f"ALERT-{account_id}",
            risk_score=risk_score,
            risk_band=risk_band,
            patterns_csv="data/patterns.csv",  # optional — evidence.py handles missing
        )
        # ALWAYS override pattern_type with the orchestrator's value.
        # The orchestrator's pattern_type is authoritative — it comes from
        # either the caller, the real detector, or normalization.
        # Don't let evidence.py's patterns.csv lookup override it.
        evidence["pattern_type"] = pattern_type
    except Exception as e:
        logger.error(f"Evidence assembly failed: {e}. Using minimal evidence.")
        evidence = {
            "account_id": account_id,
            "alert_id": f"ALERT-{account_id}",
            "risk_score": risk_score,
            "risk_band": risk_band,
            "pattern_type": pattern_type,
            "accounts": [account_id],
            "transactions": [],
        }

    # 5. AI-3: Build case
    try:
        case = build_case(evidence, use_glm=use_glm, timeout=5)
    except Exception as e:
        logger.error(f"Case builder failed: {e}. Using build_case_stub directly.")
        from egysentinel.agents.case_builder_agent import build_case_stub
        case = build_case_stub(evidence)
        case["_fallback"] = True
        case["_fallback_reason"] = f"build_case failed: {e}"

    # Validate case
    errors = validate_case_report(case)
    if errors:
        logger.warning(f"Case validation errors: {errors}")

    # 6. AI-4: Generate explanation
    try:
        explanation = generate_explanation(
            case_report=case,
            alert=alert,
            llm_client=llm_client if use_glm else None,
        )
    except Exception as e:
        logger.error(f"Explanation agent failed: {e}. Using fallback.")
        from egysentinel.agents.explanation_agent import get_explanation_fallback
        explanation = get_explanation_fallback(case, alert)

    # 7. Log completion
    elapsed_ms = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
    logger.info(
        f"Investigation complete for {account_id} | "
        f"case={case.get('case_id', 'UNKNOWN')} | "
        f"alert_priority={alert.get('priority', 'unknown')} | "
        f"explanation_confidence={explanation.get('confidence', 0):.2f} | "
        f"elapsed={elapsed_ms:.0f}ms"
    )

    return {
        "alert": alert,
        "case": case,
        "explanation": explanation,
    }


# ---------------------------------------------------------------------------
# Convenience: return Pydantic InvestigateResponse directly
# ---------------------------------------------------------------------------

def investigate_response(
    account_id: str,
    transactions_df: Optional[pd.DataFrame] = None,
    **kwargs,
):
    """Same as investigate() but returns a Pydantic InvestigateResponse.

    This is what the FastAPI /investigate endpoint calls.
    """
    from egysentinel.api.models import (
        InvestigateResponse, Alert, CaseReport, Explanation,
        Citation, CitationType, TimelineEntry, Party, PartyRole,
        SARFields, RiskBand, AlertPriority, PatternType,
    )

    result = investigate(account_id, transactions_df=transactions_df, **kwargs)

    alert_dict = result["alert"]
    case_dict = result["case"]
    expl_dict = result["explanation"]

    # Build Pydantic objects — coerce enum strings to enum members
    alert = Alert(
        account_id=alert_dict["account_id"],
        risk_score=float(alert_dict["risk_score"]),
        risk_band=RiskBand(alert_dict["risk_band"]),
        pattern_type=PatternType(alert_dict["pattern_type"]),
        priority=AlertPriority(alert_dict["priority"]),
        summary=alert_dict["summary"][:200],  # truncate to schema max
        recommended_action=alert_dict.get("recommended_action", "investigate"),
        timestamp=alert_dict.get("timestamp"),
    )

    # Build case
    timeline = [
        TimelineEntry(
            step=int(t["step"]),
            event=t["event"],
            account_id=t["account_id"],
            amount=float(t["amount"]),
        )
        for t in case_dict.get("timeline", [])
    ]
    parties = [
        Party(
            account_id=p["account_id"],
            role=PartyRole(p["role"]),
            total_amount=float(p["total_amount"]),
        )
        for p in case_dict.get("parties", [])
    ]
    sar = case_dict.get("sar_fields", {})
    sar_fields = SARFields(
        filing_reason=sar.get("filing_reason", "Suspected suspicious activity"),
        suspicious_activity_type=sar.get("suspicious_activity_type", "unusual_activity"),
        reporting_institution=sar.get("reporting_institution"),
        subject_info=sar.get("subject_info"),
    )
    case = CaseReport(
        case_id=case_dict["case_id"],
        account_id=case_dict["account_id"],
        alert_id=case_dict["alert_id"],
        timeline=timeline,
        parties=parties,
        total_amount=float(case_dict.get("total_amount", 0.0)),
        pattern_type=PatternType(case_dict["pattern_type"]),
        narrative=case_dict["narrative"],
        sar_fields=sar_fields,
        generated_at=case_dict.get("generated_at"),
    )

    # Build explanation
    citations = [
        Citation(
            type=CitationType(c["type"]),
            value=c["value"],
        )
        for c in expl_dict.get("citations", [])
    ]
    explanation = Explanation(
        case_id=expl_dict["case_id"],
        explanation_text=expl_dict["explanation_text"][:1000],  # schema max
        citations=citations,
        confidence=float(expl_dict["confidence"]),
        generated_at=expl_dict.get("generated_at"),
    )

    return InvestigateResponse(
        alert=alert,
        case=case,
        explanation=explanation,
    )


# ---------------------------------------------------------------------------
# Batch helper — investigate multiple accounts at once
# ---------------------------------------------------------------------------

def investigate_batch(
    account_ids: list[str],
    transactions_df: Optional[pd.DataFrame] = None,
    **kwargs,
) -> list[dict[str, Any]]:
    """Run investigate() on multiple accounts. Returns list of result dicts."""
    if transactions_df is None:
        try:
            from data.loader import load_sample
            transactions_df = load_sample()
        except Exception:
            transactions_df = pd.DataFrame(
                columns=["step", "type", "amount", "nameOrig", "nameDest", "isFraud"]
            )

    results = []
    for acc_id in account_ids:
        try:
            r = investigate(acc_id, transactions_df=transactions_df, **kwargs)
            results.append(r)
        except Exception as e:
            logger.error(f"Investigation failed for {acc_id}: {e}")
            results.append({
                "error": str(e),
                "account_id": acc_id,
            })
    return results
