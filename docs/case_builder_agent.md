# AI-3 · Case Builder Agent — README

## Overview

AI-3 is the second agent in the EGY-Sentinel AML pipeline. It receives a high-risk account alert from AI-2 and produces a structured SAR-style (Suspicious Activity Report) investigation case report, which is then passed to AI-4 for plain-English explanation.

---

## Files Owned by AI-3

| File | Description |
|------|-------------|
| `egysentinel/agents/case_builder_agent.py` | Main agent — stub + GLM production version |
| `egysentinel/agents/evidence.py` | Evidence assembly helper |
| `egysentinel/agents/pipeline.py` | Alert-to-case pipeline adapter (Day 5-6) |
| `egysentinel/agents/prompts/case_builder.txt` | GLM system prompt v2 |
| `schemas/case_report.json` | Output schema |
| `schemas/evidence.json` | Input schema |
| `tests/test_case_builder.py` | Unit tests (stub path) |
| `tests/test_glm_case_builder.py` | GLM integration tests |
| `tests/test_glm_patterns.py` | 5-pattern GLM tests + input validation |
| `tests/test_pipeline.py` | End-to-end pipeline tests |
| `docs/ai4_contract.md` | AI-3 → AI-4 interface contract |

---

## Pipeline Flow

DS-3 risk_output
+
AI-2 alert
+
DS-1 transactions_df (50K sample)
+
DS-2 patterns.csv
↓
assemble_evidence()        ← evidence.py
↓
build_case()               ← case_builder_agent.py
↓
case_report JSON           → AI-4


---

## Inputs

### From DS-3 (risk_output)
```json
{
  "account_id": "C111111111",
  "final_score": 92.0,
  "risk_band": "high",
  "pattern_type": "circular"
}
```

### From AI-2 (alert)
```json
{
  "priority": "high",
  "summary": "Suspicious circular pattern detected",
  "recommended_action": "escalate"
}
```

### From DS-1 (transactions_df)
DataFrame with columns: `step`, `nameOrig`, `nameDest`, `amount`, `type`

### From DS-2 (patterns.csv)
CSV with columns: `account_id`, `pattern_type`, `description`, `confidence`

---

## Output

```json
{
  "case_id": "CASE-000001",
  "account_id": "C111111111",
  "alert_id": "ALERT-C111111111",
  "timeline": [
    {
      "step": 1,
      "event": "TRANSFER of 500000.00 EGP to C222222222",
      "account_id": "C222222222",
      "amount": 500000.0
    }
  ],
  "parties": [
    { "account_id": "C111111111", "role": "subject", "total_amount": 1000000.0 },
    { "account_id": "C222222222", "role": "intermediary", "total_amount": 1000000.0 }
  ],
  "total_amount": 500000.0,
  "pattern_type": "circular",
  "narrative": "Account C111111111 was flagged...",
  "sar_fields": {
    "filing_reason": "Suspected circular transfer...",
    "suspicious_activity_type": "circular_transfer",
    "reporting_institution": "EGY-Sentinel Financial Intelligence Unit",
    "subject_info": "Account C111111111 — pending full identification"
  },
  "generated_at": "2025-07-01T13:00:00+00:00"
}
```

---

## Pattern → SAR Type Mapping

| pattern_type | suspicious_activity_type |
|-------------|--------------------------|
| `circular` | `circular_transfer` |
| `fan_out` | `structuring` |
| `fan_in` | `funneling` |
| `layering` | `layering` |
| `dense_cluster` | `coordinated_activity` |

---

## Quick Start

```python
from egysentinel.agents.pipeline import process_alert_to_case
import pandas as pd

df = pd.read_csv("data/sample/paysim_30k.csv")

report = process_alert_to_case(
    risk_output={
        "account_id": "C111111111",
        "final_score": 92.0,
        "risk_band": "high",
        "pattern_type": "circular",
    },
    alert={
        "priority": "high",
        "summary": "Circular pattern detected",
        "recommended_action": "escalate",
    },
    transactions_df=df,
    patterns_csv="data/patterns.csv",
    use_glm=True,
)

print(report["case_id"])
print(report["narrative"])
```

### Testing (Stub — no GLM needed)
```bash
cd EGY-Sentinel-AML
python -m pytest tests/test_case_builder.py -v
```

### Testing (GLM)
```bash
python -m pytest tests/test_glm_patterns.py -v
```

---

## Guarantees to AI-4

1. All amounts in **EGP** — no $ signs
2. Timeline sorted chronologically by `step`
3. No hallucinated accounts — every account exists in source data
4. Party roles recalculated from actual transactions
5. `total_amount` = exact sum of timeline amounts
6. SAR `suspicious_activity_type` always matches `pattern_type`
7. Schema validates with 0 errors

---

## Fallback Behavior

If GLM fails, the agent automatically falls back to a deterministic stub:

```python
report = build_case(evidence, use_glm=False)  # stub only
report["_fallback"]  # True if stub was used
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `pandas` | ≥2.0 | Transaction DataFrame processing |
| `z-ai-web-dev-sdk` | latest | GLM API calls |

---

## Handoffs

| From | To | Artifact | Deadline |
|------|----|----------|----------|
| DS-2 | AI-3 | `patterns.csv` | Day 4 EOD |
| AI-2 | AI-3 | `alert JSON` | Day 5 EOD |
| AI-3 | AI-4 | `case_report JSON` | Day 6 noon |

---

## Contact

**Role:** AI-3 · Case Builder Agent  
**Interface contract:** `docs/ai4_contract.md`