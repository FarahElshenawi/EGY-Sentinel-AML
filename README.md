# Sentinel AML

**AI-Powered Financial Surveillance & Fraud Intelligence System**

> *See the money move before it disappears.*

Sentinel AML is an anti-money-laundering platform that combines graph-based intelligence, machine learning risk scoring, and large language models to detect financial crime that traditional rule-based systems miss — then hands your investigators a clear, evidence-backed case file the moment something looks wrong.

---

## What It Does

Sentinel watches every transaction moving through a bank, maps it as a directed graph, and flags the shapes that matter: money looping back to where it started, one account fanning out to dozens of others, tight clusters moving funds among themselves. When a pattern fires, the investigation pipeline builds the full case — an alert with priority, a SAR-style case report, and a plain-English explanation with citations — so your investigator gets the whole story in one click, not a dashboard to decode.

### The pipeline

```
Transactions (PaySim synthetic data — 206 rows, 5 planted patterns)
       |
       v
+--------------------------------------------------+
|  PATTERN DETECTION                                |
|  NetworkX DiGraph + 3 Detectors                   |
|  - Circular (DFS simple_cycles, len 3-6)          |
|  - Fan-out (out-degree >= 5 in 1-step window)     |
|  - Dense Cluster (Louvain, density >= 0.3)        |
+--------------------------+-----------------------+
                           v
+--------------------------------------------------+
|  RISK ASSESSMENT                                  |
|  Rule Scorer (7 rules -> 0-100, max aggregation)  |
|  RandomForest (trained on 6.36M PaySim rows)      |
|  Combine: 0.5 * rule + 0.5 * ml_prob * 100        |
+--------------------------+-----------------------+
                           v
+--------------------------------------------------+
|  INVESTIGATION BUILDER (Deterministic)            |
|  Evidence collection, timeline, parties, SAR fields|
|  Case ID: deterministic hash per account_id        |
+--------------------------+-----------------------+
                           v
+--------------------------------------------------+
|  LLM SERVICES (Optional)                          |
|  OpenRouter free tier (Qwen3 Next 80B)            |
|  - Narrative generation                           |
|  - Explanation with citations                     |
|  - Alert summary (rule-based fallback)            |
|  Fallback: rule-based templates if no API key     |
+--------------------------+-----------------------+
                           v
+--------------------------------------------------+
|  API LAYER                                        |
|  FastAPI + Pydantic validation                    |
|  8 endpoints (see below)                          |
+--------------------------+-----------------------+
                           v
+--------------------------------------------------+
|  INVESTIGATOR WORKSPACE                           |
|  Next.js 16 + React 19 + Tailwind CSS             |
|  Light enterprise theme (ivory + navy + orange)   |
|  Public website (7 pages) + App (5 pages)         |
|  Two-pane case workspace + graph explorer          |
+--------------------------------------------------+
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+

### Backend (FastAPI)

```bash
# Clone and enter the repo
git clone https://github.com/FarahElshenawi/EGY-Sentinel-AML.git
cd EGY-Sentinel-AML

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Generate the demo dataset (206 rows, 5 planted patterns)
python scripts/generate_demo_data.py

# (Optional) Set up LLM for real AI-generated narratives
# Sign up at https://openrouter.ai (free), generate a key, then:
export OPENROUTER_API_KEY="sk-or-v1-..."
# Without this, the system uses rule-based fallback templates — still works.

# Run the API server
uvicorn egysentinel.api.main:app --reload
```

The API will be available at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

### Frontend (Next.js)

```bash
# In a separate terminal
cd demo

# Install dependencies
npm install

# Run the dev server
npm run dev
```

The dashboard will be available at `http://localhost:3000`

### Using the Demo

1. Open `http://localhost:3000` — you'll see the landing page (public website)
2. Click **"Open the Investigator Console"** or **"Log in"** — redirects to `/app/queue`
3. The Queue shows all flagged accounts with real risk scores from the hybrid scorer
4. Click any case — opens the Case Workspace (two-pane layout):
   - **Left pane** — risk gauge, AI explanation with citations, timeline, parties, narrative, SAR fields
   - **Right pane** — interactive transaction graph (toggle with audit log)
5. Navigate via the sidebar: **Queue**, **Graph Explorer**, **Reports**, **Settings**
6. In the Graph Explorer, click any node to see account details and open its case
7. Use the **Decision Panel** (Escalate / Close / Needs Review / Generate Report) — every decision requires a reason and is logged to the audit trail

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Service health check |
| `GET` | `/graph` | All flagged accounts + 1-hop neighbors (for graph explorer) |
| `GET` | `/graph/{account_id}` | Subgraph for a specific account (case workspace) |
| `POST` | `/detect` | Run all 3 pattern detectors on demo data |
| `POST` | `/score` | Compute hybrid risk score (rule + ML) for an account |
| `POST` | `/investigate` | Full pipeline: detection + scoring + alert + case + explanation |
| `POST` | `/case` | Build a case report only |
| `GET` | `/api/v1/cases` | All cases with real risk scores (used by queue + reports) |
| `POST` | `/api/v1/cases/decide` | Record a decision (escalate/close/review/report) |
| `GET` | `/api/v1/cases/decisions` | List all decisions (optional filter by case_id) |

All endpoints are wired to real logic — no stubs.

---

## Project Structure

```
EGY-Sentinel-AML/
├── schemas/                    # 5 locked JSON schemas (contracts)
├── data/
│   ├── demo.csv                # 206-row dataset, 5 planted patterns
│   ├── loader.py               # load_sample() + patterns cache + get_demo_stats()
│   └── decisions.jsonl         # Audit trail of case decisions
├── models/
│   └── _RandomForest_paysim_fraud_model.joblib  # Trained RandomForest (4.5 MB)
├── egysentinel/                # Main Python package
│   ├── api/                    # FastAPI service + decisions + cases API
│   ├── graph/                  # NetworkX builder + serializer
│   ├── detect/                 # 3 pattern detectors (circular, fan_out, dense_cluster)
│   ├── score/                  # Features + rule scorer + ML scorer + combine
│   └── agents/                 # LLM client + orchestrator + alert + case builder + explanation
├── demo/                       # Next.js frontend
│   ├── app/
│   │   ├── (marketing)/        # 7 public pages (home, product, how-it-works, security, about, contact, login)
│   │   └── app/                # 5 app pages (queue, cases/[id], graph, reports, settings)
│   ├── components/             # 25 atomic components (atoms, molecules, organisms, templates)
│   ├── lib/                    # API client + formatters
│   └── types/                  # TypeScript types (match Pydantic)
├── tests/                      # 198 tests across 9 files
├── scripts/
│   └── generate_demo_data.py   # Deterministic dataset generator (seed=42)
└── requirements.txt
```

---

## Tech Stack

| Layer | Technology | Cost |
|-------|-----------|------|
| **Data** | Python, Pandas, PyArrow | Free |
| **Graph** | NetworkX 3.x | Free |
| **ML** | scikit-learn (RandomForest) | Free |
| **LLM** | OpenRouter (Qwen3 Next 80B — free tier) | Free |
| **API** | FastAPI, Pydantic, Uvicorn | Free |
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind | Free |
| **Total** | | **$0** |

---

## The Demo Dataset

The system ships with `data/demo.csv` — a 206-row PaySim-format dataset with 5 planted money-laundering patterns:

| # | Pattern | Accounts | Why it's fraud |
|---|---------|----------|----------------|
| 1 | **Circular** | C1001-C1004 | Closed loop A→B→C→D→A — classic layering |
| 2 | **Fan-out** | C2001 + 8 receivers | Smurfing — 95K each (below 100K threshold) |
| 3 | **Dense cluster** | C3001-C3005 | Coordinated activity, density 0.6 |
| 4 | **Mixed circular+fanout** | C4001-C4005 | Fan-out then chain back to originator |
| 5 | **Mixed dense+drained** | C5001-C5005 | Dense cluster + all senders drained to zero |

Plus 165 clean background transactions for realistic noise.

The generator (`scripts/generate_demo_data.py`) is deterministic (seed=42) — anyone re-running it gets the exact same file. Auditors can read the script to see exactly what patterns are planted.

---

## LLM Integration (Optional)

The system works in two modes:

| Mode | Trigger | Behavior |
|------|---------|----------|
| **LLM mode** | `OPENROUTER_API_KEY` env var set | Real LLM calls to OpenRouter. Alert summaries, case narratives, and explanations are LLM-generated. Cached for determinism. |
| **Fallback mode** | No API key set | Rule-based templates for all 3 agents. Demo still works — just less rich text. |

### Setup

1. Sign up at **https://openrouter.ai** (free, no credit card)
2. Generate a key at **https://openrouter.ai/keys**
3. Set the env var:
   ```bash
   export OPENROUTER_API_KEY="sk-or-v1-..."
   ```

### Default model

`qwen/qwen3-next-80b-a3b-instruct:free` — a Mixture-of-Experts model with 80B total params but only 3B active per token. Near-3B speed with near-70B quality. Optimized for deterministic, instruction-following outputs (exactly what our agents need).

Override anytime:
```bash
export OPENROUTER_MODEL="meta-llama/llama-3.3-70b-instruct:free"
```

---

## Risk Scoring

The hybrid score combines a transparent rule engine with a trained RandomForest:

```
final_score = 0.5 * rule_score + 0.5 * ml_prob * 100
```

### Rule engine (7 rules, sum to 120, capped at 100)

| Rule | Points | Rationale |
|------|--------|-----------|
| Type is TRANSFER or CASH_OUT | +25 | Fraud occurs exclusively in these types |
| Amount above 99th percentile | +20 | Large transactions carry disproportionate risk |
| Sender balance fully drained | +25 | Classic account-takeover signature |
| Receiver is zero-balance "mule" | +15 | Pass-through account signature |
| High sender frequency (top 1%) | +10 | Unusually frequent activity |
| High receiver frequency (top 1%) | +10 | Concentration of funds |
| Significant balance error | +15 | Balance-accounting mismatches correlate with fraud |

### Risk bands

| Band | Score | Meaning |
|------|-------|---------|
| Low | 0-30 | Normal activity |
| Medium | 31-65 | Worth a look |
| High | 66-100 | Investigate immediately |

---

## Tests

```bash
# Run the full test suite
python -m pytest tests/ -v

# 198 tests across 9 files:
# - test_alert_agent.py (4 tests) — alert priority and fallback
# - test_case_builder.py (41 tests) — case building, parties, timeline, SAR
# - test_explanation_agent.py (16 tests) — explanation, citations, confidence
# - test_llm_client.py (24 tests) — LLM client (HTTP mocked)
# - test_orchestrator.py (29 tests) — pipeline, enum normalization, determinism
# - test_pipeline.py (24 tests) — pattern normalization, batch processing
# - test_score.py (34 tests) — features, rules, ML, combine
# - test_demo_data.py (21 tests) — data structure, planted patterns, loader
# - test_e2e_pipeline.py (5 tests) — full pipeline, zero injection, score consistency
```

---

## License

Academic Capstone Project — 2026
