# EGY-Sentinel AML

**AI-Powered Financial Surveillance & Fraud Intelligence System**

> *Uncover the Hidden. Protect the System.*

EGY-Sentinel AML is an enterprise-grade anti-money laundering (AML) platform that combines graph-based intelligence, machine learning risk scoring, and agentic AI investigation to detect financial crime that traditional rule-based systems miss.

Built by a 7-engineer team in a compressed 10-day academic capstone sprint.

---

## 🎯 The Problem

Traditional fraud detection relies on static rules (thresholds, known bad actors). It misses **network patterns** — circular flows, fan-out smurfing, dense clusters — that money launderers build to obscure their tracks. By the time a human investigator spots the pattern, the money is gone.

## 🧠 The Solution

EGY-Sentinel AML transforms detection into intelligence through a 5-layer pipeline:

1. **Graph Intelligence** — Models PaySim transactions as a directed graph (NetworkX). Detects circular flows, fan-out, and dense clusters.
2. **ML Risk Scoring** — Combines a 5-rule ensemble with XGBoost to rank every account 0–100. Calibrated for extreme class imbalance (0.13% fraud).
3. **Agentic Investigation** — Three GLM-powered AI agents build the full investigation: Alert (priority), Case Builder (SAR-style report), Explanation (plain-English with citations). No black box.
4. **FastAPI Service** — 5 endpoints serving the full pipeline with sub-500ms latency.
5. **Enterprise Dashboard** — Next.js dark-mode command center with interactive graph, agent reasoning trace, audit trail, and confirmation modals.

---

## 🏗️ Architecture

```
PaySim 30K Sample
       ↓
┌──────────────────────────────────────────────────┐
│  DATA LAYER (DS-1/3)                             │
│  Pandas + Stratified Sampler + EDA               │
│  Features: log_amount, balance_diff, degrees     │
└──────────────────┬───────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────────┐
│  GRAPH LAYER (DS-2)                              │
│  NetworkX DiGraph + 3 Detectors                  │
│  • Circular (DFS depth-5)                        │
│  • Fan-out (out-degree >= 10 in 24h window)      │
│  • Dense Cluster (Louvain, modularity >= 0.3)    │
└──────────────────┬───────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────────┐
│  ML LAYER (DS-1/3)                               │
│  Rule Scorer (5 rules -> 0-100)                  │
│  XGBoost (scale_pos_weight ~750)                 │
│  Combine: 0.5 * rule + 0.5 * ml_prob * 100       │
└──────────────────┬───────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────────┐
│  AGENTIC AI LAYER (AI-1/2/3/4)                   │
│  GLM via z-ai-web-dev-sdk (free, no API key)     │
│  1. Alert Agent -> priority + summary            │
│  2. Case Builder -> SAR report + timeline        │
│  3. Explanation -> plain-English + citations     │
│  Fallback: rule-based templates if GLM fails     │
└──────────────────┬───────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────────┐
│  API LAYER (AI-5)                                │
│  FastAPI + Pydantic validation                   │
│  /graph, /detect, /score, /investigate, /case    │
└──────────────────┬───────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────────┐
│  UI LAYER (AI-5)                                 │
│  Next.js 16 + React 19 + Tailwind CSS            │
│  Dark-mode command center + landing page         │
│  Agent Reasoning Trace + Audit Trail             │
└──────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Cost |
|-------|-----------|------|
| **Data** | Python, Pandas, PyArrow | Free |
| **Graph** | NetworkX 3.x | Free |
| **ML** | scikit-learn, XGBoost | Free |
| **AI** | GLM via z-ai-web-dev-sdk | Free (no API key) |
| **API** | FastAPI, Pydantic, Uvicorn | Free |
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind | Free |
| **Container** | Docker, Docker Compose | Free |
| **Total** | | **$0** |

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker (optional, for containerized deployment)

### Backend (FastAPI)

```bash
# Clone and enter the repo
git clone https://github.com/FarahElshenawi/EGY-Sentinel-AML.git
cd EGY-Sentinel-AML

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

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
2. Click **"Launch Live Demo"** — opens the Case Workspace
3. Click **"Load Sample Scenario"** — loads the synthetic circular transaction graph
4. Click any node in the graph — triggers the full investigation pipeline:
   - Alert Agent generates priority + summary
   - Case Builder assembles the SAR report
   - Explanation Agent produces plain-English justification with citations
5. Explore the **Agent Reasoning Trace** — expand each agent to see inputs, reasoning, outputs, and prompts
6. Scroll down to the **Audit Trail** — every action is logged with expandable JSON payloads
7. Click **"Escalate Case"** — opens the confirmation modal with required reason and audit preview

---

## 📂 Project Structure

```
EGY-Sentinel-AML/
├── schemas/                    # Locked JSON schemas (contracts)
├── data/                       # PaySim sample + loader
├── egysentinel/                # Main Python package
│   ├── api/                    # FastAPI service (AI-5)
│   ├── graph/                  # NetworkX graph + serializer (DS-2)
│   ├── detect/                 # 3 pattern detectors (DS-2)
│   ├── score/                  # Rule + XGBoost scorer (DS-1/3)
│   └── agents/                 # GLM agents + prompts (AI-1/2/3/4)
├── demo/                       # Next.js frontend (AI-5)
│   ├── app/                    # Landing page + dashboard + alerts + audit
│   ├── components/             # UI components + agent-trace
│   ├── lib/                    # API client + formatters
│   └── types/                  # TypeScript types
├── tests/                      # Unit tests
├── docs/                       # Documentation + file ownership
├── reports/                    # Figures + smoke test + final deliverables
├── Dockerfile.api              # FastAPI container
├── Dockerfile.ui               # Next.js container
└── docker-compose.yml          # One-command boot
```

---

## 📊 KPIs

| Category | Metric | Target |
|----------|--------|--------|
| ML | Precision (fraud class) | >= 0.75 |
| ML | Recall (fraud class) | >= 0.60 |
| ML | F1 Score | >= 0.67 |
| Patterns | Distinct detector types | >= 3 |
| Agentic | Alert latency | <= 5s p95 |
| Agentic | Schema validity | 100% |
| System | API p95 latency | <= 500ms |
| System | Docker cold-boot | <= 90s |

---

## 🔒 Schema Contracts

The 5 foundational schemas are **locked** after Day 1. Any change requires:
1. A PR with the change
2. Tagging all downstream consumers
3. Bumping the schema version
4. Tech Lead approval

See `schemas/README.md` for details.

---

## 👥 Team

| Role | Member | Owns |
|------|--------|------|
| Tech Lead / AI-5 | Farah Elshenawi | FastAPI, Next.js, Docker, Integration |
| DS-1/3 | Data & ML Engineer | PaySim, EDA, XGBoost, Rule Scorer |
| DS-2 | Graph Engineer | NetworkX, 3 Detectors, Serializer |
| AI-1 | LLM Infrastructure | GLM Client, Orchestrator, Fallbacks |
| AI-2 | Alert Agent | Priority classification |
| AI-3 | Case Builder Agent | SAR reports, Evidence assembly |
| AI-4 | Explanation Agent | Plain-English justification, Citations |

---

## 📝 License

Academic Capstone Project — 2026

---

*Built by 7 engineers in 10 days. Total cost: $0.*
