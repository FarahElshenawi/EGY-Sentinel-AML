

# AI-4 — Explanation Agent

> Plain-English justification for AML-flagged accounts
> Part of EGY-Sentinel AML — 10-day capstone sprint

---

## What Does This Agent Do?

Takes a **Case Report** (from AI-3) and an **Alert** (from AI-2),
then generates a **simple English explanation** of why the account
is suspicious — understandable by any compliance officer.

### Pipeline Position

DS (Data Science) → Alert (AI-2) → Case Builder (AI-3) → Explanation (AI-4) ← HERE

text


---

## Files Owned

| File | Purpose | Status |
|------|---------|--------|
| `egysentinel/agents/explanation_agent.py` | Core agent logic + fallback | Done |
| `egysentinel/agents/prompts/explanation.txt` | System prompt for GLM | Done |
| `tests/test_explanation_agent.py` | 16 unit tests (all passing) | Done |
| `reports/figures/class_imbalance.png` | PaySim class distribution chart | Done |
| `docs/explanation_agent.md` | Agent documentation (this file) | Done |
| `docs/explanation_contract.md` | Input/Output contract specification | Done |

---

## Interface

### Input

```python
from egysentinel.agents.explanation_agent import generate_explanation

result = generate_explanation(
    case_report=case_report_dict,
    alert=alert_dict,
    llm_client=client
)
Output (matches schemas/explanation.json)

json

{
  "case_id": "CASE-000001",
  "explanation_text": "Account C1234567 exhibits a circular transaction pattern...",
  "citations": [
    {"type": "pattern", "value": "Circular transaction C1234567→C9876543"},
    {"type": "score", "value": "Risk score: 88/100"},
    {"type": "transaction", "value": "Total amount: $800,000.00"}
  ],
  "confidence": 0.92,
  "generated_at": "2025-01-15T10:30:00Z"
}
Required: llm_client Interface

python

class LLMClient:
    def complete(self, system_prompt: str, user_prompt: str) -> str:
        pass
 Same interface used by AI-2 (Alert Agent).

Fallback Strategy

If the LLM fails, the agent automatically falls back to a rule-based template using real data from the alert and case report.

FAILURE SCENARIO
BEHAVIOR
Invalid JSON from LLM	Fallback
Missing required fields	Fallback
Empty citations	Fallback
Confidence out of 0-1 range	Fallback
No LLM client provided	Fallback
LLM timeout (>5s)	Warning + use response
 
Tests

bash

python -m pytest tests/test_explanation_agent.py -v
CATEGORY
TESTS
WHAT IT VALIDATES
Fallback (no LLM)	10	Required fields, text length, citations, confidence
LLM (mocked)	6	Success path, markdown stripping, error handling
 
Result: 16/16 passing

Dependencies on Other Team Members

FROM
WHAT
IMPACT
AI-1	Real GLM client	None — same interface
AI-3	Case Report JSON	None — schema is locked
AI-2	Alert JSON	None — schema is locked
DS Team	Risk scores and patterns	None — consumed as data
 
This agent is fully independent and ready for integration.