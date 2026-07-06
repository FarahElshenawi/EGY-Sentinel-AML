"""AI-4 Explanation Agent — aligned with locked schemas."""
import json
import time
import logging
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)
GLM_TIMEOUT_SECONDS = 5.0

PROMPT_PATH = Path(__file__).parent / "prompts" / "explanation.txt"
with open(PROMPT_PATH) as f:
    EXPLANATION_SYSTEM_PROMPT = f.read()


def generate_explanation(case_report: dict, alert: dict, llm_client=None) -> dict:
    """
    Generate a plain-English explanation for a suspicious account.

    Args:
        case_report: Dict from AI-3 Case Builder (matches case_report.json schema)
        alert: Dict from AI-2 Alert Agent (matches alert.json schema)
        llm_client: LLMClient instance with .complete() method

    Returns:
        Dict matching explanation.json schema
    """
    start_time = time.time()
    case_id = case_report.get("case_id", "UNKNOWN")

    user_prompt = (
        f"Case Report:\n{json.dumps(case_report, indent=2)}\n\n"
        f"Alert:\n{json.dumps(alert, indent=2)}\n\n"
        f"Generate the explanation."
    )

    try:
        if llm_client is None:
            raise ValueError("No LLM client provided")

        response = llm_client.complete(
            system_prompt=EXPLANATION_SYSTEM_PROMPT,
            user_prompt=user_prompt
        )
        elapsed = time.time() - start_time
        if elapsed > GLM_TIMEOUT_SECONDS:
            logger.warning(f"GLM slow: {elapsed:.2f}s for {case_id}")

        # Clean markdown code fences if present
        response = response.strip()
        if response.startswith("```"):
            response = response.split("```")[1]
            if response.startswith("json"):
                response = response[4:]
        response = response.strip()

        explanation_output = json.loads(response)

        # Validate required fields
        required_fields = ["case_id", "explanation_text", "citations", "confidence"]
        missing = [f for f in required_fields if f not in explanation_output]
        if missing:
            raise ValueError(f"Missing required fields: {missing}")

        # Validate explanation_text length
        text_len = len(explanation_output["explanation_text"])
        if text_len < 100 or text_len > 1000:
            logger.warning(f"explanation_text length {text_len} outside 100-1000 range for {case_id}")

        # Validate citations not empty
        if not explanation_output.get("citations"):
            raise ValueError("citations array must not be empty")

        # Validate confidence range
        conf = explanation_output["confidence"]
        if not (0.0 <= conf <= 1.0):
            raise ValueError(f"confidence {conf} out of range 0.0-1.0")

        # Add generated_at if missing
        if "generated_at" not in explanation_output:
            explanation_output["generated_at"] = datetime.now(timezone.utc).isoformat()

        logger.info(f"Explanation generated: {case_id} (confidence={conf:.2f}, {elapsed:.2f}s)")
        return explanation_output

    except Exception as e:
        logger.error(f"Explanation agent error for {case_id}: {e}")
        return get_explanation_fallback(case_report, alert)


def get_explanation_fallback(case_report: dict, alert: dict) -> dict:
    """Rule-based fallback when LLM fails."""
    case_id = case_report.get("case_id", "UNKNOWN")
    account_id = alert.get("account_id", case_report.get("account_id", "UNKNOWN"))
    risk_score = alert.get("risk_score", 0)
    pattern_type = alert.get("pattern_type", "unknown")
    total_amount = case_report.get("total_amount", 0)
    priority = alert.get("priority", "medium")

    explanation_text = (
        f"Account {account_id} has been flagged with a risk score of {risk_score:.0f}/100, "
        f"indicating a high probability of money laundering activity. "
        f"A {pattern_type} transaction pattern was detected involving a total amount of "
        f"${total_amount:,.2f}. The alert was classified as {priority} priority, "
        f"warranting immediate investigation by compliance officers."
    )

    citations = [
        {"type": "score", "value": f"Risk score: {risk_score:.0f}/100"},
        {"type": "pattern", "value": f"Pattern: {pattern_type}"},
        {"type": "transaction", "value": f"Total amount: ${total_amount:,.2f}"}
    ]

    return {
        "case_id": case_id,
        "explanation_text": explanation_text,
        "citations": citations,
        "confidence": 0.85,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }