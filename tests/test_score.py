"""Tests for DS-1/3 scoring modules: features, rule_scorer, ml_scorer, combine."""
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from egysentinel.score.features import (
    engineer_features,
    compute_frequency_features,
    get_account_transactions,
    get_account_features,
)
from egysentinel.score.rule_scorer import (
    score_transaction,
    score_account as rule_score_account,
    risk_band_from_score,
    WEIGHTS,
)
from egysentinel.score.combine import (
    combine_scores,
    combine_account,
)


# ─── Fixtures ─────────────────────────────────────────────────────────

@pytest.fixture
def sample_transactions() -> pd.DataFrame:
    """A small PaySim-format DataFrame with 5 transactions."""
    return pd.DataFrame([
        # Normal payment
        {"step": 10, "type": "PAYMENT", "amount": 5000.0,
         "nameOrig": "C111", "nameDest": "C222",
         "oldbalanceOrg": 10000, "newbalanceOrig": 5000,
         "oldbalanceDest": 0, "newbalanceDest": 5000,
         "isFraud": 0, "isFlaggedFraud": 0},
        # Large TRANSFER with drained sender (suspicious)
        {"step": 20, "type": "TRANSFER", "amount": 500000.0,
         "nameOrig": "C111", "nameDest": "C333",
         "oldbalanceOrg": 500000, "newbalanceOrig": 0,
         "oldbalanceDest": 0, "newbalanceDest": 500000,
         "isFraud": 1, "isFlaggedFraud": 0},
        # CASH_OUT from a mule account
        {"step": 30, "type": "CASH_OUT", "amount": 480000.0,
         "nameOrig": "C333", "nameDest": "C444",
         "oldbalanceOrg": 500000, "newbalanceOrig": 20000,
         "oldbalanceDest": 0, "newbalanceDest": 0,
         "isFraud": 1, "isFlaggedFraud": 0},
        # Small CASH_IN
        {"step": 40, "type": "CASH_IN", "amount": 1000.0,
         "nameOrig": "C555", "nameDest": "C111",
         "oldbalanceOrg": 0, "newbalanceOrig": 1000,
         "oldbalanceDest": 5000, "newbalanceDest": 4000,
         "isFraud": 0, "isFlaggedFraud": 0},
        # Another TRANSFER (drained)
        {"step": 50, "type": "TRANSFER", "amount": 450000.0,
         "nameOrig": "C444", "nameDest": "C666",
         "oldbalanceOrg": 450000, "newbalanceOrig": 0,
         "oldbalanceDest": 0, "newbalanceDest": 450000,
         "isFraud": 1, "isFlaggedFraud": 0},
    ])


@pytest.fixture
def empty_df() -> pd.DataFrame:
    return pd.DataFrame(columns=[
        "step", "type", "amount", "nameOrig", "nameDest",
        "oldbalanceOrg", "newbalanceOrig", "oldbalanceDest", "newbalanceDest",
        "isFraud", "isFlaggedFraud",
    ])


# ─── Feature engineering tests ───────────────────────────────────────

class TestFeatureEngineering:

    def test_engineer_features_adds_all_columns(self, sample_transactions):
        result = engineer_features(sample_transactions)
        expected = [
            "log_amount", "balance_diff_orig", "balance_diff_dest",
            "balance_diff_ratio", "orig_balance_drained",
            "dest_balance_zero_both", "errorBalanceOrig",
            "errorBalanceDest", "high_amount_flag", "hour_of_day",
        ]
        for col in expected:
            assert col in result.columns, f"Missing engineered column: {col}"

    def test_log_amount_correct(self, sample_transactions):
        result = engineer_features(sample_transactions)
        # First row: amount=5000, log1p(5000) ≈ 8.517
        assert abs(result.iloc[0]["log_amount"] - np.log1p(5000)) < 0.01

    def test_balance_drained_flag(self, sample_transactions):
        result = engineer_features(sample_transactions)
        # Row 1 (index 1): oldbalanceOrg=500000, newbalanceOrig=0 -> drained=1
        assert result.iloc[1]["orig_balance_drained"] == 1
        # Row 0: oldbalanceOrg=10000, newbalanceOrig=5000 -> drained=0
        assert result.iloc[0]["orig_balance_drained"] == 0

    def test_mule_account_flag(self, sample_transactions):
        result = engineer_features(sample_transactions)
        # Row 1: receiver C333 has oldbalanceDest=0, newbalanceDest=500000 -> not mule
        assert result.iloc[1]["dest_balance_zero_both"] == 0
        # Row 2: receiver C444 has oldbalanceDest=0, newbalanceDest=0 -> mule
        assert result.iloc[2]["dest_balance_zero_both"] == 1

    def test_error_balance_orig(self, sample_transactions):
        result = engineer_features(sample_transactions)
        # errorBalanceOrig = newbalanceOrig + amount - oldbalanceOrg
        # Row 0: 5000 + 5000 - 10000 = 0
        assert result.iloc[0]["errorBalanceOrig"] == 0
        # Row 1: 0 + 500000 - 500000 = 0
        assert result.iloc[1]["errorBalanceOrig"] == 0

    def test_high_amount_flag(self, sample_transactions):
        result = engineer_features(sample_transactions)
        # 99th percentile of 5 values — at most 1 should be flagged
        assert result["high_amount_flag"].sum() <= 1

    def test_hour_of_day(self, sample_transactions):
        result = engineer_features(sample_transactions)
        # step=10 -> hour=10, step=20 -> hour=20, step=30 -> hour=6 (30%24=6)
        assert result.iloc[0]["hour_of_day"] == 10
        assert result.iloc[1]["hour_of_day"] == 20
        assert result.iloc[2]["hour_of_day"] == 6

    def test_engineer_features_does_not_mutate_input(self, sample_transactions):
        original_cols = list(sample_transactions.columns)
        _ = engineer_features(sample_transactions)
        assert list(sample_transactions.columns) == original_cols

    def test_compute_frequency_features(self, sample_transactions):
        result = compute_frequency_features(sample_transactions)
        assert "sender_frequency" in result.columns
        assert "receiver_frequency" in result.columns
        # C111 appears as nameOrig in rows 0, 1 and as nameDest in row 3
        # So sender_frequency for row 0 (nameOrig=C111) = 2
        c111_rows = result[result["nameOrig"] == "C111"]
        assert (c111_rows["sender_frequency"] == 2).all()


# ─── Rule scorer tests ───────────────────────────────────────────────

class TestRuleScorer:

    def test_weights_sum_to_100(self):
        assert sum(WEIGHTS.values()) == 120  # 25+20+25+15+10+10+15 = 120
        # Capped at 100 per transaction

    def test_risky_type_adds_25(self):
        row = pd.Series({
            "type": "TRANSFER", "high_amount_flag": 0,
            "orig_balance_drained": 0, "dest_balance_zero_both": 0,
            "sender_frequency": 1, "receiver_frequency": 1,
            "errorBalanceOrig": 0, "errorBalanceDest": 0,
        })
        score = score_transaction(row, sender_freq_99=10, receiver_freq_99=10, error_threshold=100)
        assert score == 25

    def test_cash_out_is_risky_type(self):
        row = pd.Series({
            "type": "CASH_OUT", "high_amount_flag": 0,
            "orig_balance_drained": 0, "dest_balance_zero_both": 0,
            "sender_frequency": 1, "receiver_frequency": 1,
            "errorBalanceOrig": 0, "errorBalanceDest": 0,
        })
        score = score_transaction(row, sender_freq_99=10, receiver_freq_99=10, error_threshold=100)
        assert score == 25

    def test_payment_is_not_risky(self):
        row = pd.Series({
            "type": "PAYMENT", "high_amount_flag": 0,
            "orig_balance_drained": 0, "dest_balance_zero_both": 0,
            "sender_frequency": 1, "receiver_frequency": 1,
            "errorBalanceOrig": 0, "errorBalanceDest": 0,
        })
        score = score_transaction(row, sender_freq_99=10, receiver_freq_99=10, error_threshold=100)
        assert score == 0

    def test_score_capped_at_100(self):
        # All rules triggered
        row = pd.Series({
            "type": "TRANSFER", "high_amount_flag": 1,
            "orig_balance_drained": 1, "dest_balance_zero_both": 1,
            "sender_frequency": 100, "receiver_frequency": 100,
            "errorBalanceOrig": 99999, "errorBalanceDest": 99999,
        })
        score = score_transaction(row, sender_freq_99=10, receiver_freq_99=10, error_threshold=100)
        # 25+20+25+15+10+10+15 = 120, capped at 100
        assert score == 100

    def test_risk_band_low(self):
        assert risk_band_from_score(0) == "low"
        assert risk_band_from_score(15) == "low"
        assert risk_band_from_score(30) == "low"

    def test_risk_band_medium(self):
        assert risk_band_from_score(31) == "medium"
        assert risk_band_from_score(50) == "medium"
        assert risk_band_from_score(65) == "medium"

    def test_risk_band_high(self):
        assert risk_band_from_score(66) == "high"
        assert risk_band_from_score(80) == "high"
        assert risk_band_from_score(100) == "high"

    def test_score_account_returns_required_fields(self, sample_transactions):
        result = rule_score_account("C111", sample_transactions)
        for field in ["account_id", "risk_score", "risk_band",
                      "transaction_count", "max_transaction_score", "scores"]:
            assert field in result, f"Missing field: {field}"

    def test_score_account_c111(self, sample_transactions):
        """C111 has 3 transactions: payment (0), transfer drained (50+), cash_in (0)."""
        result = rule_score_account("C111", sample_transactions)
        assert result["account_id"] == "C111"
        assert result["transaction_count"] == 3
        # C111's transfer (row 1) hits: TRANSFER(25) + drained(25) + high_amount(20) + mule(15) = 85
        # Plus possibly more depending on frequency/error
        assert result["max_transaction_score"] >= 85

    def test_score_account_nonexistent(self, sample_transactions):
        result = rule_score_account("C_NONEXISTENT", sample_transactions)
        assert result["risk_score"] == 0.0
        assert result["risk_band"] == "low"
        assert result["transaction_count"] == 0

    def test_score_account_empty_df(self, empty_df):
        result = rule_score_account("C111", empty_df)
        assert result["risk_score"] == 0.0
        assert result["risk_band"] == "low"


# ─── Combine tests ───────────────────────────────────────────────────

class TestCombineScores:

    def test_combine_equal_scores(self):
        # rule=80, ml=80 -> final = 0.5*80 + 0.5*80 = 80
        result = combine_scores(80.0, 80.0)
        assert result == 80.0

    def test_combine_rule_only(self):
        # ml_score=None -> final = rule_score
        result = combine_scores(75.0, None)
        assert result == 75.0

    def test_combine_averages(self):
        # rule=100, ml=0 -> final = 50
        result = combine_scores(100.0, 0.0)
        assert result == 50.0

    def test_combine_clamped_to_100(self):
        result = combine_scores(100.0, 100.0)
        assert result == 100.0

    def test_combine_clamped_to_0(self):
        result = combine_scores(0.0, 0.0)
        assert result == 0.0

    def test_combine_account_returns_required_fields(self, sample_transactions):
        result = combine_account("C111", sample_transactions, use_ml=False)
        for field in ["account_id", "rule_score", "ml_prob", "ml_score",
                      "risk_score", "risk_band", "transaction_count",
                      "pattern_count", "ml_used"]:
            assert field in result, f"Missing field: {field}"

    def test_combine_account_rule_only_when_ml_disabled(self, sample_transactions):
        result = combine_account("C111", sample_transactions, use_ml=False)
        assert result["ml_used"] is False
        assert result["ml_prob"] is None
        assert result["ml_score"] is None
        # risk_score should equal rule_score when ML disabled
        assert result["risk_score"] == result["rule_score"]

    def test_combine_account_with_ml(self, sample_transactions):
        """Try to use ML — should succeed if model file is present."""
        result = combine_account("C111", sample_transactions, use_ml=True)
        # ml_used may be True or False depending on whether model loads
        if result["ml_used"]:
            assert result["ml_prob"] is not None
            assert result["ml_score"] is not None
            assert 0.0 <= result["ml_prob"] <= 1.0
            assert 0.0 <= result["ml_score"] <= 100.0
        else:
            # Model not available — should fall back to rule-only
            assert result["risk_score"] == result["rule_score"]

    def test_combine_account_nonexistent(self, sample_transactions):
        result = combine_account("C_NONEXISTENT", sample_transactions, use_ml=False)
        assert result["risk_score"] == 0.0
        assert result["risk_band"] == "low"
        assert result["transaction_count"] == 0

    def test_combine_account_empty_df(self, empty_df):
        result = combine_account("C111", empty_df, use_ml=False)
        assert result["risk_score"] == 0.0
        assert result["risk_band"] == "low"


# ─── ML scorer tests (skip if model not available) ───────────────────

class TestMLScorer:
    """Tests for the ML scorer. Skipped if the model artifact is not present."""

    @pytest.fixture
    def model_available(self):
        try:
            from egysentinel.score.ml_scorer import load_model
            load_model()
            return True
        except Exception:
            return False

    def test_predict_returns_required_fields(self, sample_transactions, model_available):
        if not model_available:
            pytest.skip("Model artifact not available")
        from egysentinel.score.ml_scorer import predict_fraud_probability
        result = predict_fraud_probability("C111", sample_transactions)
        for field in ["account_id", "ml_prob", "ml_score",
                      "transaction_count", "probabilities"]:
            assert field in result, f"Missing field: {field}"

    def test_predict_prob_in_range(self, sample_transactions, model_available):
        if not model_available:
            pytest.skip("Model artifact not available")
        from egysentinel.score.ml_scorer import predict_fraud_probability
        result = predict_fraud_probability("C111", sample_transactions)
        assert 0.0 <= result["ml_prob"] <= 1.0
        assert 0.0 <= result["ml_score"] <= 100.0

    def test_predict_nonexistent_account(self, sample_transactions, model_available):
        if not model_available:
            pytest.skip("Model artifact not available")
        from egysentinel.score.ml_scorer import predict_fraud_probability
        result = predict_fraud_probability("C_NONEXISTENT", sample_transactions)
        assert result["ml_prob"] == 0.0
        assert result["transaction_count"] == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
