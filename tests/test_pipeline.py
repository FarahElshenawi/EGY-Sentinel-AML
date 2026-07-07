"""
test_pipeline.py — Day 5-6 End-to-End Pipeline Tests

Tests the full flow: DS-3 risk output + AI-2 alert → evidence → case report.
Uses mocked transaction data (no real PaySim CSV needed).

Run:
    cd egysentinel
    python -m pytest tests/test_pipeline.py -v
"""

from __future__ import annotations

import json
import time
import pytest
import pandas as pd

from egysentinel.agents.pipeline import (
    process_alert_to_case,
    batch_process_alerts,
    normalize_pattern_type,
)
from egysentinel.agents.case_builder_agent import validate_case_report, _case_counter
from egysentinel.agents.evidence import assemble_evidence


# ============================================================
# Fixtures
# ============================================================

@pytest.fixture(autouse=True)
def reset_case_counter():
    """Reset the global case counter before each test."""
    import egysentinel.agents.case_builder_agent as cb
    cb._case_counter = 0
    yield
    cb._case_counter = 0


@pytest.fixture
def sample_transactions_df() -> pd.DataFrame:
    """Create a small synthetic transaction DataFrame mimicking PaySim."""
    return pd.DataFrame([
        {"step": 10, "nameOrig": "C111111111", "nameDest": "C222222222", "amount": 500000.0, "type": "TRANSFER"},
        {"step": 11, "nameOrig": "C222222222", "nameDest": "C333333333", "amount": 490000.0, "type": "TRANSFER"},
        {"step": 12, "nameOrig": "C333333333", "nameDest": "C111111111", "amount": 480000.0, "type": "CASH_OUT"},
        {"step": 15, "nameOrig": "C111111111", "nameDest": "C999999999", "amount": 10000.0, "type": "PAYMENT"},
        {"step": 16, "nameOrig": "C888888888", "nameDest": "C111111111", "amount": 5000.0, "type": "CASH_IN"},
    ])


@pytest.fixture
def fan_out_df() -> pd.DataFrame:
    """Fan-out pattern: one account sends to many."""
    return pd.DataFrame([
        {"step": 20, "nameOrig": "C400000001", "nameDest": "C400000002", "amount": 95000.0, "type": "TRANSFER"},
        {"step": 20, "nameOrig": "C400000001", "nameDest": "C400000003", "amount": 92000.0, "type": "TRANSFER"},
        {"step": 21, "nameOrig": "C400000001", "nameDest": "C400000004", "amount": 98000.0, "type": "TRANSFER"},
        {"step": 21, "nameOrig": "C400000001", "nameDest": "C400000005", "amount": 90000.0, "type": "TRANSFER"},
        {"step": 22, "nameOrig": "C400000001", "nameDest": "C400000006", "amount": 85000.0, "type": "TRANSFER"},
    ])


@pytest.fixture
def sample_risk_output() -> dict:
    return {
        "account_id": "C111111111",
        "rule_score": 85.0,
        "ml_prob": 0.92,
        "final_score": 88.5,
        "risk_band": "high",
        "pattern_type": "circular",
        "total_amount": 1485000.0,
    }


@pytest.fixture
def sample_alert() -> dict:
    return {
        "priority": "high",
        "summary": "Account C111111111 shows circular fund movement with 3 accounts totaling 1,485,000 EGP.",
        "recommended_action": "escalate",
    }


@pytest.fixture
def circular_flow_risk_output() -> dict:
    return {
        "account_id": "C111111111",
        "rule_score": 90.0,
        "ml_prob": 0.95,
        "final_score": 92.5,
        "risk_band": "high",
        "pattern_type": "circular_flow",
        "total_amount": 1485000.0,
    }


@pytest.fixture
def tmp_patterns_csv(tmp_path) -> str:
    patterns_path = tmp_path / "patterns.csv"
    df = pd.DataFrame([
        {"account_id": "C111111111", "pattern_type": "circular", "description": "Funds loop through 3 accounts", "confidence": 0.91},
        {"account_id": "C400000001", "pattern_type": "fan_out", "description": "Rapid disbursement to 5 accounts", "confidence": 0.88},
    ])
    df.to_csv(patterns_path, index=False)
    return str(patterns_path)


# ============================================================
# Test: Pattern Name Normalization
# ============================================================

class TestPatternNormalization:

    def test_circular_flow_normalizes_to_circular(self):
        assert normalize_pattern_type("circular_flow") == "circular"

    def test_canonical_names_pass_through(self):
        for name in ["circular", "fan_out", "dense_cluster", "none"]:
            assert normalize_pattern_type(name) == name

    def test_unknown_returns_fallback(self):
        assert normalize_pattern_type("totally_unknown") == "none"

    def test_none_returns_fallback(self):
        assert normalize_pattern_type(None) == "none"

    def test_empty_string_returns_fallback(self):
        assert normalize_pattern_type("") == "none"

    def test_case_insensitive(self):
        assert normalize_pattern_type("CIRCULAR_FLOW") == "circular"
        assert normalize_pattern_type("Fan_Out") == "fan_out"

    def test_structuring_maps_to_fan_out(self):
        assert normalize_pattern_type("structuring") == "fan_out"

    def test_funneling_maps_to_fan_out(self):
        # funneling was previously fan_in, but fan_in was cut — now maps to fan_out
        assert normalize_pattern_type("funneling") == "fan_out"

    def test_layering_maps_to_none(self):
        # layering was cut from scope — no canonical equivalent, maps to "none"
        assert normalize_pattern_type("layering") == "none"

    def test_fan_in_maps_to_fan_out(self):
        # fan_in was cut — its inverse (fan_out) is the closest valid pattern
        assert normalize_pattern_type("fan_in") == "fan_out"


# ============================================================
# Test: End-to-End Pipeline (stub mode)
# ============================================================

class TestPipelineStub:

    def test_basic_pipeline_produces_valid_case(
        self, sample_risk_output, sample_alert,
        sample_transactions_df, tmp_patterns_csv
    ):
        report = process_alert_to_case(
            risk_output=sample_risk_output,
            alert=sample_alert,
            transactions_df=sample_transactions_df,
            patterns_csv=tmp_patterns_csv,
            use_glm=False,
        )
        assert "case_id" in report
        assert report["account_id"] == "C111111111"
        assert report["alert_id"] == "ALERT-C111111111"
        assert "timeline" in report
        assert "parties" in report
        assert "narrative" in report
        assert "sar_fields" in report

    def test_pipeline_passes_validation(
        self, sample_risk_output, sample_alert,
        sample_transactions_df, tmp_patterns_csv
    ):
        report = process_alert_to_case(
            risk_output=sample_risk_output,
            alert=sample_alert,
            transactions_df=sample_transactions_df,
            patterns_csv=tmp_patterns_csv,
            use_glm=False,
        )
        errors = validate_case_report(report)
        assert errors == [], f"Unexpected validation errors: {errors}"

    def test_pipeline_metadata_attached(
        self, sample_risk_output, sample_alert,
        sample_transactions_df, tmp_patterns_csv
    ):
        report = process_alert_to_case(
            risk_output=sample_risk_output,
            alert=sample_alert,
            transactions_df=sample_transactions_df,
            patterns_csv=tmp_patterns_csv,
            use_glm=False,
        )
        assert "_pipeline" in report
        assert report["_pipeline"]["alert_priority"] == "high"
        assert report["_pipeline"]["recommended_action"] == "escalate"
        assert report["_pipeline"]["use_glm"] is False
        assert "latency_ms" in report["_pipeline"]

    def test_circular_flow_normalization_in_pipeline(
        self, circular_flow_risk_output, sample_alert,
        sample_transactions_df, tmp_patterns_csv
    ):
        report = process_alert_to_case(
            risk_output=circular_flow_risk_output,
            alert=sample_alert,
            transactions_df=sample_transactions_df,
            patterns_csv=tmp_patterns_csv,
            use_glm=False,
        )
        assert report["pattern_type"] == "circular"

    def test_stub_mode_marks_fallback(
        self, sample_risk_output, sample_alert,
        sample_transactions_df, tmp_patterns_csv
    ):
        report = process_alert_to_case(
            risk_output=sample_risk_output,
            alert=sample_alert,
            transactions_df=sample_transactions_df,
            patterns_csv=tmp_patterns_csv,
            use_glm=False,
        )
        assert report.get("_fallback") is True

    def test_sar_fields_match_pattern(
        self, sample_risk_output, sample_alert,
        sample_transactions_df, tmp_patterns_csv
    ):
        report = process_alert_to_case(
            risk_output=sample_risk_output,
            alert=sample_alert,
            transactions_df=sample_transactions_df,
            patterns_csv=tmp_patterns_csv,
            use_glm=False,
        )
        assert report["sar_fields"]["suspicious_activity_type"] == "circular_transfer"

    def test_fan_out_pattern_end_to_end(
        self, fan_out_df, tmp_path
    ):
        patterns_path = tmp_path / "patterns.csv"
        pd.DataFrame([{
            "account_id": "C400000001",
            "pattern_type": "fan_out",
            "description": "Rapid disbursement to 5 accounts within 2 hours",
            "confidence": 0.88,
        }]).to_csv(patterns_path, index=False)

        risk_output = {
            "account_id": "C400000001",
            "final_score": 78.0,
            "risk_band": "high",
            "pattern_type": "fan_out",
            "total_amount": 460000.0,
        }
        alert = {
            "priority": "high",
            "summary": "Account C400000001 sent funds to 5 accounts rapidly.",
            "recommended_action": "escalate",
        }

        report = process_alert_to_case(
            risk_output=risk_output,
            alert=alert,
            transactions_df=fan_out_df,
            patterns_csv=str(patterns_path),
            use_glm=False,
        )

        errors = validate_case_report(report)
        assert errors == [], f"Validation errors: {errors}"
        assert report["pattern_type"] == "fan_out"
        assert report["sar_fields"]["suspicious_activity_type"] == "structuring"
        assert len(report["parties"]) == 6

    def test_timeline_chronological(
        self, sample_risk_output, sample_alert,
        sample_transactions_df, tmp_patterns_csv
    ):
        report = process_alert_to_case(
            risk_output=sample_risk_output,
            alert=sample_alert,
            transactions_df=sample_transactions_df,
            patterns_csv=tmp_patterns_csv,
            use_glm=False,
        )
        steps = [t["step"] for t in report["timeline"]]
        assert steps == sorted(steps)

    def test_latency_under_1_second_stub(
        self, sample_risk_output, sample_alert,
        sample_transactions_df, tmp_patterns_csv
    ):
        start = time.time()
        report = process_alert_to_case(
            risk_output=sample_risk_output,
            alert=sample_alert,
            transactions_df=sample_transactions_df,
            patterns_csv=tmp_patterns_csv,
            use_glm=False,
        )
        elapsed = time.time() - start
        assert elapsed < 1.0, f"Stub took {elapsed:.2f}s"
        assert report["_pipeline"]["latency_ms"] < 1000


# ============================================================
# Test: Batch Processing
# ============================================================

class TestBatchProcessing:

    def test_batch_processes_multiple_alerts(
        self, sample_transactions_df, tmp_path
    ):
        patterns_path = tmp_path / "patterns.csv"
        pd.DataFrame([
            {"account_id": "C111111111", "pattern_type": "circular", "description": "Circular", "confidence": 0.9},
            {"account_id": "C400000001", "pattern_type": "fan_out", "description": "Fan out", "confidence": 0.85},
        ]).to_csv(patterns_path, index=False)

        risk_outputs = [
            {"account_id": "C111111111", "final_score": 88.5, "risk_band": "high", "pattern_type": "circular"},
            {"account_id": "C400000001", "final_score": 78.0, "risk_band": "high", "pattern_type": "fan_out"},
        ]
        alerts = [
            {"priority": "high", "summary": "Circular", "recommended_action": "escalate"},
            {"priority": "high", "summary": "Fan out", "recommended_action": "investigate"},
        ]

        reports = batch_process_alerts(
            risk_outputs=risk_outputs,
            alerts=alerts,
            transactions_df=sample_transactions_df,
            patterns_csv=str(patterns_path),
            use_glm=False,
        )

        assert len(reports) == 2
        assert reports[0]["account_id"] == "C111111111"
        assert reports[1]["account_id"] == "C400000001"

    def test_batch_mismatched_lengths_raises(self, sample_transactions_df, tmp_patterns_csv):
        with pytest.raises(ValueError, match="same length"):
            batch_process_alerts(
                risk_outputs=[{"account_id": "X"}],
                alerts=[{}, {}],
                transactions_df=sample_transactions_df,
                patterns_csv=tmp_patterns_csv,
                use_glm=False,
            )

    def test_batch_continues_on_single_failure(
        self, sample_transactions_df, tmp_path
    ):
        patterns_path = tmp_path / "patterns.csv"
        pd.DataFrame(columns=["account_id", "pattern_type", "description", "confidence"]).to_csv(
            patterns_path, index=False
        )

        risk_outputs = [
            {"account_id": "C111111111", "final_score": 88.5, "risk_band": "high", "pattern_type": "circular"},
            {"account_id": "", "final_score": 50.0, "risk_band": "medium", "pattern_type": "unknown"},
        ]
        alerts = [
            {"priority": "high", "summary": "OK", "recommended_action": "escalate"},
            {"priority": "low", "summary": "Bad", "recommended_action": "monitor"},
        ]

        reports = batch_process_alerts(
            risk_outputs=risk_outputs,
            alerts=alerts,
            transactions_df=sample_transactions_df,
            patterns_csv=str(patterns_path),
            use_glm=False,
        )

        assert len(reports) == 2
        assert "case_id" in reports[0]
        assert "error" in reports[1]


# ============================================================
# Test: Edge Cases
# ============================================================

class TestPipelineEdgeCases:

    def test_no_transactions_in_df(self, tmp_path):
        patterns_path = tmp_path / "patterns.csv"
        pd.DataFrame(columns=["account_id", "pattern_type"]).to_csv(patterns_path, index=False)

        risk_output = {
            "account_id": "C999999999",
            "final_score": 60.0,
            "risk_band": "high",
            "pattern_type": "none",
        }
        alert = {"priority": "medium", "summary": "Test", "recommended_action": "investigate"}

        report = process_alert_to_case(
            risk_output=risk_output,
            alert=alert,
            transactions_df=pd.DataFrame(columns=["step", "nameOrig", "nameDest", "amount", "type"]),
            patterns_csv=str(patterns_path),
            use_glm=False,
        )
        assert report["account_id"] == "C999999999"
        assert report["timeline"] == []

    def test_missing_pattern_uses_fallback(
        self, sample_transactions_df, tmp_path
    ):
        patterns_path = tmp_path / "patterns.csv"
        pd.DataFrame(columns=["account_id", "pattern_type"]).to_csv(patterns_path, index=False)

        risk_output = {
            "account_id": "C111111111",
            "final_score": 88.5,
            "risk_band": "high",
            "pattern_type": "circular_flow",
        }
        alert = {"priority": "high", "summary": "Test", "recommended_action": "escalate"}

        report = process_alert_to_case(
            risk_output=risk_output,
            alert=alert,
            transactions_df=sample_transactions_df,
            patterns_csv=str(patterns_path),
            use_glm=False,
        )
        assert report["pattern_type"] == "circular"