"""
End-to-end integration test — the real pipeline with zero manual injection.

This test verifies that the full pipeline works as one connected system:
    raw CSV → detect_all → patterns cache → combine_account → build_case → generate_explanation

No stubs, no manual pattern_type injection, no hand-fed scores.
This is the test a buyer's technical diligence team would run.
"""
import sys
from pathlib import Path

import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from data.loader import load_sample, _ensure_patterns_cache, clear_patterns_cache
from egysentinel.graph.build import build_digraph
from egysentinel.detect import detect_all, get_flagged_accounts
from egysentinel.score.combine import combine_account
from egysentinel.agents.orchestrator import investigate
from egysentinel.agents.case_builder_agent import _case_id_cache


@pytest.fixture(autouse=True)
def clear_caches():
    """Clear all caches before and after each test for isolation."""
    clear_patterns_cache()
    _case_id_cache.clear()
    yield
    clear_patterns_cache()
    _case_id_cache.clear()


class TestEndToEndPipeline:
    """The real pipeline, end to end, no stubs."""

    def test_full_pipeline_c1001(self):
        """C1001 is in a circular pattern. The pipeline should:
        1. Detect the circular pattern
        2. Score the account using the real rule + ML hybrid
        3. Build a case with the correct pattern_type
        4. Generate an explanation with citations
        5. Produce a deterministic case ID
        """
        df = load_sample()

        # Step 1: Detection
        G = build_digraph(df)
        patterns = detect_all(G)
        patterns_by_account = _ensure_patterns_cache(df)

        c1001_patterns = patterns_by_account.get("C1001", [])
        assert len(c1001_patterns) > 0, "C1001 should have detected patterns"
        c1001_detectors = {p["detector"] for p in c1001_patterns}
        assert "circular" in c1001_detectors, f"C1001 should be in a circular pattern, got {c1001_detectors}"

        # Step 2: Scoring — /score endpoint
        score_result = combine_account("C1001", df, use_ml=True)
        assert score_result["risk_score"] > 0, "C1001 should have a non-zero risk score"
        assert score_result["risk_band"] in {"low", "medium", "high"}

        # Step 3: Investigation — /investigate endpoint (no manual injection)
        result = investigate("C1001", transactions_df=df, use_glm=False)

        # Step 4: Verify the investigation matches the score
        assert result["alert"]["risk_score"] == score_result["risk_score"], (
            f"/investigate score ({result['alert']['risk_score']}) should match "
            f"/score ({score_result['risk_score']})"
        )
        assert result["alert"]["risk_band"] == score_result["risk_band"]

        # Step 5: Verify pattern_type came from real detection, not "none"
        assert result["alert"]["pattern_type"] != "none", (
            "Pattern type should be detected from the real pipeline, not 'none'"
        )
        assert result["case"]["pattern_type"] == result["alert"]["pattern_type"], (
            "Case pattern_type should match alert pattern_type"
        )

        # Step 6: Verify case structure
        case = result["case"]
        assert case["case_id"].startswith("CASE-")
        assert len(case["case_id"]) == 11  # CASE-XXXXXX
        assert len(case["timeline"]) > 0
        assert len(case["parties"]) > 0
        assert case["total_amount"] > 0
        assert len(case["narrative"]) > 50
        assert "sar_fields" in case

        # Step 7: Verify explanation
        explanation = result["explanation"]
        assert len(explanation["explanation_text"]) >= 100
        assert len(explanation["citations"]) >= 1
        assert 0.0 <= explanation["confidence"] <= 1.0

    def test_case_id_is_deterministic(self):
        """Investigating the same account twice should produce the same case ID."""
        df = load_sample()
        result1 = investigate("C1001", transactions_df=df, use_glm=False)
        result2 = investigate("C1001", transactions_df=df, use_glm=False)
        assert result1["case"]["case_id"] == result2["case"]["case_id"], (
            f"Case ID should be deterministic: {result1['case']['case_id']} vs {result2['case']['case_id']}"
        )

    def test_different_accounts_get_different_case_ids(self):
        """Different accounts should get different case IDs."""
        df = load_sample()
        result1 = investigate("C1001", transactions_df=df, use_glm=False)
        result2 = investigate("C2001", transactions_df=df, use_glm=False)
        assert result1["case"]["case_id"] != result2["case"]["case_id"]

    def test_score_and_investigate_agree_on_all_flagged_accounts(self):
        """For every flagged account, /score and /investigate must agree."""
        df = load_sample()
        G = build_digraph(df)
        patterns = detect_all(G)
        flagged = list(get_flagged_accounts(patterns))[:5]  # test first 5 for speed

        mismatches = []
        for account_id in flagged:
            score_result = combine_account(account_id, df, use_ml=False)
            inv_result = investigate(account_id, transactions_df=df, use_glm=False)

            if score_result["risk_score"] != inv_result["alert"]["risk_score"]:
                mismatches.append(
                    f"{account_id}: /score={score_result['risk_score']} vs "
                    f"/investigate={inv_result['alert']['risk_score']}"
                )

        assert len(mismatches) == 0, (
            f"Score mismatches between /score and /investigate:\n" + "\n".join(mismatches)
        )

    def test_pattern_detection_reaches_case_report(self):
        """The pattern detected by DS-2 should appear in the case report."""
        df = load_sample()
        patterns_by_account = _ensure_patterns_cache(df)

        # Test a few accounts that should have patterns
        test_accounts = ["C1001", "C2001", "C3001"]
        for account_id in test_accounts:
            account_patterns = patterns_by_account.get(account_id, [])
            if not account_patterns:
                continue  # skip if no pattern detected

            result = investigate(account_id, transactions_df=df, use_glm=False)
            detected_pattern = result["case"]["pattern_type"]

            # The case's pattern_type should be one of the detected patterns
            detected_detectors = {p["detector"] for p in account_patterns}
            assert detected_pattern in detected_detectors, (
                f"{account_id}: case pattern_type '{detected_pattern}' not in "
                f"detected patterns {detected_detectors}"
            )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
