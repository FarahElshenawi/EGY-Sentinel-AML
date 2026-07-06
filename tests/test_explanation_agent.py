"""Tests for AI-4 Explanation Agent."""
import json
import pytest
from unittest.mock import MagicMock
from egysentinel.agents.explanation_agent import (
    generate_explanation,
    get_explanation_fallback,
)

# ---- Sample test data matching locked schemas ----

SAMPLE_ALERT = {
    "account_id": "C1234567",
    "risk_score": 87.5,
    "risk_band": "high",
    "pattern_type": "circular",
    "priority": "critical",
    "summary": "High-risk circular transaction pattern detected",
    "recommended_action": "freeze",
    "timestamp": "2025-01-15T10:30:00Z",
}

SAMPLE_CASE_REPORT = {
    "case_id": "CASE-000001",
    "account_id": "C1234567",
    "alert_id": "ALERT-000001",
    "timeline": [
        {"step": 1, "event": "Transfer to C9876543", "account_id": "C9876543", "amount": 500000.0},
        {"step": 2, "event": "Transfer to C5555555", "account_id": "C5555555", "amount": 300000.0},
    ],
    "parties": [
        {"account_id": "C1234567", "role": "subject", "total_amount": 800000.0},
        {"account_id": "C9876543", "role": "receiver", "total_amount": 500000.0},
    ],
    "total_amount": 800000.0,
    "pattern_type": "circular",
    "narrative": "Circular transaction pattern detected.",
    "sar_fields": {},
}

VALID_LLM_RESPONSE = json.dumps(
    {
        "case_id": "CASE-000001",
        "explanation_text": (
            "Account C1234567 exhibits a circular transaction pattern where funds are "
            "transferred through multiple intermediary accounts before returning to the "
            "originator. The total amount involved is $800,000.00, with a risk score of "
            "87.5 out of 100, placing it in the critical priority tier. This behavior is "
            "consistent with layering techniques commonly used in money laundering schemes."
        ),
        "citations": [
            {"type": "pattern", "value": "Circular transaction C1234567->C9876543->C5555555->C1234567"},
            {"type": "score", "value": "Risk score: 87.5/100"},
            {"type": "transaction", "value": "Total amount: $800,000.00"},
        ],
        "confidence": 0.92,
        "generated_at": "2025-01-15T10:30:00Z",
    }
)


# ---- Fallback tests (no LLM needed) ----


class TestExplanationFallback:
    """Tests that run without any LLM."""

    def test_fallback_returns_required_fields(self):
        result = get_explanation_fallback(SAMPLE_CASE_REPORT, SAMPLE_ALERT)
        assert "case_id" in result
        assert "explanation_text" in result
        assert "citations" in result
        assert "confidence" in result

    def test_fallback_case_id_matches(self):
        result = get_explanation_fallback(SAMPLE_CASE_REPORT, SAMPLE_ALERT)
        assert result["case_id"] == "CASE-000001"

    def test_fallback_explanation_text_min_length(self):
        result = get_explanation_fallback(SAMPLE_CASE_REPORT, SAMPLE_ALERT)
        assert len(result["explanation_text"]) >= 100

    def test_fallback_explanation_text_max_length(self):
        result = get_explanation_fallback(SAMPLE_CASE_REPORT, SAMPLE_ALERT)
        assert len(result["explanation_text"]) <= 1000

    def test_fallback_citations_not_empty(self):
        result = get_explanation_fallback(SAMPLE_CASE_REPORT, SAMPLE_ALERT)
        assert len(result["citations"]) >= 1

    def test_fallback_citation_has_type_and_value(self):
        result = get_explanation_fallback(SAMPLE_CASE_REPORT, SAMPLE_ALERT)
        for cit in result["citations"]:
            assert "type" in cit
            assert "value" in cit

    def test_fallback_confidence_in_range(self):
        result = get_explanation_fallback(SAMPLE_CASE_REPORT, SAMPLE_ALERT)
        assert 0.0 <= result["confidence"] <= 1.0

    def test_fallback_has_generated_at(self):
        result = get_explanation_fallback(SAMPLE_CASE_REPORT, SAMPLE_ALERT)
        assert "generated_at" in result

    def test_fallback_uses_real_data(self):
        result = get_explanation_fallback(SAMPLE_CASE_REPORT, SAMPLE_ALERT)
        assert "C1234567" in result["explanation_text"]
        assert "87" in result["explanation_text"]
        assert "circular" in result["explanation_text"]

    def test_fallback_citations_contain_score(self):
        result = get_explanation_fallback(SAMPLE_CASE_REPORT, SAMPLE_ALERT)
        types = [c["type"] for c in result["citations"]]
        assert "score" in types


# ---- LLM-based tests (mocked) ----


class TestExplanationWithLLM:
    """Tests using a mocked LLM client."""

    def _make_mock_client(self, response_text):
        client = MagicMock()
        client.complete.return_value = response_text
        return client

    def test_llm_success_returns_valid_output(self):
        mock_client = self._make_mock_client(VALID_LLM_RESPONSE)
        result = generate_explanation(
            SAMPLE_CASE_REPORT, SAMPLE_ALERT, llm_client=mock_client
        )
        assert result["case_id"] == "CASE-000001"
        assert len(result["explanation_text"]) >= 100

    def test_llm_strips_markdown_fences(self):
        wrapped = f"```json\n{VALID_LLM_RESPONSE}\n```"
        mock_client = self._make_mock_client(wrapped)
        result = generate_explanation(
            SAMPLE_CASE_REPORT, SAMPLE_ALERT, llm_client=mock_client
        )
        assert result["case_id"] == "CASE-000001"

    def test_llm_missing_fields_triggers_fallback(self):
        bad_response = json.dumps({"case_id": "CASE-000001"})
        mock_client = self._make_mock_client(bad_response)
        result = generate_explanation(
            SAMPLE_CASE_REPORT, SAMPLE_ALERT, llm_client=mock_client
        )
        assert result["case_id"] == "CASE-000001"
        assert len(result["citations"]) >= 1

    def test_llm_invalid_json_triggers_fallback(self):
        mock_client = self._make_mock_client("not valid json at all")
        result = generate_explanation(
            SAMPLE_CASE_REPORT, SAMPLE_ALERT, llm_client=mock_client
        )
        assert result["case_id"] == "CASE-000001"

    def test_no_llm_client_triggers_fallback(self):
        result = generate_explanation(SAMPLE_CASE_REPORT, SAMPLE_ALERT, llm_client=None)
        assert result["case_id"] == "CASE-000001"

    def test_llm_empty_citations_triggers_fallback(self):
        bad = json.dumps(
            {
                "case_id": "CASE-000001",
                "explanation_text": "x" * 150,
                "citations": [],
                "confidence": 0.9,
            }
        )
        mock_client = self._make_mock_client(bad)
        result = generate_explanation(
            SAMPLE_CASE_REPORT, SAMPLE_ALERT, llm_client=mock_client
        )
        assert len(result["citations"]) >= 1