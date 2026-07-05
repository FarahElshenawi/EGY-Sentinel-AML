"""Tests for AI-2 Alert Agent."""
import sys
sys.path.append(".")
from egysentinel.agents.alert_agent import generate_alert, get_alert_fallback

def test_low_priority():
    result = generate_alert(account_id="C_LOW", risk_score=15.0, risk_band="low", pattern_type="none")
    assert result["priority"] == "low"
    assert result["recommended_action"] == "monitor"

def test_high_priority():
    result = generate_alert(account_id="C_HIGH", risk_score=70.0, risk_band="high", pattern_type="fan_out")
    assert result["priority"] == "high"

def test_critical_priority():
    result = generate_alert(account_id="C_CRIT", risk_score=90.0, risk_band="high", pattern_type="circular")
    assert result["priority"] == "critical"
    assert result["recommended_action"] == "freeze"

def test_fallback():
    result = get_alert_fallback(account_id="C_FB", risk_score=85.0, pattern_type="circular")
    assert result["priority"] == "critical"
    assert "[RULE-BASED]" in result["summary"]

if __name__ == "__main__":
    tests = [test_low_priority, test_high_priority, test_critical_priority, test_fallback]
    passed = 0
    for t in tests:
        try: t(); passed += 1; print(f"✅ {t.__name__}")
        except Exception as e: print(f"❌ {t.__name__}: {e}")
    print(f"\n📊 {passed}/{len(tests)} passed")
