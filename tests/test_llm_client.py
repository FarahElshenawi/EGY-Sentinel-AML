"""Tests for AI-1 LLM Client (OpenRouter integration).

All tests are mocked — no real HTTP calls are made.
"""
import json
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from egysentinel.agents.llm_client import (
    LLMClient,
    StubLLMClient,
    get_llm_client,
    OPENROUTER_API_URL,
    DEFAULT_MODEL,
)


# ─── LLMClient init tests ───────────────────────────────────────────

class TestLLMClientInit:

    def test_init_with_api_key(self, monkeypatch):
        monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
        client = LLMClient(api_key="sk-or-v1-test-key")
        assert client.api_key == "sk-or-v1-test-key"
        assert client.model == DEFAULT_MODEL

    def test_init_with_env_var(self, monkeypatch):
        monkeypatch.setenv("OPENROUTER_API_KEY", "sk-or-v1-env-key")
        client = LLMClient()
        assert client.api_key == "sk-or-v1-env-key"

    def test_init_raises_without_api_key(self, monkeypatch):
        monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
        with pytest.raises(RuntimeError, match="No OpenRouter API key"):
            LLMClient()

    def test_init_with_custom_model(self, monkeypatch):
        monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
        client = LLMClient(
            api_key="test-key",
            model="google/gemini-flash-1.5:free",
        )
        assert client.model == "google/gemini-flash-1.5:free"

    def test_init_with_env_model(self, monkeypatch):
        monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
        # DEFAULT_MODEL is read at module import, so we test that LLMClient
        # accepts a custom model via the model= parameter (the env var path
        # is exercised by reimporting, which is brittle in tests).
        client = LLMClient(model="qwen/qwen-2.5-7b-instruct:free")
        assert client.model == "qwen/qwen-2.5-7b-instruct:free"


# ─── get_llm_client factory tests ───────────────────────────────────

class TestGetLLMClient:

    def test_returns_client_when_key_available(self, monkeypatch):
        monkeypatch.setenv("OPENROUTER_API_KEY", "sk-or-v1-test")
        client = get_llm_client()
        assert client is not None
        assert isinstance(client, LLMClient)

    def test_returns_none_when_no_key_and_allow_no_key(self, monkeypatch):
        monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
        client = get_llm_client(allow_no_key=True)
        assert client is None

    def test_raises_when_no_key_and_not_allowed(self, monkeypatch):
        monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
        with pytest.raises(RuntimeError):
            get_llm_client(allow_no_key=False)


# ─── LLMClient call tests (mocked HTTP) ─────────────────────────────

class TestLLMClientCalls:

    @pytest.fixture
    def client(self, monkeypatch):
        monkeypatch.setenv("OPENROUTER_API_KEY", "sk-or-v1-test")
        return LLMClient()

    def _mock_response(self, content: str):
        """Build a mock requests.Response with the given content."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "choices": [{"message": {"content": content}}]
        }
        return mock_resp

    def test_complete_returns_content(self, client):
        with patch("requests.post", return_value=self._mock_response("Hello world")):
            result = client.complete("system prompt", "user prompt")
            assert result == "Hello world"

    def test_generate_returns_content(self, client):
        with patch("requests.post", return_value=self._mock_response("Generated text")):
            result = client.generate("system", "user", timeout=30)
            assert result == "Generated text"

    def test_complete_caches_repeated_calls(self, client):
        """Same prompt should only make 1 HTTP call."""
        with patch("requests.post", return_value=self._mock_response("cached")) as mock_post:
            r1 = client.complete("sys", "usr")
            r2 = client.complete("sys", "usr")
            assert r1 == r2 == "cached"
            assert mock_post.call_count == 1  # second call hit cache

    def test_complete_different_prompts_not_cached(self, client):
        with patch("requests.post", return_value=self._mock_response("response")) as mock_post:
            _ = client.complete("sys", "usr1")
            _ = client.complete("sys", "usr2")
            assert mock_post.call_count == 2

    def test_complete_raises_on_http_error(self, client):
        mock_resp = MagicMock()
        mock_resp.status_code = 401
        mock_resp.json.return_value = {"error": {"message": "Invalid API key"}}
        with patch("requests.post", return_value=mock_resp):
            with pytest.raises(RuntimeError, match="401"):
                client.complete("sys", "usr")

    def test_complete_raises_on_empty_response(self, client):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "choices": [{"message": {"content": ""}}]
        }
        with patch("requests.post", return_value=mock_resp):
            with pytest.raises(RuntimeError, match="empty response"):
                client.complete("sys", "usr")

    def test_complete_raises_on_timeout(self, client):
        import requests
        with patch("requests.post", side_effect=requests.exceptions.Timeout()):
            with pytest.raises(RuntimeError, match="timed out"):
                client.complete("sys", "usr")

    def test_complete_raises_on_request_error(self, client):
        import requests
        with patch("requests.post", side_effect=requests.exceptions.ConnectionError("no network")):
            with pytest.raises(RuntimeError, match="request failed"):
                client.complete("sys", "usr")

    def test_complete_raises_on_malformed_json(self, client):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"no_choices_key": True}
        with patch("requests.post", return_value=mock_resp):
            with pytest.raises(RuntimeError, match="Failed to parse"):
                client.complete("sys", "usr")

    def test_complete_strips_whitespace(self, client):
        with patch("requests.post", return_value=self._mock_response("  trimmed  \n")):
            result = client.complete("sys", "usr")
            assert result == "trimmed"


# ─── StubLLMClient tests ────────────────────────────────────────────

class TestStubLLMClient:

    def test_stub_returns_valid_json(self):
        client = StubLLMClient()
        result = client.complete("sys", "user prompt with alert keyword")
        # Should be valid JSON
        parsed = json.loads(result)
        assert isinstance(parsed, dict)

    def test_stub_complete_and_generate_consistent(self):
        client = StubLLMClient()
        r1 = client.complete("sys", "alert prompt")
        r2 = client.generate("sys", "alert prompt", timeout=5)
        assert r1 == r2

    def test_stub_alert_response_has_priority(self):
        client = StubLLMClient()
        result = client.complete("sys", "alert: analyze this account")
        parsed = json.loads(result)
        assert "priority" in parsed
        assert "summary" in parsed
        assert "recommended_action" in parsed

    def test_stub_explanation_response_has_required_fields(self):
        client = StubLLMClient()
        result = client.complete("sys", "case_id: CASE-000001, generate explanation")
        parsed = json.loads(result)
        assert "case_id" in parsed
        assert "explanation_text" in parsed
        assert "citations" in parsed
        assert "confidence" in parsed


# ─── Integration: orchestrator with LLM client ──────────────────────

class TestOrchestratorWithLLM:
    """Verify the orchestrator correctly uses the LLM client when available."""

    def test_investigate_uses_llm_when_client_provided(self, monkeypatch):
        """When a real LLM client is provided, the orchestrator should use it."""
        import pandas as pd
        from egysentinel.agents.orchestrator import investigate

        # Build a mock client that returns valid alert JSON
        mock_client = MagicMock()
        mock_client.complete.return_value = json.dumps({
            "priority": "critical",
            "summary": "[LLM] Critical risk detected via OpenRouter",
            "recommended_action": "freeze",
        })

        df = pd.DataFrame([
            {"step": 10, "type": "TRANSFER", "amount": 500000.0,
             "nameOrig": "C111", "nameDest": "C222",
             "oldbalanceOrg": 500000, "newbalanceOrig": 0,
             "oldbalanceDest": 0, "newbalanceDest": 500000,
             "isFraud": 1, "isFlaggedFraud": 0},
        ])

        result = investigate(
            "C111", transactions_df=df, pattern_type="circular",
            llm_client=mock_client, use_glm=True,
        )
        # LLM client should have been called for the alert agent
        assert mock_client.complete.called or mock_client.generate.called
        # Alert should reflect the LLM response
        assert result["alert"]["priority"] == "critical"
        assert "OpenRouter" in result["alert"]["summary"] or "LLM" in result["alert"]["summary"]

    def test_investigate_falls_back_when_no_api_key(self, monkeypatch):
        """When no API key is set, orchestrator should fall back gracefully."""
        import pandas as pd
        from egysentinel.agents.orchestrator import investigate

        monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
        df = pd.DataFrame([
            {"step": 10, "type": "TRANSFER", "amount": 500000.0,
             "nameOrig": "C111", "nameDest": "C222",
             "oldbalanceOrg": 500000, "newbalanceOrig": 0,
             "oldbalanceDest": 0, "newbalanceDest": 500000,
             "isFraud": 1, "isFlaggedFraud": 0},
        ])

        # Should not raise — should fall back to rule-based
        result = investigate("C111", transactions_df=df, pattern_type="circular")
        assert "alert" in result
        assert "case" in result
        assert "explanation" in result


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
