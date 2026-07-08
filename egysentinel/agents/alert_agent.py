"""AI-2 Alert Agent — aligned with locked schemas."""
import json
import time
import logging
from pathlib import Path

logger = logging.getLogger(__name__)
GLM_TIMEOUT_SECONDS = 5.0

PROMPT_PATH = Path(__file__).parent / "prompts" / "alert.txt"
with open(PROMPT_PATH) as f:
    ALERT_SYSTEM_PROMPT = f.read()


def generate_alert(account_id: str, risk_score: float, risk_band: str,
                   pattern_type: str, total_amount: float = 0.0, llm_client=None) -> dict:
    if pattern_type == "circular_flow":
        pattern_type = "circular"
    start_time = time.time()
    user_prompt = f'Analyze this high-risk account and generate an alert:\n{{\n  "account_id": "{account_id}",\n  "final_score": {risk_score},\n  "pattern_type": "{pattern_type}",\n  "total_amount": {total_amount}\n}}\n'
    try:
        if llm_client is None:
            raise ValueError("No LLM client provided")
        response = llm_client.complete(system_prompt=ALERT_SYSTEM_PROMPT, user_prompt=user_prompt)
        elapsed = time.time() - start_time
        if elapsed > GLM_TIMEOUT_SECONDS:
            logger.warning(f"GLM slow: {elapsed:.2f}s for {account_id}")
        response = response.strip()
        if response.startswith("```"):
            response = response.split("```")[1]
            if response.startswith("json"):
                response = response[4:]
        alert_output = json.loads(response)
        if "priority" not in alert_output or "summary" not in alert_output:
            raise ValueError("Missing required fields")
        logger.info(f"Alert generated: {account_id} -> {alert_output['priority']} ({elapsed:.2f}s)")
        return alert_output
    except Exception as e:
        logger.error(f"Alert agent error for {account_id}: {e}")
        return get_alert_fallback(account_id, risk_score, pattern_type)


def get_alert_fallback(account_id: str, risk_score: float, pattern_type: str) -> dict:
    """Rule-based fallback for alert priority.

    Priority is driven by the RISK SCORE, not the pattern type.
    A circular pattern with score 50 is medium priority — not critical.
    The pattern type informs the summary text, not the priority level.
    """
    if pattern_type == "circular_flow":
        pattern_type = "circular"

    pattern_desc = f" with {pattern_type} pattern" if pattern_type != "none" else ""

    if risk_score >= 85:
        return {"priority": "critical", "summary": f"Account {account_id} flagged with risk score {risk_score:.0f}/100{pattern_desc}. Immediate action required.", "recommended_action": "freeze"}
    elif risk_score >= 66:
        return {"priority": "high", "summary": f"Account {account_id} flagged with risk score {risk_score:.0f}/100{pattern_desc}. Investigation recommended.", "recommended_action": "escalate"}
    elif risk_score >= 31:
        return {"priority": "medium", "summary": f"Account {account_id} flagged with risk score {risk_score:.0f}/100{pattern_desc}. Review recommended.", "recommended_action": "investigate"}
    else:
        return {"priority": "low", "summary": f"Account {account_id} has low risk score {risk_score:.0f}/100.", "recommended_action": "monitor"}
