"""
pipeline.py — Alert-to-Case Pipeline Adapter (Day 5-6)

Wires AI-2's Alert Agent -> Evidence Assembly -> Case Builder (AI-3).

Handles:
  - Pattern name normalization (AI-2 uses "circular_flow", we use "circular")
  - Alert enrichment (attaches alert fields to evidence)
  - End-to-end flow: risk_output + alert + transactions_df + patterns.csv -> case_report

Usage:
    from agents.pipeline import process_alert_to_case
    report = process_alert_to_case(
        risk_output=risk_output,
        alert=alert,
        transactions_df=df,
        patterns_csv="data/patterns.csv",
    )
"""

from __future__ import annotations

import logging
import time
from pathlib import Path
from typing import Any, Optional

import pandas as pd

from egysentinel.agents.evidence import assemble_evidence
from egysentinel.agents.case_builder_agent import build_case, validate_case_report

logger = logging.getLogger(__name__)

# Pattern name normalization: AI-2/DS-3 input names -> our canonical locked enum.
# Locked enum per schemas/alert.json: {circular, fan_out, dense_cluster, none}
# fan_in and layering were cut from scope; we map any pre-cut references to the
# nearest valid canonical value so legacy input data does not break the pipeline.
_PATTERN_ALIASES: dict[str, str] = {
    "circular_flow": "circular",
    "circular": "circular",
    "fan_out": "fan_out",
    "fan_in": "fan_out",          # inverse of fan_out — map to fan_out
    "layering": "none",           # cut from scope — no canonical equivalent
    "dense_cluster": "dense_cluster",
    "structuring": "fan_out",
    "funneling": "fan_out",       # was fan_in, now maps to fan_out
    "coordinated_activity": "dense_cluster",
    "unknown": None,              # Will be resolved from patterns.csv or fallback
}

# Valid pattern types — must match locked alert.json enum
_VALID_PATTERNS = {"circular", "fan_out", "dense_cluster", "none"}


def normalize_pattern_type(
    pattern_type: Optional[str],
    fallback: str = "none",
) -> str:
    """Normalize pattern type names from AI-2/DS-3 to our canonical locked enum.

    AI-2 uses "circular_flow" in some places; we need "circular".
    The locked enum is {circular, fan_out, dense_cluster, none} per alert.json.
    Pre-cut values fan_in/layering are mapped to their nearest valid equivalent.

    Args:
        pattern_type: The pattern type string from AI-2 or DS-3.
        fallback: Default if pattern_type is None, empty, or unresolvable.
                  Must be one of {circular, fan_out, dense_cluster, none}.

    Returns:
        A canonical pattern type string from the locked enum.
    """
    if not pattern_type:
        return fallback

    normalized = _PATTERN_ALIASES.get(pattern_type.strip().lower())

    if normalized is None:
        logger.warning(
            f"Unknown pattern_type '{pattern_type}', using fallback '{fallback}'"
        )
        return fallback

    return normalized


def process_alert_to_case(
    risk_output: dict[str, Any],
    alert: dict[str, Any],
    transactions_df: pd.DataFrame,
    patterns_csv: str | Path = "data/patterns.csv",
    use_glm: bool = True,
    timeout: int = 60,
) -> dict[str, Any]:
    """End-to-end pipeline: DS-3 risk output + AI-2 alert -> case report.

    This is the main Day 5-6 integration function. It:
      1. Extracts and normalizes fields from risk_output and alert
      2. Assembles evidence using evidence.assemble_evidence()
      3. Calls build_case() to generate the case report
      4. Validates the output and attaches pipeline metadata

    Args:
        risk_output: DS-3's risk scorer output dict with keys:
            - account_id (str)
            - final_score (float, 0-100)
            - risk_band (str: low/medium/high/critical)
            - pattern_type (str, may need normalization)
            - total_amount (float, optional)
            - rule_score (float, optional)
            - ml_prob (float, optional)
        alert: AI-2's alert output dict with keys:
            - priority (str: low/medium/high/critical)
            - summary (str)
            - recommended_action (str: investigate/monitor/escalate/freeze)
        transactions_df: The PaySim 50K sample DataFrame with columns:
            step, nameOrig, nameDest, amount, type (at minimum)
        patterns_csv: Path to DS-2's patterns.csv
        use_glm: Whether to use GLM for case generation (default True)
        timeout: GLM timeout in seconds (default 60)

    Returns:
        Case report dict with additional pipeline metadata:
            - _pipeline: {alert_priority, recommended_action, latency_ms, use_glm}
            - All standard case_report.json fields
            - If GLM failed: _fallback=True, _fallback_reason=str

    Raises:
        ValueError: If required fields are missing from inputs.
    """
    start_time = time.time()

    # --- 1. Validate and extract from risk_output ---
    account_id = risk_output.get("account_id")
    if not account_id:
        raise ValueError("risk_output missing required field: account_id")

    final_score = float(risk_output.get("final_score", 0))
    risk_band = risk_output.get("risk_band", "medium")

    # Normalize pattern type
    raw_pattern = risk_output.get("pattern_type", "")
    pattern_type = normalize_pattern_type(raw_pattern)

    # --- 2. Generate alert_id from account_id (if AI-2 didn't provide one) ---
    alert_id = f"ALERT-{account_id}"

    # --- 3. Assemble evidence ---
    logger.info(
        f"Processing alert for {account_id} | "
        f"score={final_score:.1f} | band={risk_band} | "
        f"pattern={pattern_type} | priority={alert.get('priority', 'N/A')}"
    )

    evidence = assemble_evidence(
        account_id=account_id,
        transactions_df=transactions_df,
        alert_id=alert_id,
        risk_score=final_score,
        risk_band=risk_band,
        patterns_csv=patterns_csv,
    )

    # Override pattern_type from risk_output if evidence didn't find one in patterns.csv
    if not evidence.get("pattern_type") or evidence["pattern_type"] is None:
        evidence["pattern_type"] = pattern_type
        logger.info(f"Pattern type set from risk_output: {pattern_type}")

    # --- 4. Build case report ---
    report = build_case(evidence, use_glm=use_glm, timeout=timeout)

    # --- 5. Validate ---
    errors = validate_case_report(report)
    if errors:
        logger.warning(f"Case report validation errors: {errors}")

    # --- 6. Attach pipeline metadata ---
    elapsed_ms = (time.time() - start_time) * 1000
    report["_pipeline"] = {
        "alert_priority": alert.get("priority", "unknown"),
        "recommended_action": alert.get("recommended_action", "unknown"),
        "latency_ms": round(elapsed_ms, 1),
        "use_glm": use_glm and not report.get("_fallback", False),
        "validation_errors": errors if errors else None,
    }

    logger.info(
        f"Case {report.get('case_id')} generated in {elapsed_ms:.0f}ms | "
        f"GLM={'yes' if report['_pipeline']['use_glm'] else 'no (fallback)'}"
    )

    return report


def batch_process_alerts(
    risk_outputs: list[dict[str, Any]],
    alerts: list[dict[str, Any]],
    transactions_df: pd.DataFrame,
    patterns_csv: str | Path = "data/patterns.csv",
    use_glm: bool = True,
    timeout: int = 60,
) -> list[dict[str, Any]]:
    """Process multiple alerts in batch.

    Args:
        risk_outputs: List of DS-3 risk output dicts.
        alerts: List of AI-2 alert dicts (same length as risk_outputs).
        transactions_df: The PaySim 50K sample DataFrame.
        patterns_csv: Path to DS-2's patterns.csv.
        use_glm: Whether to use GLM for case generation.
        timeout: GLM timeout per case in seconds.

    Returns:
        List of case report dicts with _pipeline metadata.
    """
    if len(risk_outputs) != len(alerts):
        raise ValueError(
            f"risk_outputs ({len(risk_outputs)}) and alerts "
            f"({len(alerts)}) must have same length"
        )

    results = []
    for i, (risk_output, alert) in enumerate(zip(risk_outputs, alerts)):
        try:
            report = process_alert_to_case(
                risk_output=risk_output,
                alert=alert,
                transactions_df=transactions_df,
                patterns_csv=patterns_csv,
                use_glm=use_glm,
                timeout=timeout,
            )
            results.append(report)
        except Exception as e:
            logger.error(f"Failed to process alert {i} for {risk_output.get('account_id')}: {e}")
            results.append({
                "error": str(e),
                "account_id": risk_output.get("account_id", "unknown"),
                "_pipeline": {"use_glm": False, "validation_errors": [str(e)]},
            })

    return results