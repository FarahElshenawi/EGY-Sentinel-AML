"""
test_case_builder.py — Tests for AI-3 Case Builder Agent (Day 2)

Tests the evidence assembler and case builder stub with synthetic data.
Covers:
  1. Evidence assembly from synthetic transactions
  2. Case builder stub produces schema-valid output
  3. Timeline is chronological
  4. Parties have correct roles
  5. total_amount matches timeline sum
  6. SAR fields populated per pattern type
"""

import sys
from pathlib import Path

import pandas as pd
import pytest

# Add parent dir to path so we can import egysentinel
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from egysentinel.agents.evidence import (
    assemble_evidence,
    get_involved_accounts,
    get_involved_transactions,
    get_pattern_for_account,
    load_patterns,
)
from egysentinel.agents.case_builder_agent import (
    build_case_stub,
    validate_case_report,
    _compute_parties,
    _compute_timeline,
    _compute_total_amount,
    _generate_stub_sar_fields,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def synthetic_transactions() -> pd.DataFrame:
    """Create a synthetic transaction DataFrame simulating a circular pattern.

    A -> B -> C -> D -> A  (4-account cycle, each step 1 hour apart)
    """
    return pd.DataFrame([
        {"step": 10, "type": "TRANSFER", "amount": 500000.0,
         "nameOrig": "C111111111", "nameDest": "C222222222",
         "oldbalanceOrg": 500000.0, "newbalanceOrg": 0.0,
         "oldbalanceDest": 0.0, "newbalanceDest": 500000.0,
         "isFraud": 1, "isFlaggedFraud": 0},
        {"step": 11, "type": "TRANSFER", "amount": 500000.0,
         "nameOrig": "C222222222", "nameDest": "C333333333",
         "oldbalanceOrg": 500000.0, "newbalanceOrg": 0.0,
         "oldbalanceDest": 0.0, "newbalanceDest": 500000.0,
         "isFraud": 1, "isFlaggedFraud": 0},
        {"step": 12, "type": "TRANSFER", "amount": 500000.0,
         "nameOrig": "C333333333", "nameDest": "C444444444",
         "oldbalanceOrg": 500000.0, "newbalanceOrg": 0.0,
         "oldbalanceDest": 0.0, "newbalanceDest": 500000.0,
         "isFraud": 1, "isFlaggedFraud": 0},
        {"step": 13, "type": "CASH_OUT", "amount": 500000.0,
         "nameOrig": "C444444444", "nameDest": "C111111111",
         "oldbalanceOrg": 500000.0, "newbalanceOrg": 0.0,
         "oldbalanceDest": 0.0, "newbalanceDest": 500000.0,
         "isFraud": 1, "isFlaggedFraud": 0},
    ])


@pytest.fixture
def synthetic_evidence(synthetic_transactions) -> dict:
    """Pre-built evidence object for the circular case."""
    return {
        "account_id": "C111111111",
        "alert_id": "ALERT-000001",
        "risk_score": 92.5,
        "risk_band": "high",
        "pattern_type": "circular",
        "accounts": ["C111111111", "C222222222", "C333333333", "C444444444"],
        "transactions": synthetic_transactions.to_dict(orient="records"),
        "pattern_details": {
            "description": "4-account circular flow: C111111111 -> C222222222 -> C333333333 -> C444444444 -> C111111111",
            "detector_confidence": 0.95,
        },
    }


@pytest.fixture
def fan_out_evidence() -> dict:
    """Evidence for a fan-out pattern: one sender, many receivers."""
    transactions = []
    for i in range(10):
        transactions.append({
            "step": 50 + i,
            "type": "TRANSFER",
            "amount": 100000.0,
            "nameOrig": "C999999999",
            "nameDest": f"C{(100000 + i):09d}",
        })

    return {
        "account_id": "C999999999",
        "alert_id": "ALERT-000042",
        "risk_score": 78.0,
        "risk_band": "high",
        "pattern_type": "fan_out",
        "accounts": ["C999999999"] + [f"C{(100000 + i):09d}" for i in range(10)],
        "transactions": transactions,
    }


@pytest.fixture
def none_pattern_evidence() -> dict:
    """Evidence for a 'none' pattern: high-risk score without a detected pattern.

    (Replaces the cut 'layering' fixture — layering was removed from the locked enum.)
    """
    return {
        "account_id": "C555555555",
        "alert_id": "ALERT-000099",
        "risk_score": 88.0,
        "risk_band": "high",
        "pattern_type": "none",
        "accounts": ["C555555555", "C666666666", "C777777777", "C888888888"],
        "transactions": [
            {"step": 100, "type": "TRANSFER", "amount": 980000.0,
             "nameOrig": "C555555555", "nameDest": "C666666666"},
            {"step": 101, "type": "TRANSFER", "amount": 970000.0,
             "nameOrig": "C666666666", "nameDest": "C777777777"},
            {"step": 102, "type": "CASH_OUT", "amount": 960000.0,
             "nameOrig": "C777777777", "nameDest": "C888888888"},
        ],
    }


# ---------------------------------------------------------------------------
# Test: Evidence Assembly
# ---------------------------------------------------------------------------

class TestEvidenceAssembly:
    """Tests for agents/evidence.py"""

    def test_get_involved_transactions_filters_correctly(self, synthetic_transactions):
        """Only transactions involving the flagged account should be returned."""
        txns = get_involved_transactions("C111111111", synthetic_transactions)
        assert len(txns) == 2  # C111111111 sends step 10, receives step 13
        assert txns[0]["step"] == 10
        assert txns[1]["step"] == 13

    def test_get_involved_transactions_sorted_by_step(self, synthetic_transactions):
        """Transactions must be returned in chronological order."""
        txns = get_involved_transactions("C111111111", synthetic_transactions)
        steps = [t["step"] for t in txns]
        assert steps == sorted(steps)

    def test_get_involved_transactions_max_cap(self, fan_out_evidence):
        """Should not exceed max_transactions cap."""
        df = pd.DataFrame(fan_out_evidence["transactions"])
        txns = get_involved_transactions("C999999999", df, max_transactions=3)
        assert len(txns) <= 3

    def test_get_involved_accounts_includes_all(self, synthetic_transactions):
        """All accounts from filtered transactions should be in the result."""
        txns = get_involved_transactions("C111111111", synthetic_transactions)
        accounts = get_involved_accounts("C111111111", txns)
        assert len(accounts) == 3
        assert "C111111111" in accounts
        assert "C222222222" in accounts
        assert "C444444444" in accounts

    def test_subject_is_first_account(self, synthetic_transactions):
        """The subject account must always be first."""
        txns = get_involved_transactions("C111111111", synthetic_transactions)
        accounts = get_involved_accounts("C111111111", txns)
        assert accounts[0] == "C111111111"

    def test_assemble_evidence_structure(self, synthetic_transactions, tmp_path):
        """assemble_evidence should return a dict with all required fields."""
        patterns_df = pd.DataFrame([{
            "account_id": "C111111111",
            "pattern_type": "circular",
            "description": "4-account cycle",
            "confidence": 0.95,
        }])
        patterns_path = tmp_path / "patterns.csv"
        patterns_df.to_csv(patterns_path, index=False)

        evidence = assemble_evidence(
            account_id="C111111111",
            transactions_df=synthetic_transactions,
            alert_id="ALERT-000001",
            risk_score=92.5,
            risk_band="high",
            patterns_csv=str(patterns_path),
        )

        assert evidence["account_id"] == "C111111111"
        assert evidence["alert_id"] == "ALERT-000001"
        assert evidence["risk_score"] == 92.5
        assert evidence["risk_band"] == "high"
        assert evidence["pattern_type"] == "circular"
        assert isinstance(evidence["accounts"], list)
        assert isinstance(evidence["transactions"], list)
        assert "pattern_details" in evidence

    def test_assemble_evidence_without_patterns_csv(self, synthetic_transactions):
        """Should still work if patterns.csv doesn't exist."""
        evidence = assemble_evidence(
            account_id="C111111111",
            transactions_df=synthetic_transactions,
            alert_id="ALERT-000001",
            risk_score=92.5,
            risk_band="high",
            patterns_csv="nonexistent/path/patterns.csv",
        )

        assert evidence["pattern_type"] is None
        assert "pattern_details" not in evidence


# ---------------------------------------------------------------------------
# Test: Case Builder Stub
# ---------------------------------------------------------------------------

class TestCaseBuilderStub:
    """Tests for agents/case_builder_agent.py"""

    def test_stub_returns_all_required_fields(self, synthetic_evidence):
        """Stub must produce all required top-level fields."""
        report = build_case_stub(synthetic_evidence)

        required = [
            "case_id", "account_id", "alert_id", "timeline", "parties",
            "total_amount", "pattern_type", "narrative", "sar_fields",
            "generated_at",
        ]
        for field in required:
            assert field in report, f"Missing required field: {field}"

    def test_stub_case_id_format(self, synthetic_evidence):
        """Case IDs should follow CASE-XXXXXX format (hash-based, 6 chars)."""
        report = build_case_stub(synthetic_evidence)
        assert report["case_id"].startswith("CASE-")
        assert len(report["case_id"]) == 11  # CASE-XXXXXX (CASE- + 6 hex chars)

    def test_stub_account_id_matches_evidence(self, synthetic_evidence):
        """account_id in report must match evidence."""
        report = build_case_stub(synthetic_evidence)
        assert report["account_id"] == "C111111111"

    def test_stub_timeline_is_chronological(self, synthetic_evidence):
        """Timeline must be sorted by step."""
        report = build_case_stub(synthetic_evidence)
        steps = [t["step"] for t in report["timeline"]]
        assert steps == sorted(steps)

    def test_stub_timeline_items_have_required_fields(self, synthetic_evidence):
        """Each timeline entry must have step, event, account_id, amount."""
        report = build_case_stub(synthetic_evidence)
        for item in report["timeline"]:
            assert "step" in item
            assert "event" in item
            assert "account_id" in item
            assert "amount" in item

    def test_stub_timeline_event_uses_counterparty(self, synthetic_evidence):
        """Timeline events should reference the counterparty, not the subject."""
        report = build_case_stub(synthetic_evidence)
        for item in report["timeline"]:
            assert item["account_id"] != "C111111111"

    def test_stub_parties_have_valid_roles(self, synthetic_evidence):
        """All parties must have a valid role."""
        report = build_case_stub(synthetic_evidence)
        valid_roles = {"sender", "receiver", "intermediary", "subject"}
        for party in report["parties"]:
            assert party["role"] in valid_roles, f"Invalid role: {party['role']}"

    def test_stub_subject_party_exists(self, synthetic_evidence):
        """One party must have role='subject'."""
        report = build_case_stub(synthetic_evidence)
        roles = [p["role"] for p in report["parties"]]
        assert "subject" in roles

    def test_stub_subject_is_first_party(self, synthetic_evidence):
        """Subject should be the first party in the list."""
        report = build_case_stub(synthetic_evidence)
        assert report["parties"][0]["role"] == "subject"
        assert report["parties"][0]["account_id"] == "C111111111"

    def test_stub_intermediary_detected(self, synthetic_evidence):
        """In a circular pattern, all non-subject accounts are intermediaries."""
        report = build_case_stub(synthetic_evidence)
        non_subject_roles = [p["role"] for p in report["parties"] if p["role"] != "subject"]
        assert all(r == "intermediary" for r in non_subject_roles), \
            f"Expected all intermediaries, got: {non_subject_roles}"

    def test_stub_total_amount_matches_timeline(self, synthetic_evidence):
        """total_amount must equal the sum of all timeline amounts."""
        report = build_case_stub(synthetic_evidence)
        computed = round(sum(t["amount"] for t in report["timeline"]), 2)
        assert report["total_amount"] == computed

    def test_stub_total_amount_circular_is_correct(self, synthetic_evidence):
        """For circular with 4 txns of 500K each, total = 2,000,000."""
        report = build_case_stub(synthetic_evidence)
        assert report["total_amount"] == 2_000_000.0

    def test_stub_narrative_not_empty(self, synthetic_evidence):
        """Narrative must not be empty."""
        report = build_case_stub(synthetic_evidence)
        assert len(report["narrative"]) > 50
        assert "C111111111" in report["narrative"]

    def test_stub_sar_fields_required(self, synthetic_evidence):
        """SAR fields must have filing_reason and suspicious_activity_type."""
        report = build_case_stub(synthetic_evidence)
        assert "filing_reason" in report["sar_fields"]
        assert "suspicious_activity_type" in report["sar_fields"]

    def test_stub_pattern_type_matches_evidence(self, synthetic_evidence):
        """pattern_type in report must match evidence."""
        report = build_case_stub(synthetic_evidence)
        assert report["pattern_type"] == "circular"

    def test_stub_generated_at_is_iso8601(self, synthetic_evidence):
        """generated_at should be a valid ISO 8601 UTC timestamp."""
        report = build_case_stub(synthetic_evidence)
        assert report["generated_at"].endswith("Z") or "+" in report["generated_at"]

    def test_stub_validates_cleanly(self, synthetic_evidence):
        """validate_case_report should return zero errors for stub output."""
        report = build_case_stub(synthetic_evidence)
        errors = validate_case_report(report)
        assert errors == [], f"Unexpected validation errors: {errors}"

    def test_stub_is_serializable_json(self, synthetic_evidence):
        """Report must be JSON-serializable."""
        import json
        report = build_case_stub(synthetic_evidence)
        json_str = json.dumps(report, indent=2)
        assert len(json_str) > 100

    def test_case_ids_are_sequential(self, synthetic_evidence):
        """Case IDs are now deterministic per account_id (hash-based).
        Same account → same case ID. Different accounts → different case IDs."""
        import egysentinel.agents.case_builder_agent as mod
        mod._case_id_cache.clear()

        r1 = build_case_stub(synthetic_evidence)
        r2 = build_case_stub(synthetic_evidence)
        # Same account → same case ID (idempotent)
        assert r1["case_id"] == r2["case_id"]
        assert r1["case_id"].startswith("CASE-")
        # Hash-based, 6-char hex suffix
        assert len(r1["case_id"]) == 11  # CASE-XXXXXX

        # Different account → different case ID
        other_evidence = {**synthetic_evidence, "account_id": "C999999"}
        r3 = build_case_stub(other_evidence)
        assert r3["case_id"] != r1["case_id"]


# ---------------------------------------------------------------------------
# Test: Pattern-specific SAR fields
# ---------------------------------------------------------------------------

class TestSARFieldsByPattern:
    """Verify SAR fields are correctly populated for each pattern type."""

    @pytest.mark.parametrize("pattern,expected_activity", [
        ("circular", "circular_transfer"),
        ("fan_out", "structuring"),
        ("dense_cluster", "coordinated_activity"),
        ("none", "unusual_activity"),
    ])
    def test_sar_activity_type(self, pattern, expected_activity):
        """Each pattern type should map to the correct suspicious_activity_type."""
        evidence = {
            "account_id": "C000000000",
            "alert_id": "ALERT-TEST",
            "risk_score": 80.0,
            "risk_band": "high",
            "pattern_type": pattern,
            "accounts": ["C000000000", "C111111111"],
            "transactions": [
                {"step": 1, "type": "TRANSFER", "amount": 100.0,
                 "nameOrig": "C000000000", "nameDest": "C111111111"},
            ],
        }
        report = build_case_stub(evidence)
        assert report["sar_fields"]["suspicious_activity_type"] == expected_activity
        assert len(report["sar_fields"]["filing_reason"]) > 10


# ---------------------------------------------------------------------------
# Test: Fan-out pattern
# ---------------------------------------------------------------------------

class TestFanOutPattern:
    """Specific tests for the fan-out evidence."""

    def test_fan_out_parties_roles(self, fan_out_evidence):
        """In fan-out: subject is sender, all others are receivers."""
        report = build_case_stub(fan_out_evidence)
        assert report["parties"][0]["role"] == "subject"
        assert report["parties"][0]["account_id"] == "C999999999"

        non_subject = [p for p in report["parties"] if p["role"] != "subject"]
        assert all(p["role"] == "receiver" for p in non_subject)

    def test_fan_out_total_amount(self, fan_out_evidence):
        """10 transactions of 100K each = 1,000,000."""
        report = build_case_stub(fan_out_evidence)
        assert report["total_amount"] == 1_000_000.0

    def test_fan_out_timeline_length(self, fan_out_evidence):
        """All 10 transactions should appear in timeline."""
        report = build_case_stub(fan_out_evidence)
        assert len(report["timeline"]) == 10


# ---------------------------------------------------------------------------
# Test: None pattern (high-risk account without a detected pattern)
# ---------------------------------------------------------------------------

class TestNonePattern:
    """Specific tests for the 'none' pattern (replaces cut layering tests)."""

    def test_none_pattern_intermediary_detected(self, none_pattern_evidence):
        """In a chain A->B->C->D: middle accounts (B, C) should be intermediaries."""
        report = build_case_stub(none_pattern_evidence)

        roles = {p["account_id"]: p["role"] for p in report["parties"]}
        assert roles["C555555555"] == "subject"
        assert roles["C666666666"] == "intermediary"
        assert roles["C777777777"] == "intermediary"
        assert roles["C888888888"] == "receiver"

    def test_none_pattern_total_amount(self, none_pattern_evidence):
        """Evidence has 3 transactions: 980K + 970K + 960K = 2,910,000."""
        report = build_case_stub(none_pattern_evidence)
        assert report["total_amount"] == 2_910_000.0


# ---------------------------------------------------------------------------
# Test: Validation function
# ---------------------------------------------------------------------------

class TestValidation:
    """Tests for the validate_case_report function."""

    def test_valid_report_passes(self, synthetic_evidence):
        report = build_case_stub(synthetic_evidence)
        assert validate_case_report(report) == []

    def test_missing_field_detected(self, synthetic_evidence):
        report = build_case_stub(synthetic_evidence)
        del report["narrative"]
        errors = validate_case_report(report)
        assert any("narrative" in e for e in errors)

    def test_invalid_role_detected(self, synthetic_evidence):
        report = build_case_stub(synthetic_evidence)
        report["parties"][0]["role"] = "hacker"
        errors = validate_case_report(report)
        assert any("role" in e for e in errors)

    def test_invalid_pattern_detected(self, synthetic_evidence):
        report = build_case_stub(synthetic_evidence)
        report["pattern_type"] = "money_laundering"
        errors = validate_case_report(report)
        assert any("pattern_type" in e for e in errors)

    def test_timeline_order_violation_detected(self, synthetic_evidence):
        report = build_case_stub(synthetic_evidence)
        if len(report["timeline"]) >= 2:
            report["timeline"][0], report["timeline"][1] = (
                report["timeline"][1], report["timeline"][0]
            )
            errors = validate_case_report(report)
            assert any("chronological" in e for e in errors)

    def test_total_amount_mismatch_detected(self, synthetic_evidence):
        report = build_case_stub(synthetic_evidence)
        report["total_amount"] = 999_999.99
        errors = validate_case_report(report)
        assert any("total_amount" in e for e in errors)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])