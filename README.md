# Sentinel AML

**AI-Powered Financial Surveillance & Fraud Intelligence System**

> *See the money move before it disappears.*

Sentinel AML is an anti-money-laundering platform that combines graph-based intelligence, machine learning risk scoring, and agentic AI investigation to detect financial crime that traditional rule-based systems miss — then hands your investigators a clear, evidence-backed case file the moment something looks wrong.

---

## What It Does

Sentinel watches every transaction moving through a bank, maps it as a directed graph, and flags the shapes that matter: money looping back to where it started, one account fanning out to dozens of others, tight clusters moving funds among themselves. When a pattern fires, three AI agents build the full investigation — an alert with priority, a SAR-style case report, and a plain-English explanation with citations — so your investigator gets the whole story in one click, not a dashboard to decode.

### The 5-layer pipeline

```
Demo Dataset (~200 rows, 5 planted patterns)
       |
       v
+--------------------------------------------------+
|  GRAPH LAYER (DS-2)                              |
|  NetworkX DiGraph + 3 Detectors                  |
|  - Circular (DFS simple_cycles, len 3-6)         |
|  - Fan-out (out-degree >= 5 in 1-step window)    |
|  - Dense Cluster (Louvain, density >= 0.5)       |
+--------------------------+-----------------------+
                           v
+--------------------------------------------------+
|  ML LAYER (DS-1/3)                               |
|  Rule Scorer (7 rules -> 0-100)                  |
|  RandomForest (trained on 6.36M PaySim rows)     |
|  Combine: 0.5 * rule + 0.5 * ml_prob * 100       |
+--------------------------+-----------------------+
                           v
+--------------------------------------------------+
|  AGENTIC AI LAYER (AI-1/2/3/4)                   |
|  LLM via OpenRouter free tier (Qwen3 Next 80B)   |
|  1. Alert Agent -> priority + summary            |
|  2. Case Builder -> SAR report + timeline        |
|  3. Explanation -> plain-English + citations     |
|  Fallback: rule-based templates if no API key    |
+--------------------------+-----------------------+
                           v
+--------------------------------------------------+
|  API LAYER (AI-5)                                |
|  FastAPI + Pydantic validation                   |
|  /health, /graph, /detect, /score, /investigate  |
+--------------------------+-----------------------+
                           v
+--------------------------------------------------+
|  UI LAYER (AI-5)                                 |
|  Next.js 16 + React 19 + Tailwind CSS            |
|  Dark command center + landing page              |
|  3 pages: Dashboard, Alerts, Cases               |
|  Case Workspace: Overview / Network / Audit tabs |
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

1. Open `http://localhost:3000` — you'll see the landing page
2. Click **"Open the Investigator Console"** — goes to the Cases page
3. The Cases page shows all flagged accounts from the demo dataset
4. Click any case — opens the Case Workspace with 3 tabs:
   - **Overview** — risk gauge, plain-English explanation, key facts, parties
   - **Network Graph** — interactive transaction map
   - **Audit Log & Raw Data** — full agent trace, audit trail, JSON dump
5. Navigate via the sidebar: **Dashboard** (overview + map), **Alerts** (inbox), **Cases** (list)
6. On the Dashboard, click "Load Sample" to render the transaction map, then click any node to open its case

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Service health check |
| `GET` | `/graph` | Flagged accounts + 1-hop neighbors (for browser rendering) |
| `POST` | `/detect` | Run all 3 pattern detectors on demo data |
| `POST` | `/score` | Compute hybrid risk score (rule + ML) for an account |
| `POST` | `/investigate` | Full agent pipeline: alert → case → explanation |
| `POST` | `/case` | Build a case report only |

All endpoints are wired to real logic — no stubs.

---

## Project Structure

```
EGY-Sentinel-AML/
├── schemas/                    # 5 locked JSON schemas (contracts)
├── data/
│   ├── demo.csv                # 206-row dataset, 5 planted patterns
│   └── loader.py               # load_sample() + get_demo_stats()
├── models/
│   └── randomforest_...joblib  # Trained RandomForest pipeline (4.5 MB)
├── egysentinel/                # Main Python package
│   ├── api/                    # FastAPI service (AI-5)
│   ├── graph/                  # NetworkX builder + serializer (DS-2)
│   ├── detect/                 # 3 pattern detectors (DS-2)
│   ├── score/                  # Rule + ML + combine (DS-1/3)
│   └── agents/                 # LLM client + orchestrator + 3 agents (AI-1/2/3/4)
├── demo/                       # Next.js frontend (AI-5)
│   ├── app/                    # Landing + Dashboard + Alerts + Cases
│   ├── components/             # RiskGauge, GraphCanvas, case tabs, agent-trace
│   ├── lib/                    # API client + formatters
│   └── types/                  # TypeScript types (match Pydantic)
├── tests/                      # 231 unit + integration tests
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
| **AI** | OpenRouter (Qwen3 Next 80B — free tier) | Free |
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

# 231 tests covering:
# - AI-2 alert agent (4 tests)
# - AI-3 case builder + pipeline (51 tests)
# - AI-4 explanation agent (16 tests)
# - AI-1 orchestrator (29 tests)
# - AI-1 LLM client (24 tests, all HTTP mocked)
# - DS-1/3 scoring modules (34 tests)
# - DS-2 graph + detectors (38 tests)
# - Demo data + loader (21 tests)
# - Enum drift / schema alignment (14 tests)
```

---

## Team

| Role | Member | Owns |
|------|--------|------|
| Tech Lead / AI-5 | Farah Elshenawi | FastAPI, Next.js, Integration, Demo Data |
| DS-1/3 | Data & ML Engineer | PaySim, EDA, RandomForest, Rule Scorer |
| DS-2 | Graph Engineer | NetworkX, 3 Detectors, Graph Builder |
| AI-1 | LLM Infrastructure | OpenRouter Client, Orchestrator |
| AI-2 | Alert Agent | Priority classification |
| AI-3 | Case Builder Agent | SAR reports, Evidence assembly |
| AI-4 | Explanation Agent | Plain-English justification, Citations |

---
