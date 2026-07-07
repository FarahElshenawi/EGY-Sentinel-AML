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
    NOT the full 30K node graph (that would crash the browser).

    STUB — returns a small synthetic graph for now.
    Day 2: replace with call to DS-2's build_digraph + detect_all + subgraph extraction.
    """
    # TODO Day 2: replace with real subgraph extraction
    # from data.loader import load_sample
    # from egysentinel.graph.build import build_digraph
    # from egysentinel.graph.serialize import serialize_graph
    # from egysentinel.detect import detect_all
    # df = load_sample()
    # G = build_digraph(df)
    # patterns = detect_all(G)
    # flagged_accounts = set()
    # for p in patterns:
    #     flagged_accounts.update(p.get("accounts", []))
    # neighbors = set()
    # for acc in flagged_accounts:
    #     neighbors.update(G.neighbors(acc))
    # subgraph_nodes = flagged_accounts | neighbors
    # subgraph = G.subgraph(subgraph_nodes)
    # return serialize_graph(subgraph)

    nodes = [
        GraphNode(id="A", label="Account A", risk_score=85, risk_band=RiskBand.HIGH),
        GraphNode(id="B", label="Account B", risk_score=72, risk_band=RiskBand.HIGH),
        GraphNode(id="C", label="Account C", risk_score=68, risk_band=RiskBand.HIGH),
        GraphNode(id="D", label="Account D", risk_score=91, risk_band=RiskBand.HIGH),
        GraphNode(id="E", label="Account E", risk_score=15, risk_band=RiskBand.LOW),
    ]
    edges = [
        GraphEdge(source="A", target="B", amount=450000, type=TransactionType.TRANSFER, step=100, isFraud=1),
        GraphEdge(source="B", target="C", amount=440000, type=TransactionType.TRANSFER, step=102, isFraud=1),
        GraphEdge(source="C", target="D", amount=430000, type=TransactionType.TRANSFER, step=104, isFraud=1),
        GraphEdge(source="D", target="A", amount=420000, type=TransactionType.TRANSFER, step=106, isFraud=1),
        GraphEdge(source="E", target="A", amount=5000, type=TransactionType.PAYMENT, step=50, isFraud=0),
    ]
    return GraphResponse(nodes=nodes, edges=edges, stats={"node_count": len(nodes), "edge_count": len(edges), "note": "STUB — real subgraph wired on Day 2"})

@app.post("/detect", response_model=DetectResponse, tags=["detection"])
async def detect_patterns():
    """
    Run pattern detectors on the loaded sample.
    No payload needed — operates on server-side data.

    STUB — returns one fake circular pattern.
    Day 3: replace with call to DS-2's detect_all(graph).
    """
    # TODO Day 3: replace with real detector call
    # from data.loader import load_sample
    # from egysentinel.graph.build import build_digraph
    # from egysentinel.detect import detect_all
    # df = load_sample()
    # graph = build_digraph(df)
    # patterns = detect_all(graph)
    # accounts_flagged = list(set(acc for p in patterns for acc in p.get("accounts", [])))
    # return DetectResponse(patterns=patterns, total_patterns=len(patterns), accounts_flagged=accounts_flagged)

    fake_pattern = {"type": "circular", "accounts": ["A", "B", "C", "D"], "edges": [{"source": "A", "target": "B", "amount": 450000}, {"source": "B", "target": "C", "amount": 440000}, {"source": "C", "target": "D", "amount": 430000}, {"source": "D", "target": "A", "amount": 420000}], "description": "STUB: Circular transaction pattern A->B->C->D->A"}
    return DetectResponse(patterns=[fake_pattern], total_patterns=1, accounts_flagged=["A", "B", "C", "D"])

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
