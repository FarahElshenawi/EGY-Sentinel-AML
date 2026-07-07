"""
case_builder_agent.py — Case Builder Agent (AI-3)

Day 2: build_case_stub()  — schema-valid placeholder (no GLM).
Day 3: build_case_glm()   — GLM-powered case report via z-ai CLI.
Day 4: build_case()      — production version with llm_client + CLI fallback.

Usage:
    from agents.case_builder_agent import build_case
    report = build_case(evidence)                  # GLM with auto-fallback
    report = build_case(evidence, use_glm=False)   # stub only (testing)
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Optional

# Case counter for generating sequential case IDs
_case_counter = 0


def _next_case_id() -> str:
    """Generate a sequential case ID (e.g., CASE-000001)."""
    global _case_counter
    _case_counter += 1
    return f"CASE-{_case_counter:06d}"


def _compute_parties(
    evidence: dict[str, Any],
) -> list[dict[str, Any]]:
    """Derive parties[] from evidence accounts and transactions.

    Rules:
      - The evidence.account_id gets role "subject".
      - If an account appears as nameOrig in any transaction → "sender".
      - If an account appears as nameDest → "receiver".
      - If an account is both sender and receiver (and not subject) → "intermediary".
      - total_amount = sum of amounts where the account is involved.
    """
    subject_id = evidence["account_id"]
    transactions = evidence.get("transactions", [])

    # Track per-account totals and roles
    sent_to: dict[str, float] = {}  # account -> total sent
    received_from: dict[str, float] = {}  # account -> total received

    for txn in transactions:
        orig = txn["nameOrig"]
        dest = txn["nameDest"]
        amt = float(txn["amount"])

        sent_to.setdefault(orig, 0.0)
        sent_to[orig] += amt

        received_from.setdefault(dest, 0.0)
        received_from[dest] += amt

    # Build parties list
    all_accounts = set(evidence.get("accounts", []))
    parties = []

    for acc in all_accounts:
        if acc == subject_id:
            role = "subject"
            total = sent_to.get(acc, 0.0)
        elif acc in sent_to and acc in received_from:
            role = "intermediary"
            total = sent_to.get(acc, 0.0) + received_from.get(acc, 0.0)
        elif acc in sent_to:
            role = "sender"
            total = sent_to.get(acc, 0.0)
        elif acc in received_from:
            role = "receiver"
            total = received_from.get(acc, 0.0)
        else:
            role = "receiver"
            total = 0.0

        parties.append({
            "account_id": acc,
            "role": role,
            "total_amount": round(total, 2),
        })

    # Sort: subject first, then by total_amount descending
    parties.sort(key=lambda p: (0 if p["role"] == "subject" else 1, -float(p["total_amount"])))

    return parties


def _compute_timeline(
    evidence: dict[str, Any],
) -> list[dict[str, Any]]:
    """Derive timeline[] from evidence transactions.

    Each transaction becomes a timeline entry. The counterparty is the
    OTHER account (not the subject).
    """
    subject_id = evidence["account_id"]
    transactions = evidence.get("transactions", [])

    timeline = []
    for txn in transactions:
        orig = txn["nameOrig"]
        dest = txn["nameDest"]

        # Determine the counterparty (the one that's NOT the subject)
        if orig == subject_id:
            counterparty = dest
            event = f"Transfer to {dest}"
        else:
            counterparty = orig
            event = f"Received from {orig}"

        timeline.append({
            "step": int(txn["step"]),
            "event": event,
            "account_id": counterparty,
            "amount": float(txn["amount"]),
        })

    # Sort chronologically by step
    timeline.sort(key=lambda t: t["step"])

    return timeline


def _compute_total_amount(timeline: list[dict[str, Any]]) -> float:
    """Sum all transaction amounts in the timeline."""
    return round(sum(t["amount"] for t in timeline), 2)


def _generate_stub_narrative(
    evidence: dict[str, Any],
    total_amount: float,
) -> str:
    """Generate a placeholder narrative using only evidence data.

    This is a deterministic stub — no LLM call. Used for Day 2 testing.
    The real GLM-powered narrative replaces this on Day 3-4.
    """
    subject = evidence["account_id"]
    pattern = evidence.get("pattern_type", "unknown")
    risk = evidence.get("risk_band", "medium")
    n_txns = len(evidence.get("transactions", []))
    n_accounts = len(evidence.get("accounts", []))

    narrative = (
        f"[STUB — PLACEHOLDER NARRATIVE — TO BE REPLACED BY GLM ON DAY 3]\n\n"
        f"Account {subject} has been flagged with a {risk} risk score "
        f"({evidence.get('risk_score', 0):.1f}/100) following the detection of a "
        f"'{pattern}' money-laundering pattern involving {n_accounts} accounts "
        f"and {n_txns} transactions totaling {total_amount:,.2f}. "
        f"The graph detector identified this pattern based on the transaction network "
        f"structure. A full investigation narrative will be generated by the GLM-powered "
        f"Case Builder Agent once the prompt is finalized."
    )

    return narrative


def _generate_stub_sar_fields(
    evidence: dict[str, Any],
) -> dict[str, str]:
    """Generate placeholder SAR fields using only evidence data.

    Pattern_type enum is locked to {circular, fan_out, dense_cluster, none} per alert.json.
    The legacy fan_in/layering mappings are kept only as defensive fallbacks for pre-cut
    input data and should never be produced by the locked detectors.
    """
    pattern = evidence.get("pattern_type", "none")

    # Map pattern type to filing reason and activity type
    sar_mapping = {
        "circular": {
            "filing_reason": "Suspected circular transaction pattern involving funds returning to origin",
            "suspicious_activity_type": "circular_transfer",
        },
        "fan_out": {
            "filing_reason": "Suspected structuring: rapid disbursement to multiple accounts",
            "suspicious_activity_type": "structuring",
        },
        "dense_cluster": {
            "filing_reason": "Suspected coordinated activity: dense transaction cluster detected",
            "suspicious_activity_type": "coordinated_activity",
        },
        "none": {
            "filing_reason": "Suspected high-risk account activity flagged by score threshold",
            "suspicious_activity_type": "unusual_activity",
        },
        # Legacy mappings — fan_in/layering were cut from scope but kept as
        # defensive fallbacks in case pre-cut input data references them.
        "fan_in": {
            "filing_reason": "Suspected funneling: funds consolidated from multiple accounts",
            "suspicious_activity_type": "funneling",
        },
        "layering": {
            "filing_reason": "Suspected layering: multiple sequential transfers with similar amounts",
            "suspicious_activity_type": "layering",
        },
    }

    fields = sar_mapping.get(pattern, {
        "filing_reason": f"Suspicious activity detected: {pattern} pattern",
        "suspicious_activity_type": "unusual_activity",
    })

    # Add placeholders for capstone
    fields["reporting_institution"] = "EGY-Sentinel Financial Intelligence Unit"
    fields["subject_info"] = f"Account {evidence['account_id']} — pending full identification"

    return fields


def build_case_stub(evidence: dict[str, Any]) -> dict[str, Any]:
    """Build a schema-valid placeholder case report from evidence.

    This is the Day 2 STUB version. It:
      - Derives timeline, parties, and total_amount from evidence data
      - Generates a placeholder narrative (no GLM)
      - Generates SAR fields based on pattern type
      - Produces a JSON object that strictly conforms to case_report.json schema

    Args:
        evidence: Evidence dict conforming to schemas/evidence.json.

    Returns:
        Case report dict conforming to schemas/case_report.json.
    """
    # 1. Compute derived fields from evidence
    timeline = _compute_timeline(evidence)
    parties = _compute_parties(evidence)
    total_amount = _compute_total_amount(timeline)

    # 2. Generate stub content (no LLM)
    narrative = _generate_stub_narrative(evidence, total_amount)
    sar_fields = _generate_stub_sar_fields(evidence)

    # 3. Build the case report
    case_report = {
        "case_id": _next_case_id(),
        "account_id": evidence["account_id"],
        "alert_id": evidence["alert_id"],
        "timeline": timeline,
        "parties": parties,
        "total_amount": total_amount,
        "pattern_type": evidence.get("pattern_type", "circular"),
        "narrative": narrative,
        "sar_fields": sar_fields,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }

    return case_report


def validate_case_report(report: dict[str, Any]) -> list[str]:
    """Validate a case report against the required schema structure.

    Returns a list of error strings. Empty list = valid.

    This is a lightweight validation — full JSON Schema validation
    will be handled by AI-1's llm_client on Day 3+.
    """
    errors = []

    # Required top-level fields
    required_fields = [
        "case_id", "account_id", "alert_id", "timeline", "parties",
        "total_amount", "pattern_type", "narrative", "sar_fields",
    ]
    for field in required_fields:
        if field not in report:
            errors.append(f"Missing required field: {field}")

    # Validate timeline
    timeline = report.get("timeline", [])
    if not isinstance(timeline, list):
        errors.append("timeline must be a list")
    else:
        for i, item in enumerate(timeline):
            for key in ["step", "event", "account_id", "amount"]:
                if key not in item:
                    errors.append(f"timeline[{i}] missing required field: {key}")

        # Check chronological order
        steps = [t["step"] for t in timeline if "step" in t]
        if steps != sorted(steps):
            errors.append("timeline is not in chronological order by step")

    # Validate parties
    parties = report.get("parties", [])
    valid_roles = {"sender", "receiver", "intermediary", "subject"}
    if not isinstance(parties, list):
        errors.append("parties must be a list")
    else:
        for i, party in enumerate(parties):
            for key in ["account_id", "role", "total_amount"]:
                if key not in party:
                    errors.append(f"parties[{i}] missing required field: {key}")
            if party.get("role") not in valid_roles:
                errors.append(f"parties[{i}].role '{party.get('role')}' is not a valid role")

    # Validate pattern_type — must match locked alert.json enum
    # {circular, fan_out, dense_cluster, none} — fan_in and layering were cut from scope
    valid_patterns = {"circular", "fan_out", "dense_cluster", "none"}
    if report.get("pattern_type") not in valid_patterns:
        errors.append(f"pattern_type '{report.get('pattern_type')}' is not valid")

    # Validate sar_fields
    sar = report.get("sar_fields", {})
    if not isinstance(sar, dict):
        errors.append("sar_fields must be an object")
    else:
        for key in ["filing_reason", "suspicious_activity_type"]:
            if key not in sar:
                errors.append(f"sar_fields missing required field: {key}")

    # Validate total_amount matches timeline sum
    if timeline and "total_amount" in report:
        computed_sum = round(sum(t.get("amount", 0) for t in timeline), 2)
        if abs(computed_sum - report["total_amount"]) > 0.01:
            errors.append(
                f"total_amount ({report['total_amount']}) does not match "
                f"timeline sum ({computed_sum})"
            )

    return errors


# ======================================================================
# Day 4: GLM-powered Case Builder (production)
# ======================================================================

import logging
import subprocess
import tempfile
from pathlib import Path

logger = logging.getLogger(__name__)

_PROMPT_PATH = Path(__file__).parent / "prompts" / "case_builder.txt"

# Try to import AI-1's llm_client; if not available, use z-ai CLI fallback
_llm_client_available = False
try:
    from egysentinel.agents.llm_client import LLMClient
    _llm_client = LLMClient()
    _llm_client_available = True
    logger.info("AI-1 llm_client loaded — using it for GLM calls")
except ImportError:
    logger.info("AI-1 llm_client not found — using z-ai CLI fallback")


def _load_system_prompt() -> str:
    """Load the case builder system prompt from prompts/case_builder.txt."""
    if not _PROMPT_PATH.exists():
        raise FileNotFoundError(
            f"Prompt file not found: {_PROMPT_PATH}. "
            f"Run from the egysentinel/ directory or set PROMPT_PATH."
        )
    return _PROMPT_PATH.read_text(encoding="utf-8")


def _call_glm(system_prompt: str, user_message: str, timeout: int = 60) -> str:
    """Call GLM and return the raw response text.

    Day 4: Tries AI-1's llm_client first (caching, retry, JSON schema validation).
    Falls back to z-ai CLI if llm_client is not available.

    Args:
        system_prompt: The system prompt (case_builder.txt content).
        user_message: The evidence JSON as a string.
        timeout: Max seconds to wait for GLM response.

    Returns:
        Raw text response from GLM.

    Raises:
        RuntimeError: If GLM call fails or times out.
    """
    # Path 1: AI-1's llm_client (preferred — has caching, retry, validation)
    if _llm_client_available:
        try:
            logger.info("Calling GLM via AI-1 llm_client...")
            response = _llm_client.generate(
                system_prompt=system_prompt,
                user_message=user_message,
                timeout=timeout,
            )
            # llm_client returns the content string directly
            if isinstance(response, dict):
                return response.get("content", json.dumps(response))
            return str(response)
        except Exception as e:
            logger.warning(f"llm_client failed, falling back to z-ai CLI: {e}")
            # Fall through to CLI

    # Path 2: z-ai CLI (fallback)
    try:
        # Use -o flag to write clean JSON to a temp file (avoids emoji prefixes)
        output_file = tempfile.mktemp(suffix=".json")

        try:
            result = subprocess.run(
                [
                    "z-ai", "chat",
                    "--prompt", user_message,
                    "--system", system_prompt,
                    "-o", output_file,
                ],
                capture_output=True,
                text=True,
                timeout=timeout,
            )

            if result.returncode != 0:
                raise RuntimeError(
                    f"z-ai CLI failed (exit {result.returncode}): {result.stderr[:500]}"
                )

            out_path = Path(output_file)
            if not out_path.exists():
                raise RuntimeError("z-ai CLI did not produce output file")

            raw = out_path.read_text(encoding="utf-8").strip()

            # Find the first '{' and parse from there (skip any prefix)
            json_start = raw.find("{")
            if json_start == -1:
                raise ValueError(f"No JSON found in output: {raw[:200]}")

            cli_output = json.loads(raw[json_start:])
            content = cli_output["choices"][0]["message"]["content"]
            return content

        finally:
            try:
                Path(output_file).unlink(missing_ok=True)
            except OSError:
                pass

    except subprocess.TimeoutExpired:
        raise RuntimeError(
            f"GLM call timed out after {timeout}s. "
            f"Use build_case_stub() as fallback."
        )
    except FileNotFoundError:
        raise RuntimeError(
            "z-ai CLI not found. Ensure z-ai-web-dev-sdk is installed."
        )


def _extract_json_from_response(response_text: str) -> dict[str, Any]:
    """Extract and parse JSON from GLM response.

    GLM may wrap the JSON in markdown code blocks or add extra text.
    This function handles:
      - Pure JSON response
      - JSON wrapped in ```json ... ```
      - JSON with leading/trailing text
    """
    text = response_text.strip()

    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try extracting from markdown code block
    import re
    json_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass

    # Try finding first { ... } block
    brace_match = re.search(r"\{.*\}", text, re.DOTALL)
    if brace_match:
        try:
            return json.loads(brace_match.group(0))
        except json.JSONDecodeError:
            pass

    raise ValueError(
        f"Could not extract valid JSON from GLM response. "
        f"Response preview: {text[:300]}..."
    )


def _recalculate_party_amounts(evidence: dict[str, Any]) -> dict[str, float]:
    """Calculate the correct total_amount for each account from evidence.

    Returns a dict mapping account_id -> total_amount (sum of all sent + received).
    This is the ground truth that GLM often gets wrong.
    """
    account_totals: dict[str, float] = {}
    for txn in evidence.get("transactions", []):
        orig = txn["nameOrig"]
        dest = txn["nameDest"]
        amt = float(txn["amount"])
        account_totals[orig] = account_totals.get(orig, 0.0) + amt
        account_totals[dest] = account_totals.get(dest, 0.0) + amt
    return {k: round(v, 2) for k, v in account_totals.items()}


def _recalculate_party_roles(evidence: dict[str, Any]) -> dict[str, str]:
    """Calculate the correct role for each account from evidence.

    Returns a dict mapping account_id -> role.
    """
    subject_id = evidence["account_id"]
    sent_from: set[str] = set()
    received_by: set[str] = set()

    for txn in evidence.get("transactions", []):
        sent_from.add(txn["nameOrig"])
        received_by.add(txn["nameDest"])

    roles: dict[str, str] = {}
    all_accounts = set(evidence.get("accounts", []))

    for acc in all_accounts:
        if acc == subject_id:
            roles[acc] = "subject"
        elif acc in sent_from and acc in received_by:
            roles[acc] = "intermediary"
        elif acc in sent_from:
            roles[acc] = "sender"
        else:
            roles[acc] = "receiver"

    return roles


def _post_process_glm_report(
    raw_report: dict[str, Any],
    evidence: dict[str, Any],
) -> dict[str, Any]:
    """Post-process the GLM-generated report to fix common issues.

    This ensures:
      - case_id is present (inject if missing)
      - account_id and alert_id match evidence
      - pattern_type matches evidence
      - timeline is sorted chronologically
      - total_amount matches timeline sum (recalculate)
      - party roles and total_amounts are correct (recalculate from evidence)
      - No hallucinated accounts in timeline
      - No extra properties on any object
      - SAR fields match the required pattern mapping
    """
    # 1. Ensure structural fields come from evidence, not GLM hallucination
    raw_report["account_id"] = evidence["account_id"]
    raw_report["alert_id"] = evidence["alert_id"]

    # 2. Ensure case_id exists
    if "case_id" not in raw_report or not raw_report["case_id"]:
        raw_report["case_id"] = _next_case_id()

    # 3. Ensure pattern_type matches evidence
    if evidence.get("pattern_type"):
        raw_report["pattern_type"] = evidence["pattern_type"]

    # 4. Sort timeline chronologically
    if "timeline" in raw_report and isinstance(raw_report["timeline"], list):
        raw_report["timeline"].sort(key=lambda t: t.get("step", 0))

    # 5. Recalculate total_amount from timeline (GLM might get math wrong)
    if "timeline" in raw_report:
        raw_report["total_amount"] = float(_compute_total_amount(raw_report["timeline"]))

    # 6. Recalculate party roles and total_amounts from evidence (GLM often wrong)
    correct_amounts = _recalculate_party_amounts(evidence)
    correct_roles = _recalculate_party_roles(evidence)
    valid_roles = {"sender", "receiver", "intermediary", "subject"}

    if "parties" in raw_report and isinstance(raw_report["parties"], list):
        # Rebuild parties list with correct data, preserving GLM's order
        rebuilt_parties = []
        seen_accounts: set[str] = set()
        for party in raw_report["parties"]:
            acc = party.get("account_id", "")
            if acc in seen_accounts:
                continue
            seen_accounts.add(acc)
            rebuilt_parties.append({
                "account_id": acc,
                "role": correct_roles.get(acc, "receiver"),
                "total_amount": correct_amounts.get(acc, 0.0),
            })
        # Add any missing accounts from evidence
        for acc in evidence.get("accounts", []):
            if acc not in seen_accounts:
                rebuilt_parties.append({
                    "account_id": acc,
                    "role": correct_roles.get(acc, "receiver"),
                    "total_amount": correct_amounts.get(acc, 0.0),
                })
                seen_accounts.add(acc)
        # Sort: subject first, then by total_amount descending
        rebuilt_parties.sort(
            key=lambda p: (0 if p["role"] == "subject" else 1, -p["total_amount"])
        )
        raw_report["parties"] = rebuilt_parties

    # 7. Ensure generated_at is set
    if "generated_at" not in raw_report:
        raw_report["generated_at"] = datetime.now(timezone.utc).isoformat()

    # 8. Anti-hallucination: verify timeline accounts exist in evidence
    evidence_accounts = set(evidence.get("accounts", []))
    if "timeline" in raw_report:
        for item in raw_report["timeline"]:
            acc = item.get("account_id", "")
            if acc and acc not in evidence_accounts:
                logger.warning(
                    f"Hallucination detected: timeline references account {acc} "
                    f"not in evidence. Removing from timeline."
                )
        # Filter out items with non-evidence accounts
        raw_report["timeline"] = [
            t for t in raw_report["timeline"]
            if t.get("account_id", "") in evidence_accounts or not t.get("account_id")
        ]

    # 9. Ensure SAR fields have correct suspicious_activity_type mapping
    sar_type_map = {
        "circular": "circular_transfer",
        "fan_out": "structuring",
        "fan_in": "funneling",
        "layering": "layering",
        "dense_cluster": "coordinated_activity",
    }
    if "sar_fields" in raw_report and isinstance(raw_report["sar_fields"], dict):
        expected_type = sar_type_map.get(evidence.get("pattern_type", ""))
        if expected_type:
            raw_report["sar_fields"]["suspicious_activity_type"] = expected_type
        # Ensure reporting_institution and subject_info are present
        if "reporting_institution" not in raw_report["sar_fields"]:
            raw_report["sar_fields"]["reporting_institution"] = \
                "EGY-Sentinel Financial Intelligence Unit"
        if "subject_info" not in raw_report["sar_fields"]:
            raw_report["sar_fields"]["subject_info"] = \
                f"Account {evidence['account_id']} — pending full identification"

    # 10. Remove any extra properties from timeline items and parties
    timeline_allowed = {"step", "event", "account_id", "amount"}
    if "timeline" in raw_report:
        raw_report["timeline"] = [
            {k: v for k, v in item.items() if k in timeline_allowed}
            for item in raw_report["timeline"]
        ]
    party_allowed = {"account_id", "role", "total_amount"}
    if "parties" in raw_report:
        raw_report["parties"] = [
            {k: v for k, v in item.items() if k in party_allowed}
            for item in raw_report["parties"]
        ]
    sar_allowed = {"filing_reason", "suspicious_activity_type",
                   "reporting_institution", "subject_info"}
    if "sar_fields" in raw_report:
        raw_report["sar_fields"] = {
            k: v for k, v in raw_report["sar_fields"].items() if k in sar_allowed
        }

    return raw_report


def build_case_glm(
    evidence: dict[str, Any],
    timeout: int = 60,
) -> dict[str, Any]:
    """Build a case report using GLM.

    Day 4 production version. Tries AI-1's llm_client first, falls back
    to z-ai CLI. Includes post-processing and validation.

    Flow:
      1. Load system prompt from case_builder.txt
      2. Serialize evidence to JSON as the user message
      3. Call GLM (llm_client or z-ai CLI)
      4. Parse JSON from response
      5. Post-process to fix common GLM issues
      6. Validate against schema

    Args:
        evidence: Evidence dict conforming to schemas/evidence.json.
        timeout: Max seconds to wait for GLM.

    Returns:
        Case report dict conforming to schemas/case_report.json.

    Raises:
        RuntimeError: If GLM call fails.
        ValueError: If response cannot be parsed as valid JSON.
    """
    # 1. Load prompt
    system_prompt = _load_system_prompt()

    # 2. Prepare user message (evidence as JSON)
    # Inject case_id so GLM uses it
    case_id = _next_case_id()
    evidence_with_id = {**evidence, "case_id": case_id}
    user_message = json.dumps(evidence_with_id, indent=2, ensure_ascii=False)

    # 3. Call GLM
    backend = "llm_client" if _llm_client_available else "z-ai CLI"
    logger.info(f"Calling GLM via {backend} for {evidence['account_id']} (case {case_id})...")
    raw_response = _call_glm(system_prompt, user_message, timeout=timeout)

    # 4. Parse JSON from response
    report = _extract_json_from_response(raw_response)

    # 5. Post-process to fix common issues
    report = _post_process_glm_report(report, evidence)

    # 6. Validate
    errors = validate_case_report(report)
    if errors:
        logger.warning(f"GLM report has validation errors: {errors}")
        # Don't raise — return with errors logged. Caller can decide.

    logger.info(
        f"GLM case report generated: {report.get('case_id')} — "
        f"{len(report.get('timeline', []))} timeline items, "
        f"{len(report.get('parties', []))} parties, "
        f"narrative length: {len(report.get('narrative', ''))} chars"
    )

    return report


def build_case(
    evidence: dict[str, Any],
    use_glm: bool = True,
    timeout: int = 60,
) -> dict[str, Any]:
    """Build a case report with automatic fallback.

    Production interface (Day 4+). If use_glm=True, tries GLM first
    (via AI-1's llm_client or z-ai CLI fallback); on any failure,
    falls back to the deterministic stub.

    Args:
        evidence: Evidence dict conforming to schemas/evidence.json.
        use_glm: Whether to attempt GLM call.
        timeout: GLM timeout in seconds.

    Returns:
        Case report dict. If GLM fails, returns stub with _fallback flag.
    """
    if use_glm:
        try:
            return build_case_glm(evidence, timeout=timeout)
        except (RuntimeError, ValueError) as e:
            logger.warning(f"GLM failed, falling back to stub: {e}")

    # Fallback: use deterministic stub
    report = build_case_stub(evidence)
    report["_fallback"] = True
    report["_fallback_reason"] = "GLM unavailable — stub used"
    return report