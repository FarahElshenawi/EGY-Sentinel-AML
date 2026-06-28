# EGY-Sentinel AML — Repo Structure & File Ownership

> **One file = one owner.** No ambiguity, no merge conflicts.

---

## Full Repo Tree

```
EGY-Sentinel-AML/
│
├── .github/
│   └── pull_request_template.md          ← AI-5 (creates Day 1)
│
├── .gitignore                            ← AI-5 (Day 1)
├── .env.example                          ← AI-5
├── README.md                             ← AI-5 (main editor; all contribute sections)
├── requirements.txt                      ← DS-1/3 (pins all Python deps)
├── Makefile                              ← AI-5 (install, demo-input, smoke-test, demo targets)
├── setup_project.py                      ← AI-5 (already created)
│
├── schemas/                              ← 🔒 LOCKED Day 1 @ 12:30 by DS-1/3 + AI-5
│   ├── account.json                      ← DS-1/3 + AI-5 (locked — no edits without PR)
│   ├── transaction.json                  ← DS-1/3 + AI-5 (locked)
│   ├── alert.json                        ← DS-1/3 + AI-5 (locked)
│   ├── case_report.json                  ← DS-1/3 + AI-5 (locked)
│   ├── explanation.json                  ← DS-1/3 + AI-5 (locked)
│   └── README.md                         ← DS-1/3
│
├── data/
│   ├── sample/
│   │   └── paysim_30k.csv                ← DS-1/3 (gitignored — too big)
│   ├── features.parquet                  ← DS-1/3 (gitignored)
│   ├── patterns.csv                      ← DS-2 (gitignored)
│   └── llm_cache/                        ← AI-1 (gitignored)
│       └── *.json                        ← AI-1
│
├── egysentinel/                          ← Main Python package
│   ├── __init__.py                       ← AI-5 (version + docstring)
│   │
│   ├── api/                              ← AI-5 OWNS THIS ENTIRE FOLDER
│   │   ├── __init__.py                   ← AI-5
│   │   ├── main.py                       ← AI-5 (FastAPI app, 5 endpoints)
│   │   └── models.py                     ← AI-5 (Pydantic models from schemas)
│   │
│   ├── graph/                            ← DS-2 OWNS THIS ENTIRE FOLDER
│   │   ├── __init__.py                   ← DS-2
│   │   ├── build.py                      ← DS-2 (build_digraph(df) → nx.DiGraph)
│   │   └── inspect.py                    ← DS-2 (neighbours(), subgraph_around())
│   │
│   ├── detect/                           ← DS-2 OWNS THIS ENTIRE FOLDER
│   │   ├── __init__.py                   ← DS-2
│   │   ├── circular.py                   ← DS-2 (DFS cycle search)
│   │   ├── fan_out.py                    ← DS-2 (out-degree ≥10)
│   │   └── dense_cluster.py              ← DS-2 (Louvain communities)
│   │
│   ├── score/                            ← DS-1/3 OWNS THIS ENTIRE FOLDER
│   │   ├── __init__.py                   ← DS-1/3
│   │   ├── rule_scorer.py                ← DS-1/3 (5 rules → 0-100)
│   │   ├── ml_scorer.py                  ← DS-1/3 (XGBoost predict_proba)
│   │   └── combine.py                    ← DS-1/3 (final_score = 0.5*rule + 0.5*ml*100)
│   │
│   └── agents/                           ← AI-1 OWNS FOLDER; agents split below
│       ├── __init__.py                   ← AI-1
│       ├── llm_client.py                 ← AI-1 (GLM wrapper + caching + retry)
│       ├── orchestrator.py               ← AI-1 (alert → case → explanation pipeline)
│       ├── evidence.py                   ← AI-3 (assemble_evidence() helper)
│       ├── fallbacks.py                  ← AI-1 (rule-based templates, all 3 agents)
│       ├── alert_agent.py                ← AI-2 (generate_alert())
│       ├── case_builder_agent.py         ← AI-3 (build_case())
│       ├── explanation_agent.py          ← AI-4 (generate_explanation())
│       └── prompts/                      ← AI-1 owns folder; each agent owner owns their file
│           ├── alert.txt                 ← AI-2
│           ├── case_builder.txt          ← AI-3
│           └── explanation.txt           ← AI-4
│
├── notebooks/
│   ├── 01_eda.ipynb                      ← DS-1/3
│   ├── 02_graph_build.ipynb              ← DS-2
│   ├── 03_pattern_detection.ipynb        ← DS-2
│   ├── 04_risk_scoring.ipynb             ← DS-1/3
│   └── 05_agentic_pipeline.ipynb         ← AI-1 (with contributions from AI-2/3/4)
│
├── demo/                                 ← AI-5 OWNS THIS ENTIRE FOLDER
│   ├── package.json                      ← AI-5
│   ├── tsconfig.json                     ← AI-5
│   ├── next.config.js                    ← AI-5
│   ├── tailwind.config.ts                ← AI-5
│   ├── postcss.config.js                 ← AI-5
│   ├── .env.local                        ← AI-5
│   ├── app/
│   │   ├── layout.tsx                    ← AI-5
│   │   ├── page.tsx                      ← AI-5 (main dashboard)
│   │   └── globals.css                   ← AI-5
│   ├── components/
│   │   ├── Header.tsx                    ← AI-5
│   │   ├── GraphCanvas.tsx               ← AI-5
│   │   ├── SidePanel.tsx                 ← AI-5
│   │   ├── AlertPanel.tsx                ← AI-5
│   │   ├── CasePanel.tsx                 ← AI-5
│   │   └── ExplanationPanel.tsx          ← AI-5
│   ├── lib/
│   │   └── api.ts                        ← AI-5 (typed API client)
│   └── types/
│       └── index.ts                      ← AI-5 (TypeScript types — match Pydantic)
│
├── models/                               ← (gitignored contents, folder tracked)
│   └── xgboost.joblib                    ← DS-1/3 (saved model artifact)
│
├── tests/
│   ├── test_smoke.py                     ← AI-5 (end-to-end pipeline test)
│   ├── test_alert_agent.py               ← AI-2
│   ├── test_case_builder.py              ← AI-3
│   ├── test_explanation_agent.py         ← AI-4
│   └── test_llm_client.py                ← AI-1
│
├── docs/
│   ├── file_ownership.md                 ← THIS FILE (AI-5 maintains)
│   ├── rule_scorer.md                    ← DS-1/3
│   ├── detectors.md                      ← DS-2
│   ├── schemas.md                        ← DS-1/3
│   ├── prompts.md                        ← AI-1
│   └── model_card.md                     ← DS-1/3
│
├── reports/
│   ├── figures/                          ← EDA figures (3 total)
│   │   ├── class_imbalance.png           ← AI-4 (assigned)
│   │   ├── fraud_by_type.png             ← AI-2 (assigned)
│   │   └── amount_distribution.png       ← AI-3 (assigned)
│   ├── smoke_test/                       ← AI-5 (smoke test outputs)
│   ├── retro.md                          ← Everyone contributes on Day 10
│   └── final/                            ← Day 10 deliverables
│       ├── demo_video.mp4                ← AI-5 (records on Day 9)
│       └── presentation_deck.pdf         ← AI-5 (builds on Day 9)
│
├── scripts/
│   ├── smoke_test.py                     ← AI-5 (end-to-end pipeline runner)
│   └── benchmark.py                      ← AI-5 (API latency benchmarks)
│
├── Dockerfile.api                        ← AI-5 (FastAPI container)
├── Dockerfile.ui                         ← AI-5 (Next.js container)
└── docker-compose.yml                    ← AI-5 (api + ui services — NO neo4j)
```

---

## Ownership Matrix — by Person

### DS-1/3 — Data & ML Engineer

**Owns 14 files:**

| File | Purpose |
|------|---------|
| `requirements.txt` | All Python deps, pinned |
| `data/sampler.py` | Stratified PaySim sampler |
| `data/sample/paysim_30k.csv` | Generated sample (gitignored) |
| `data/features.parquet` | Feature matrix (gitignored) |
| `egysentinel/score/__init__.py` | Package init |
| `egysentinel/score/rule_scorer.py` | 5 rules → 0–100 |
| `egysentinel/score/ml_scorer.py` | XGBoost predict_proba |
| `egysentinel/score/combine.py` | final_score = 0.5×rule + 0.5×ml×100 |
| `models/xgboost.joblib` | Saved model artifact |
| `notebooks/01_eda.ipynb` | EDA notebook |
| `notebooks/04_risk_scoring.ipynb` | Risk scoring notebook |
| `docs/rule_scorer.md` | Rule scorer docs |
| `docs/model_card.md` | Model card |
| `docs/schemas.md` | Schema docs |
| `schemas/README.md` | How to change schemas |

**Co-owns (with AI-5):**
- `schemas/account.json`, `transaction.json`, `alert.json`, `case_report.json`, `explanation.json` — **LOCKED** after Day 1 @ 12:30

---

### DS-2 — Graph Engineer

**Owns 11 files:**

| File | Purpose |
|------|---------|
| `egysentinel/graph/__init__.py` | Package init |
| `egysentinel/graph/build.py` | `build_digraph(df) → nx.DiGraph` |
| `egysentinel/graph/inspect.py` | `neighbours()`, `subgraph_around()` |
| `egysentinel/detect/__init__.py` | Package init |
| `egysentinel/detect/circular.py` | DFS cycle search |
| `egysentinel/detect/fan_out.py` | Out-degree ≥10 smurfing |
| `egysentinel/detect/dense_cluster.py` | Louvain communities |
| `data/patterns.csv` | Detector output (gitignored) |
| `notebooks/02_graph_build.ipynb` | Graph build notebook |
| `notebooks/03_pattern_detection.ipynb` | Pattern detection notebook |
| `docs/detectors.md` | Detector algorithm docs |

---

### AI-1 — LLM Infrastructure

**Owns 9 files:**

| File | Purpose |
|------|---------|
| `egysentinel/agents/__init__.py` | Package init |
| `egysentinel/agents/llm_client.py` | GLM wrapper + caching + retry |
| `egysentinel/agents/orchestrator.py` | alert → case → explanation pipeline |
| `egysentinel/agents/fallbacks.py` | Rule-based templates (all 3 agents) |
| `egysentinel/agents/prompts/` | Folder (owns the folder) |
| `notebooks/05_agentic_pipeline.ipynb` | Agentic pipeline notebook |
| `tests/test_llm_client.py` | LLM client tests |
| `docs/prompts.md` | Prompt docs |
| `data/llm_cache/` | Cache folder (gitignored) |

---

### AI-2 — Alert Agent

**Owns 4 files:**

| File | Purpose |
|------|---------|
| `egysentinel/agents/alert_agent.py` | `generate_alert()` |
| `egysentinel/agents/prompts/alert.txt` | Alert system prompt |
| `tests/test_alert_agent.py` | Alert agent unit tests |
| `reports/figures/fraud_by_type.png` | EDA figure (assigned) |

---

### AI-3 — Case Builder Agent

**Owns 5 files:**

| File | Purpose |
|------|---------|
| `egysentinel/agents/case_builder_agent.py` | `build_case()` |
| `egysentinel/agents/evidence.py` | `assemble_evidence()` helper |
| `egysentinel/agents/prompts/case_builder.txt` | Case builder prompt |
| `tests/test_case_builder.py` | Case builder unit tests |
| `reports/figures/amount_distribution.png` | EDA figure (assigned) |

---

### AI-4 — Explanation Agent

**Owns 4 files:**

| File | Purpose |
|------|---------|
| `egysentinel/agents/explanation_agent.py` | `generate_explanation()` |
| `egysentinel/agents/prompts/explanation.txt` | Explanation prompt |
| `tests/test_explanation_agent.py` | Explanation agent unit tests |
| `reports/figures/class_imbalance.png` | EDA figure (assigned) |

---

### AI-5 / Farah — Orchestrator + Backend (Tech Lead)

**Owns 27 files:**

| File | Purpose |
|------|---------|
| `.gitignore` | Git ignore rules |
| `.env.example` | Env template |
| `.github/pull_request_template.md` | PR template |
| `README.md` | Main README (all contribute sections) |
| `Makefile` | install, demo-input, smoke-test, demo |
| `setup_project.py` | Repo scaffolding script |
| `egysentinel/__init__.py` | Package version + docstring |
| `egysentinel/api/__init__.py` | API package init |
| `egysentinel/api/main.py` | FastAPI app, 5 endpoints |
| `egysentinel/api/models.py` | Pydantic models (from schemas) |
| `demo/package.json` | Next.js deps |
| `demo/tsconfig.json` | TypeScript config |
| `demo/next.config.js` | Next.js config + API proxy |
| `demo/tailwind.config.ts` | Tailwind config |
| `demo/postcss.config.js` | PostCSS config |
| `demo/.env.local` | Frontend env |
| `demo/app/layout.tsx` | Root layout |
| `demo/app/page.tsx` | Main dashboard |
| `demo/app/globals.css` | Global styles |
| `demo/components/Header.tsx` | Top bar + Load Sample button |
| `demo/components/GraphCanvas.tsx` | react-force-graph-2d wrapper |
| `demo/components/SidePanel.tsx` | Container for 3 panels |
| `demo/components/AlertPanel.tsx` | Alert display |
| `demo/components/CasePanel.tsx` | Case report display |
| `demo/components/ExplanationPanel.tsx` | Explanation display |
| `demo/lib/api.ts` | Typed API client |
| `demo/types/index.ts` | TypeScript types |
| `scripts/smoke_test.py` | End-to-end pipeline runner |
| `scripts/benchmark.py` | API latency benchmarks |
| `tests/test_smoke.py` | Smoke test |
| `Dockerfile.api` | FastAPI container |
| `Dockerfile.ui` | Next.js container |
| `docker-compose.yml` | api + ui (NO neo4j) |
| `reports/smoke_test/` | Smoke test outputs |
| `reports/final/demo_video.mp4` | Demo video (Day 9) |
| `reports/final/presentation_deck.pdf` | Presentation deck (Day 9) |
| `docs/file_ownership.md` | THIS FILE |

**Co-owns (with DS-1/3):**
- All 5 `schemas/*.json` files — **LOCKED** after Day 1 @ 12:30

---

## 🔒 The Critical Rule

**Each file has exactly ONE owner.** 

### Schema change protocol

`schemas/*.json` files are **LOCKED** after Day 1. Any change requires:

1. A PR with the change
2. Tagging **ALL downstream consumers** in the PR description
3. Bumping the schema version (e.g., `alert.json` → `alert_v2.json`)
4. Farah's (AI-5) approval to merge

**Unauthorized schema changes = Day 5 integration hell. Don't be that person.**

---

## ❌ Files that DON'T exist (cut from scope)

| File | Why it's gone |
|------|---------------|
| `egysentinel/graph/neo4j_loader.py` | Neo4j dropped — frontend visualizes the graph |
| `egysentinel/detect/fan_in.py` | Redundant with fan_out — cut |
| `egysentinel/detect/layering.py` | Hardest to tune — cut |
| `neo4j/queries/*.cyp` | No Neo4j — cut |
| `egysentinel/score/calibrator.py` | Calibration dropped — cut |

> If anyone tries to create these files, that's a scope violation. The plan deliberately excludes them.

---

