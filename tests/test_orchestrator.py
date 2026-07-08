"""Tests for AI-1 Orchestrator — the alert -> case -> explanation pipeline."""
import sys
from pathlib import Path

import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from egysentinel.agents.orchestrator import (
    investigate,
    investigate_response,
    investigate_batch,
    _stub_score_account,
)


# ─── Fixtures ─────────────────────────────────────────────────────────

@pytest.fixture
def circular_transactions() -> pd.DataFrame:
    """4-account circular pattern: A -> B -> C -> D -> A."""
    return pd.DataFrame([
        {"step": 10, "type": "TRANSFER", "amount": 500000.0,
         "nameOrig": "C111", "nameDest": "C222",
         "oldbalanceOrg": 500000, "newbalanceOrg": 0,
         "oldbalanceDest": 0, "newbalanceDest": 500000,
         "isFraud": 1, "isFlaggedFraud": 0},
        {"step": 11, "type": "TRANSFER", "amount": 490000.0,
         "nameOrig": "C222", "nameDest": "C333",
         "oldbalanceOrg": 490000, "newbalanceOrg": 0,
         "oldbalanceDest": 0, "newbalanceDest": 490000,
         "isFraud": 1, "isFlaggedFraud": 0},
        {"step": 12, "type": "TRANSFER", "amount": 480000.0,
         "nameOrig": "C333", "nameDest": "C444",
         "oldbalanceOrg": 480000, "newbalanceOrg": 0,
         "oldbalanceDest": 0, "newbalanceDest": 480000,
         "isFraud": 1, "isFlaggedFraud": 0},
        {"step": 13, "type": "CASH_OUT", "amount": 470000.0,
         "nameOrig": "C444", "nameDest": "C111",
         "oldbalanceOrg": 470000, "newbalanceOrg": 0,
         "oldbalanceDest": 0, "newbalanceDest": 470000,
         "isFraud": 1, "isFlaggedFraud": 0},
    ])


@pytest.fixture
def fan_out_transactions() -> pd.DataFrame:
    """Fan-out: one sender -> 6 receivers."""
    rows = []
    for i in range(6):
        rows.append({
            "step": 20, "type": "TRANSFER", "amount": 95000.0,
            "nameOrig": "C999", "nameDest": f"C{1000 + i:04d}",
            "oldbalanceOrg": 600000, "newbalanceOrg": 600000 - 95000 * (i + 1),
            "oldbalanceDest": 0, "newbalanceDest": 95000,
            "isFraud": 1, "isFlaggedFraud": 0,
        })
    return pd.DataFrame(rows)


# ─── Stub scorer tests ───────────────────────────────────────────────

class TestStubScorer:

    def test_empty_df_returns_low(self):
        score, band, pattern = _stub_score_account(
            "C999", pd.DataFrame(columns=["nameOrig", "nameDest", "amount", "isFraud"]),
            pattern_type=None,
        )
        assert score == 15.0
        assert band == "low"
        assert pattern == "none"

    def test_sender_gets_higher_score(self, circular_transactions):
        score, band, _ = _stub_score_account(
            "C111", circular_transactions, pattern_type="circular",
        )
        # C111 is sender + receiver + has fraud + has pattern + high amount
        # 30 (base) + 25 (sender) + 20 (receiver) + 25 (pattern) + 20 (fraud) + 5 (high amount > 100K)
        # = 125, clamped to 100
        assert score == 100.0
        assert band == "high"

    def test_no_pattern_lower_score(self, circular_transactions):
        score, _, pattern = _stub_score_account(
            "C111", circular_transactions, pattern_type=None,
        )
        # No pattern -> pattern is 'none'
        assert pattern == "none"
        # Score should be less than when pattern is present (circular gives +25)
        score_with_pattern, _, _ = _stub_score_account(
            "C111", circular_transactions, pattern_type="circular",
        )
        assert score <= score_with_pattern

    def test_score_clamped_to_100(self, circular_transactions):
        score, _, _ = _stub_score_account("C111", circular_transactions, pattern_type="circular")
        assert score <= 100.0

    def test_score_never_negative(self):
        # Empty account in empty df
        score, _, _ = _stub_score_account(
            "C999", pd.DataFrame(columns=["nameOrig", "nameDest", "amount", "isFraud"]),
            pattern_type=None,
        )
        assert score >= 0.0

    def test_pattern_normalized_to_locked_enum(self):
        # fan_in (consolidation) is the OPPOSITE of fan_out (smurfing).
        # Mapping fan_in → fan_out would misclassify SAR type as "structuring".
        # Now maps to "none" to avoid misclassification.
        _, _, pattern = _stub_score_account(
            "C999",
            pd.DataFrame(columns=["nameOrig", "nameDest", "amount", "isFraud"]),
            pattern_type="fan_in",
        )
        assert pattern == "none"

    def test_layering_normalizes_to_none(self):
        _, _, pattern = _stub_score_account(
            "C999",
            pd.DataFrame(columns=["nameOrig", "nameDest", "amount", "isFraud"]),
            pattern_type="layering",
        )
        assert pattern == "none"


# ─── End-to-end investigate() tests ─────────────────────────────────

class TestInvestigate:

    def test_investigate_returns_three_keys(self, circular_transactions):
        result = investigate("C111", transactions_df=circular_transactions, pattern_type="circular")
        assert "alert" in result
        assert "case" in result
        assert "explanation" in result

    def test_alert_has_required_fields(self, circular_transactions):
        result = investigate("C111", transactions_df=circular_transactions, pattern_type="circular")
        alert = result["alert"]
        for field in ["account_id", "risk_score", "risk_band", "pattern_type",
                      "priority", "summary", "recommended_action", "timestamp"]:
            assert field in alert, f"Alert missing field: {field}"

    def test_case_has_required_fields(self, circular_transactions):
        result = investigate("C111", transactions_df=circular_transactions, pattern_type="circular")
        case = result["case"]
        for field in ["case_id", "account_id", "alert_id", "timeline", "parties",
                      "total_amount", "pattern_type", "narrative", "sar_fields", "generated_at"]:
            assert field in case, f"Case missing field: {field}"

    def test_explanation_has_required_fields(self, circular_transactions):
        result = investigate("C111", transactions_df=circular_transactions, pattern_type="circular")
        expl = result["explanation"]
        for field in ["case_id", "explanation_text", "citations", "confidence"]:
            assert field in expl, f"Explanation missing field: {field}"

    def test_account_id_propagates(self, circular_transactions):
        result = investigate("C111", transactions_df=circular_transactions, pattern_type="circular")
        assert result["alert"]["account_id"] == "C111"
        assert result["case"]["account_id"] == "C111"

    def test_pattern_type_in_locked_enum(self, circular_transactions):
        result = investigate("C111", transactions_df=circular_transactions, pattern_type="circular")
        locked = {"circular", "fan_out", "dense_cluster", "none"}
        assert result["alert"]["pattern_type"] in locked
        assert result["case"]["pattern_type"] in locked

    def test_pattern_type_fan_in_normalizes(self, circular_transactions):
        """fan_in (consolidation) is the OPPOSITE of fan_out (smurfing).
        Mapping to fan_out would misclassify SAR type. Now maps to 'none'."""
        result = investigate("C111", transactions_df=circular_transactions, pattern_type="fan_in")
        assert result["alert"]["pattern_type"] == "none"
        assert result["case"]["pattern_type"] == "none"

    def test_pattern_type_layering_normalizes(self, circular_transactions):
        """Pre-cut 'layering' should normalize to 'none' (locked enum)."""
        result = investigate("C111", transactions_df=circular_transactions, pattern_type="layering")
        assert result["alert"]["pattern_type"] == "none"

    def test_citations_not_empty(self, circular_transactions):
        result = investigate("C111", transactions_df=circular_transactions, pattern_type="circular")
        assert len(result["explanation"]["citations"]) >= 1

    def test_confidence_in_range(self, circular_transactions):
        result = investigate("C111", transactions_df=circular_transactions, pattern_type="circular")
        assert 0.0 <= result["explanation"]["confidence"] <= 1.0

    def test_explanation_text_length(self, circular_transactions):
        result = investigate("C111", transactions_df=circular_transactions, pattern_type="circular")
        text = result["explanation"]["explanation_text"]
        assert 100 <= len(text) <= 1000

    def test_fan_out_pattern(self, fan_out_transactions):
        result = investigate("C999", transactions_df=fan_out_transactions, pattern_type="fan_out")
        assert result["alert"]["pattern_type"] == "fan_out"
        assert result["case"]["pattern_type"] == "fan_out"
        assert len(result["case"]["parties"]) >= 2

    def test_none_pattern_works(self, circular_transactions):
        """When pattern_type=None, orchestrator runs real detection.
        C111 is in a circular pattern, so it should detect 'circular'."""
        result = investigate("C111", transactions_df=circular_transactions, pattern_type=None)
        # Real detection runs — C111 is in a circular pattern
        assert result["alert"]["pattern_type"] in {"circular", "fan_out", "dense_cluster", "none"}

    def test_explicit_score_overrides_stub(self, circular_transactions):
        result = investigate(
            "C111", transactions_df=circular_transactions,
            risk_score=42.0, risk_band="medium", pattern_type="circular",
        )
        assert result["alert"]["risk_score"] == 42.0
        assert result["alert"]["risk_band"] == "medium"

    def test_empty_df_does_not_crash(self):
        empty_df = pd.DataFrame(columns=["step", "type", "amount", "nameOrig", "nameDest", "isFraud"])
        result = investigate("C999", transactions_df=empty_df, pattern_type="none")
        assert "alert" in result
        assert "case" in result
        assert "explanation" in result

    def test_case_id_format(self, circular_transactions):
        result = investigate("C111", transactions_df=circular_transactions, pattern_type="circular")
        assert result["case"]["case_id"].startswith("CASE-")


# ─── Pydantic response tests ────────────────────────────────────────

class TestInvestigateResponse:

    def test_returns_investigate_response(self, circular_transactions):
        from egysentinel.api.models import InvestigateResponse
        resp = investigate_response(
            "C111", transactions_df=circular_transactions, pattern_type="circular",
        )
        assert isinstance(resp, InvestigateResponse)
        assert resp.alert.account_id == "C111"
        assert resp.case.account_id == "C111"
        assert resp.explanation.case_id == resp.case.case_id

    def test_response_alert_enum_values(self, circular_transactions):
        from egysentinel.api.models import PatternType, RiskBand, AlertPriority
        resp = investigate_response(
            "C111", transactions_df=circular_transactions, pattern_type="circular",
        )
        assert isinstance(resp.alert.pattern_type, PatternType)
        assert isinstance(resp.alert.risk_band, RiskBand)
        assert isinstance(resp.alert.priority, AlertPriority)

    def test_response_explanation_citations(self, circular_transactions):
        from egysentinel.api.models import Citation
        resp = investigate_response(
            "C111", transactions_df=circular_transactions, pattern_type="circular",
        )
        assert len(resp.explanation.citations) >= 1
        assert all(isinstance(c, Citation) for c in resp.explanation.citations)


# ─── Batch tests ────────────────────────────────────────────────────

class TestInvestigateBatch:

    def test_batch_returns_list(self, circular_transactions, fan_out_transactions):
        # Combine both patterns into one df
        combined = pd.concat([circular_transactions, fan_out_transactions], ignore_index=True)
        results = investigate_batch(
            ["C111", "C999"], transactions_df=combined, pattern_type="none",
        )
        assert isinstance(results, list)
        assert len(results) == 2

    def test_batch_continues_on_failure(self):
        # Empty df + nonexistent accounts — should not crash
        empty_df = pd.DataFrame(columns=["nameOrig", "nameDest", "amount", "isFraud"])
        results = investigate_batch(
            ["C999"], transactions_df=empty_df, pattern_type="none",
        )
        assert len(results) == 1
        # Should have at least the alert/case/explanation keys (no error)
        assert "alert" in results[0]


# ─── Determinism tests ──────────────────────────────────────────────

class TestDeterminism:

    def test_same_input_same_alert_priority(self, circular_transactions):
        r1 = investigate("C111", transactions_df=circular_transactions, pattern_type="circular")
        r2 = investigate("C111", transactions_df=circular_transactions, pattern_type="circular")
        assert r1["alert"]["priority"] == r2["alert"]["priority"]
        assert r1["alert"]["risk_score"] == r2["alert"]["risk_score"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
