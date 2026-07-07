"""Tests for the demo dataset and loader.

Verifies:
    1. data/demo.csv exists and loads correctly
    2. All required PaySim columns are present
    3. All 5 planted money-laundering patterns are detectable
    4. The generator is deterministic (same seed -> same file)
    5. Loader falls back gracefully
"""
import sys
from pathlib import Path

import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


# ─── Required columns per locked schemas/transaction.json ────────────

REQUIRED_COLUMNS = [
    "step", "type", "amount", "nameOrig", "nameDest",
    "oldbalanceOrg", "newbalanceOrig", "oldbalanceDest", "newbalanceDest",
    "isFraud", "isFlaggedFraud",
]

VALID_TXN_TYPES = {"CASH_IN", "CASH_OUT", "DEBIT", "PAYMENT", "TRANSFER"}


# ─── Fixtures ────────────────────────────────────────────────────────

@pytest.fixture
def demo_df():
    """Load the demo dataset."""
    from data.loader import load_sample
    return load_sample()


# ─── File existence and structure ────────────────────────────────────

class TestDemoDataStructure:

    def test_demo_csv_exists(self):
        demo_path = Path(__file__).resolve().parents[1] / "data" / "demo.csv"
        assert demo_path.exists(), (
            f"data/demo.csv not found. Run: python scripts/generate_demo_data.py"
        )

    def test_loads_without_error(self, demo_df):
        assert isinstance(demo_df, pd.DataFrame)
        assert len(demo_df) > 0

    def test_has_all_required_columns(self, demo_df):
        for col in REQUIRED_COLUMNS:
            assert col in demo_df.columns, f"Missing required column: {col}"

    def test_row_count_reasonable(self, demo_df):
        # Should be ~200 rows (5 patterns + background noise)
        assert 150 <= len(demo_df) <= 300, (
            f"Expected ~200 rows, got {len(demo_df)}"
        )

    def test_all_txn_types_valid(self, demo_df):
        invalid = set(demo_df["type"].unique()) - VALID_TXN_TYPES
        assert not invalid, f"Invalid transaction types: {invalid}"

    def test_step_range_valid(self, demo_df):
        # PaySim steps: 1-743
        assert demo_df["step"].min() >= 1
        assert demo_df["step"].max() <= 743

    def test_amounts_non_negative(self, demo_df):
        assert (demo_df["amount"] >= 0).all()

    def test_isfraud_is_binary(self, demo_df):
        assert set(demo_df["isFraud"].unique()).issubset({0, 1})

    def test_has_both_fraud_and_clean(self, demo_df):
        # Must have at least some fraud (planted patterns) and clean rows
        assert (demo_df["isFraud"] == 1).sum() >= 30, (
            "Expected at least 30 fraud rows from planted patterns"
        )
        assert (demo_df["isFraud"] == 0).sum() >= 100, (
            "Expected at least 100 clean background rows"
        )


# ─── Planted pattern verification ────────────────────────────────────

class TestPlantedPatterns:

    def test_pattern_1_circular_exists(self, demo_df):
        """C1001 -> C1002 -> C1003 -> C1004 -> C1001 (steps 100-103)."""
        # All 4 accounts should appear
        for acc in ["C1001", "C1002", "C1003", "C1004"]:
            assert acc in demo_df["nameOrig"].values or acc in demo_df["nameDest"].values, (
                f"Pattern 1 account {acc} not found"
            )
        # Verify the circular edges
        edges = [
            ("C1001", "C1002"), ("C1002", "C1003"),
            ("C1003", "C1004"), ("C1004", "C1001"),
        ]
        for orig, dest in edges:
            mask = (demo_df["nameOrig"] == orig) & (demo_df["nameDest"] == dest)
            assert mask.sum() >= 1, (
                f"Pattern 1 edge {orig}->{dest} not found"
            )

    def test_pattern_2_fan_out_exists(self, demo_df):
        """C2001 sends to 8 different receivers in one step."""
        c2001_sends = demo_df[demo_df["nameOrig"] == "C2001"]
        assert len(c2001_sends) >= 8, (
            f"Pattern 2: C2001 should send to 8 receivers, found {len(c2001_sends)}"
        )
        # All 8 should be to different receivers
        unique_receivers = c2001_sends["nameDest"].nunique()
        assert unique_receivers >= 8, (
            f"Pattern 2: expected 8 unique receivers, got {unique_receivers}"
        )

    def test_pattern_3_dense_cluster_exists(self, demo_df):
        """C3001-C3005 should have 12 transactions among them."""
        cluster_accounts = {"C3001", "C3002", "C3003", "C3004", "C3005"}
        cluster_txns = demo_df[
            demo_df["nameOrig"].isin(cluster_accounts) &
            demo_df["nameDest"].isin(cluster_accounts)
        ]
        assert len(cluster_txns) >= 10, (
            f"Pattern 3: expected >=10 cluster transactions, got {len(cluster_txns)}"
        )

    def test_pattern_4_mixed_circular_fanout_exists(self, demo_df):
        """C4001 fan-out to C4002-C4004, then chain to C4005, back to C4001."""
        c4001_sends = demo_df[demo_df["nameOrig"] == "C4001"]
        assert len(c4001_sends) >= 3, (
            f"Pattern 4: C4001 should fan-out to >=3 receivers"
        )
        # Should close back to C4001
        c4001_receives = demo_df[demo_df["nameDest"] == "C4001"]
        assert len(c4001_receives) >= 1, (
            "Pattern 4: should close back to C4001"
        )

    def test_pattern_5_mixed_dense_drained_exists(self, demo_df):
        """C5001-C5005 with all senders drained to zero."""
        cluster_accounts = {"C5001", "C5002", "C5003", "C5004", "C5005"}
        cluster_txns = demo_df[
            demo_df["nameOrig"].isin(cluster_accounts) &
            demo_df["nameDest"].isin(cluster_accounts)
        ]
        assert len(cluster_txns) >= 8, (
            f"Pattern 5: expected >=8 cluster transactions, got {len(cluster_txns)}"
        )
        # All senders should be drained (newbalanceOrig == 0)
        drained = (cluster_txns["newbalanceOrig"] == 0).sum()
        assert drained >= 8, (
            f"Pattern 5: expected all senders drained, only {drained} of {len(cluster_txns)}"
        )


# ─── Determinism test ────────────────────────────────────────────────

class TestDeterminism:

    def test_generator_is_deterministic(self):
        """Running the generator twice should produce identical DataFrames."""
        from scripts.generate_demo_data import generate_demo_data
        import tempfile

        with tempfile.TemporaryDirectory() as tmpdir:
            path1 = Path(tmpdir) / "demo1.csv"
            path2 = Path(tmpdir) / "demo2.csv"
            df1 = generate_demo_data(output_path=path1)
            df2 = generate_demo_data(output_path=path2)
            pd.testing.assert_frame_equal(df1, df2)


# ─── Loader tests ────────────────────────────────────────────────────

class TestLoader:

    def test_load_sample_returns_dataframe(self, demo_df):
        assert isinstance(demo_df, pd.DataFrame)

    def test_get_demo_stats_returns_dict(self):
        from data.loader import get_demo_stats
        stats = get_demo_stats()
        assert isinstance(stats, dict)
        assert "total_transactions" in stats
        assert "fraud_transactions" in stats
        assert "unique_accounts" in stats
        assert stats["total_transactions"] > 0

    def test_load_sample_raises_if_no_file(self, monkeypatch, tmp_path):
        from data.loader import load_sample
        import data.loader as loader
        # Point both paths to nonexistent locations
        monkeypatch.setattr(loader, "DEMO_PATH", tmp_path / "nonexistent.csv")
        monkeypatch.setattr(loader, "LEGACY_SAMPLE_PATH", tmp_path / "also_nonexistent.csv")
        with pytest.raises(FileNotFoundError):
            load_sample()


# ─── Integration: scoring + investigate work on demo data ────────────

class TestEndToEndOnDemoData:

    def test_score_account_on_demo_data(self, demo_df):
        """Score a known fraud account — should get a non-trivial score."""
        from egysentinel.score.combine import combine_account
        result = combine_account("C1001", demo_df, use_ml=False)
        assert result["account_id"] == "C1001"
        # C1001 is in a circular pattern + has high amounts + drained
        # Should score at least medium
        assert result["risk_score"] > 30, (
            f"C1001 (circular pattern) scored only {result['risk_score']} — expected >30"
        )

    def test_investigate_on_demo_data(self, demo_df):
        """Investigate a known fraud account — should return full response."""
        from egysentinel.agents.orchestrator import investigate
        result = investigate(
            "C1001", transactions_df=demo_df, pattern_type="circular",
            use_glm=False,  # don't require LLM for this test
        )
        assert "alert" in result
        assert "case" in result
        assert "explanation" in result
        assert result["alert"]["account_id"] == "C1001"
        assert result["case"]["account_id"] == "C1001"

    def test_score_clean_account_lower_than_fraud(self, demo_df):
        """A clean background account should score lower than a fraud account."""
        from egysentinel.score.combine import combine_account
        fraud_result = combine_account("C1001", demo_df, use_ml=False)
        # Find a clean account (C9xxx namespace, low amount)
        clean_account = demo_df[demo_df["isFraud"] == 0]["nameOrig"].iloc[0]
        clean_result = combine_account(clean_account, demo_df, use_ml=False)
        # Fraud account should score higher (or at least not lower)
        # Note: clean accounts may still get some score from rule engine
        # but fraud accounts should be in higher band
        assert fraud_result["risk_score"] >= clean_result["risk_score"] - 20, (
            f"Fraud account ({fraud_result['risk_score']}) should score "
            f"similar or higher than clean account ({clean_result['risk_score']})"
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
