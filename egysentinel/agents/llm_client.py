"""
EGY-Sentinel AML — LLM Client (AI-1)
=====================================

Real LLM client backed by OpenRouter's free-tier models.
OpenRouter provides an OpenAI-compatible HTTP API at:
    https://openrouter.ai/api/v1/chat/completions

Setup:
    1. Sign up at https://openrouter.ai (free)
    2. Generate an API key at https://openrouter.ai/keys
    3. Set environment variable:
       export OPENROUTER_API_KEY="sk-or-v1-..."
    4. (Optional) Override the default model:
       export OPENROUTER_MODEL="meta-llama/llama-3.2-3b-instruct:free"

If no API key is set, the client raises on init — callers should
fall back to the rule-based fallbacks (which all 3 agents already do).

Interface (compatible with all 3 agents):
    .complete(system_prompt, user_prompt) -> str
    .generate(system_prompt, user_message, timeout=60) -> str

Both methods return the raw text response from the model.

Free model options on OpenRouter (as of July 2026):
    qwen/qwen3-next-80b-a3b-instruct:free      (DEFAULT — MoE, fast + smart)
    meta-llama/llama-3.3-70b-instruct:free     (backup — large, high quality)
    meta-llama/llama-3.2-3b-instruct:free      (small, very fast, lower quality)
    google/gemini-flash-1.5:free               (very fast, good quality)
    mistralai/mistral-7b-instruct:free         (solid all-rounder)

Caching:
    In-memory dict cache keyed on (model, system_prompt, user_prompt).
    Same prompt -> same response, no API call. Cache is process-local.

Timeout:
    Default 10s. Configurable via timeout parameter or
    OPENROUTER_TIMEOUT env var.
"""
from __future__ import annotations

import hashlib
import json
import logging
import os
import time
from typing import Any, Optional

logger = logging.getLogger(__name__)


# ─── Constants ───────────────────────────────────────────────────────

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = os.environ.get(
    "OPENROUTER_MODEL",
    "nousresearch/hermes-3-llama-3.1-405b:free",
)
DEFAULT_TIMEOUT = float(os.environ.get("OPENROUTER_TIMEOUT", "10"))
DEFAULT_TEMPERATURE = 0.3  # low temp for deterministic structured output
DEFAULT_MAX_TOKENS = 800   # enough for any agent's JSON output


# ─── LLM Client ──────────────────────────────────────────────────────

class LLMClient:
    """OpenRouter-backed LLM client.

    Usage:
        client = LLMClient()  # uses OPENROUTER_API_KEY env var
        response = client.complete(system_prompt="...", user_prompt="...")

    Raises:
        RuntimeError: If no API key is set or the API call fails.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        timeout: float = DEFAULT_TIMEOUT,
        temperature: float = DEFAULT_TEMPERATURE,
        max_tokens: int = DEFAULT_MAX_TOKENS,
    ):
        self.api_key = api_key or os.environ.get("OPENROUTER_API_KEY")
        self.model = model or DEFAULT_MODEL
        self.timeout = timeout
        self.temperature = temperature
        self.max_tokens = max_tokens
        self._cache: dict[str, str] = {}

        if not self.api_key:
            raise RuntimeError(
                "No OpenRouter API key. Set OPENROUTER_API_KEY env var "
                "or pass api_key=... to LLMClient(). Sign up at "
                "https://openrouter.ai to get a free key."
            )

        logger.info(
            f"LLMClient initialized | model={self.model} | "
            f"timeout={self.timeout}s | temp={self.temperature}"
        )

    # ─── Cache helper ────────────────────────────────────────────────

    def _cache_key(self, system_prompt: str, user_prompt: str) -> str:
        """Generate a deterministic cache key from prompts."""
        h = hashlib.sha256()
        h.update(self.model.encode())
        h.update(b"\x00")
        h.update(system_prompt.encode())
        h.update(b"\x00")
        h.update(user_prompt.encode())
        return h.hexdigest()

    # ─── Public API (two method names for compatibility) ────────────

    def complete(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        """Call the LLM with system + user prompts. Returns raw text.

        Used by AI-2 (alert_agent) and AI-4 (explanation_agent).

        Raises:
            RuntimeError: On API failure, timeout, or empty response.
        """
        return self._call(system_prompt, user_prompt)

    def generate(
        self,
        system_prompt: str,
        user_message: str,
        timeout: int = 60,
    ) -> str:
        """Call the LLM. Alias for .complete() with custom timeout.

        Used by AI-3 (case_builder_agent). Maintained for interface
        compatibility — AI-3's code calls .generate() with a timeout.
        """
        original_timeout = self.timeout
        self.timeout = float(timeout)
        try:
            return self._call(system_prompt, user_message)
        finally:
            self.timeout = original_timeout

    # ─── Internal call ──────────────────────────────────────────────

    def _call(self, system_prompt: str, user_prompt: str) -> str:
        """Make the actual HTTP call to OpenRouter."""
        # Check cache first
        cache_key = self._cache_key(system_prompt, user_prompt)
        if cache_key in self._cache:
            logger.debug(f"Cache hit for prompt hash {cache_key[:8]}")
            return self._cache[cache_key]

        # Build request payload (OpenAI-compatible)
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            # OpenRouter recommends these for ranking/attributing usage
            "HTTP-Referer": "https://egy-sentinel-aml.local",
            "X-Title": "EGY-Sentinel AML",
        }

        start = time.time()
        try:
            import requests
        except ImportError as e:
            raise RuntimeError(
                "requests library not installed. Run: pip install requests"
            ) from e

        logger.info(
            f"Calling OpenRouter | model={self.model} | "
            f"prompt_len={len(user_prompt)} chars"
        )

        try:
            response = requests.post(
                OPENROUTER_API_URL,
                headers=headers,
                json=payload,
                timeout=self.timeout,
            )
            elapsed = time.time() - start
        except requests.exceptions.Timeout:
            raise RuntimeError(
                f"OpenRouter call timed out after {self.timeout}s. "
                f"Set OPENROUTER_TIMEOUT to increase."
            )
        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"OpenRouter request failed: {e}")

        if response.status_code != 200:
            # Try to extract error message
            try:
                err_body = response.json()
                err_msg = err_body.get("error", {}).get("message", response.text[:200])
            except Exception:
                err_msg = response.text[:200]
            raise RuntimeError(
                f"OpenRouter API error {response.status_code}: {err_msg}"
            )

        try:
            data = response.json()
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, ValueError) as e:
            raise RuntimeError(
                f"Failed to parse OpenRouter response: {e}. "
                f"Raw: {response.text[:300]}"
            )

        if not content or not content.strip():
            raise RuntimeError("OpenRouter returned empty response")

        content = content.strip()
        logger.info(
            f"OpenRouter call OK | {elapsed:.2f}s | "
            f"response_len={len(content)} chars"
        )

        # Cache the result
        self._cache[cache_key] = content
        return content


# ─── Convenience factory ─────────────────────────────────────────────

def get_llm_client(allow_no_key: bool = False) -> Optional[LLMClient]:
    """Get an LLMClient instance, or None if no API key is available.

    Args:
        allow_no_key: If True, returns None instead of raising when no
                      API key is set. Agents use this to gracefully fall
                      back to rule-based mode.

    Returns:
        LLMClient instance, or None if no API key and allow_no_key=True.
    """
    try:
        return LLMClient()
    except RuntimeError as e:
        if allow_no_key:
            logger.info(
                f"LLM client unavailable ({e}). "
                f"Agents will use rule-based fallbacks."
            )
            return None
        raise


# ─── Stub client (kept for backwards compatibility) ──────────────────

class StubLLMClient:
    """Stub client that returns canned JSON. Used in tests.

    Returns a minimal alert-shaped JSON that satisfies all 3 agents'
    parsers when they expect LLM-style output. In production, use
    LLMClient (above) instead.
    """

    def __init__(self):
        logger.warning("Using StubLLMClient — no real LLM calls will be made")

    def complete(self, system_prompt: str, user_prompt: str) -> str:
        return self._canned_response(user_prompt)

    def generate(self, system_prompt: str, user_message: str, timeout: int = 60) -> str:
        return self._canned_response(user_message)

    def _canned_response(self, user_prompt: str) -> str:
        """Return a minimal valid response based on prompt content."""
        # Detect which agent is calling based on prompt content
        if "explanation" in user_prompt.lower() or "case_id" in user_prompt.lower():
            # Explanation agent
            return json.dumps({
                "case_id": "CASE-000001",
                "explanation_text": (
                    "Account flagged with high risk based on detected transaction "
                    "patterns. The combination of unusual transaction amounts, "
                    "suspicious pattern signatures, and risk score threshold "
                    "crossing indicates probable money laundering activity. "
                    "Immediate compliance review recommended."
                ),
                "citations": [
                    {"type": "score", "value": "Risk score above high threshold"},
                    {"type": "pattern", "value": "Suspicious pattern detected"},
                ],
                "confidence": 0.85,
                "generated_at": "2026-01-01T00:00:00Z",
            })
        elif "priority" in user_prompt.lower() or "alert" in user_prompt.lower():
            # Alert agent
            return json.dumps({
                "priority": "high",
                "summary": "[STUB] High-risk account flagged by automated surveillance.",
                "recommended_action": "investigate",
            })
        else:
            # Case builder or unknown
            return json.dumps({
                "case_id": "CASE-000001",
                "narrative": "[STUB] Case narrative generated by stub client.",
                "sar_fields": {
                    "filing_reason": "Suspected suspicious activity",
                    "suspicious_activity_type": "unusual_activity",
                },
            })
