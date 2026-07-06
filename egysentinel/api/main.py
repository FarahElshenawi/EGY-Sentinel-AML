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
    Compute risk score for an account.

    STUB LOGIC — REMOVE ENTIRELY ON DAY 4
    When DS-1/3 delivers combine.py, replace this entire function body with:
        from egysentinel.score.combine import combine_score
        account = combine_score(req.account_id)
        return ScoreResponse(account=account)
    """
    # TODO Day 4: REMOVE THIS STUB — replace with real combine_score()
    if req.account_id.startswith("C"):
        return ScoreResponse(account=Account(account_id=req.account_id, risk_score=78.0, risk_band=RiskBand.HIGH, pattern_count=1))
    else:
        return ScoreResponse(account=Account(account_id=req.account_id, risk_score=15.0, risk_band=RiskBand.LOW, pattern_count=0))

@app.post("/investigate", response_model=InvestigateResponse, tags=["agents"])
async def investigate(req: InvestigateRequest):
    """
    Run the full agent pipeline on an account.

    STUB LOGIC — REMOVE ENTIRELY ON DAY 5
    When AI-1 delivers orchestrator.py, replace this entire function body with:
        from egysentinel.agents.orchestrator import investigate as real_investigate
        return real_investigate(req.account_id)
    """
    # TODO Day 5: REMOVE THIS STUB
    now = datetime.utcnow()
    account_id = req.account_id

    if not account_id.startswith("C") and account_id not in ["A", "B", "C", "D"]:
        raise HTTPException(status_code=404, detail=f"Account {account_id} not found or not high-risk (stub data).")

    alert = Alert(account_id=account_id, risk_score=85.0, risk_band=RiskBand.HIGH, pattern_type=PatternType.CIRCULAR, priority=AlertPriority.HIGH, summary=f"High-risk circular transaction pattern detected for account {account_id}", recommended_action="investigate", timestamp=now)
    case = CaseReport(case_id=f"STUB-CASE-{account_id}", account_id=account_id, alert_id=f"STUB-ALERT-{account_id}", timeline=[TimelineEntry(step=100, event="Transfer to B", account_id="B", amount=450000), TimelineEntry(step=102, event="Transfer to C (from B)", account_id="C", amount=440000), TimelineEntry(step=104, event="Transfer to D (from C)", account_id="D", amount=430000), TimelineEntry(step=106, event="Transfer back to A (from D)", account_id="A", amount=420000)], parties=[Party(account_id="A", role=PartyRole.SUBJECT, total_amount=870000), Party(account_id="B", role=PartyRole.INTERMEDIARY, total_amount=890000), Party(account_id="C", role=PartyRole.INTERMEDIARY, total_amount=870000), Party(account_id="D", role=PartyRole.INTERMEDIARY, total_amount=850000)], total_amount=1740000, pattern_type=PatternType.CIRCULAR, narrative=f"Account {account_id} is the subject of a circular transaction pattern involving accounts A, B, C, and D. Funds totaling approximately 1.74 million were transferred in a closed loop over 6 hours (steps 100-106), with each transfer slightly smaller than the last (classic layering signature). This pattern is consistent with money laundering layering activity.", sar_fields=SARFields(filing_reason="Suspected layering via circular transactions", suspicious_activity_type="structuring", reporting_institution="EGY-Sentinel AML (capstone)", subject_info=f"Account {account_id}"), generated_at=now)
    explanation = Explanation(case_id=case.case_id, explanation_text=f"Account {account_id} has been flagged as high-risk due to a circular transaction pattern involving four accounts (A, B, C, D). The total amount of 1.74 million transferred in a closed loop over 6 hours is a classic money-laundering layering signature. The risk score of 85/100 reflects both the pattern detection and the unusual transaction amounts. We recommend immediate investigation and potential filing of a Suspicious Activity Report.", citations=[Citation(type=CitationType.PATTERN, value="Circular transaction A->B->C->D->A"), Citation(type=CitationType.ANOMALY, value="Total amount 1.74M in 6 hours"), Citation(type=CitationType.SCORE, value="Risk score 85/100 (high band)")], confidence=0.87, generated_at=now)

    return InvestigateResponse(alert=alert, case=case, explanation=explanation)

@app.post("/case", response_model=CaseResponse, tags=["agents"])
async def build_case(req: CaseRequest):
    """Build a case report only. STUB — REMOVE ON DAY 5."""
    invest_response = await investigate(InvestigateRequest(account_id=req.account_id))
    return CaseResponse(case=invest_response.case)

@app.get("/", tags=["system"])
async def root():
    return {"service": "EGY-Sentinel AML API", "version": "0.2.0", "docs": "/docs", "health": "/health"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("egysentinel.api.main:app", host="0.0.0.0", port=8000, reload=True)
