"""
EGY-Sentinel AML — FastAPI Service
====================================
Day 2 skeleton. All endpoints return stubs.
Real wiring happens on Day 3 (graph/detect), Day 4 (scoring), Day 5 (agents).

Run:
    uvicorn egysentinel.api.main:app --reload

Docs:
    http://localhost:8000/docs
"""

from datetime import datetime
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from egysentinel.api.models import (
    Account, Transaction, Alert, CaseReport, Explanation,
    Citation, CitationType, SARFields, TimelineEntry, Party, PartyRole,
    RiskBand, AlertPriority, PatternType, TransactionType,
    GraphNode, GraphEdge, GraphResponse,
    DetectResponse,
    ScoreRequest, ScoreResponse,
    InvestigateRequest, InvestigateResponse,
    CaseRequest, CaseResponse,
    HealthResponse,
)

app = FastAPI(
    title="EGY-Sentinel AML API",
    description="""
AI-Powered Financial Surveillance & Fraud Intelligence System.

**Endpoints:**
- `GET /health` — service health check
- `POST /detect` — run pattern detectors on loaded sample (no payload needed)
- `POST /score` — compute risk score for an account
- `POST /investigate` — run full agent pipeline (alert + case + explanation)
- `POST /case` — build a case report only
- `GET /graph` — get graph data for frontend visualization (flagged accounts + 1-hop neighbors only)
    """,
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health():
    return HealthResponse(status="ok", version="0.2.0", timestamp=datetime.utcnow())

@app.get("/graph", response_model=GraphResponse, tags=["graph"])
async def get_graph():
    """
    Get graph data (nodes + edges) for frontend visualization.
    Returns ONLY flagged accounts + their 1-hop neighbors.
    NOT the full graph (that would crash the browser).
    """
    from data.loader import load_sample
    from egysentinel.graph.build import build_digraph, get_flagged_subgraph
    from egysentinel.graph.serialize import serialize_graph
    from egysentinel.detect import detect_all, get_flagged_accounts

    try:
        df = load_sample()
    except FileNotFoundError:
        return GraphResponse(nodes=[], edges=[], stats={"error": "No demo data loaded"})

    G = build_digraph(df)
    patterns = detect_all(G)
    flagged = get_flagged_accounts(patterns)
    subgraph = get_flagged_subgraph(G, flagged, hops=1)

    return serialize_graph(subgraph)

@app.post("/detect", response_model=DetectResponse, tags=["detection"])
async def detect_patterns():
    """
    Run all 3 pattern detectors (circular, fan_out, dense_cluster)
    on the loaded demo data.
    """
    from data.loader import load_sample
    from egysentinel.graph.build import build_digraph
    from egysentinel.detect import detect_all, get_flagged_accounts

    try:
        df = load_sample()
    except FileNotFoundError:
        return DetectResponse(patterns=[], total_patterns=0, accounts_flagged=[])

    G = build_digraph(df)
    patterns = detect_all(G)
    accounts_flagged = sorted(get_flagged_accounts(patterns))
    return DetectResponse(
        patterns=patterns,
        total_patterns=len(patterns),
        accounts_flagged=accounts_flagged,
    )

@app.post("/score", response_model=ScoreResponse, tags=["scoring"])
async def score_account(req: ScoreRequest):
    """
    Compute the combined risk score (rule + ML) for an account.

    Uses the hybrid formula from DS-1/3's notebook:
        final = 0.5 * rule_score + 0.5 * ml_prob * 100

    Falls back to rule-only if the ML model can't be loaded.
    """
    from egysentinel.score.combine import combine_account
    from data.loader import load_sample
    try:
        df = load_sample()
    except FileNotFoundError:
        # No demo data loaded — return low score
        return ScoreResponse(account=Account(
            account_id=req.account_id, risk_score=0.0, risk_band=RiskBand.LOW, pattern_count=0,
        ))
    result = combine_account(req.account_id, df)
    return ScoreResponse(account=Account(
        account_id=result["account_id"],
        risk_score=result["risk_score"],
        risk_band=RiskBand(result["risk_band"]),
        pattern_count=result["pattern_count"],
    ))

@app.post("/investigate", response_model=InvestigateResponse, tags=["agents"])
async def investigate(req: InvestigateRequest):
    """
    Run the full agent pipeline on an account.

    Chains: alert (AI-2) -> case (AI-3) -> explanation (AI-4)
    All agents use rule-based fallbacks (no GLM SDK installed locally).
    """
    from egysentinel.agents.orchestrator import investigate_response
    return investigate_response(req.account_id)

@app.post("/case", response_model=CaseResponse, tags=["agents"])
async def build_case_endpoint(req: CaseRequest):
    """Build a case report only (no alert, no explanation)."""
    from egysentinel.agents.orchestrator import investigate_response
    resp = investigate_response(req.account_id)
    return CaseResponse(case=resp.case)

@app.get("/", tags=["system"])
async def root():
    return {"service": "EGY-Sentinel AML API", "version": "0.2.0", "docs": "/docs", "health": "/health"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("egysentinel.api.main:app", host="0.0.0.0", port=8000, reload=True)
