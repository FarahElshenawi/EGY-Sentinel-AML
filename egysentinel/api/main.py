"""
EGY-Sentinel AML — FastAPI Service
====================================
Day 1 skeleton. All endpoints return stubs.
Real wiring happens on Day 5 (agents) and Day 5 (DS integration).

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
    # Core models
    Account, Transaction, Alert, CaseReport, Explanation,
    Citation, CitationType, SARFields, TimelineEntry, Party, PartyRole,
    # Enums
    RiskBand, AlertPriority, PatternType, TransactionType,
    # Request/Response wrappers
    GraphNode, GraphEdge, GraphResponse,
    DetectRequest, DetectResponse,
    ScoreRequest, ScoreResponse,
    InvestigateRequest, InvestigateResponse,
    CaseRequest, CaseResponse,
    HealthResponse,
)

# ─────────────────────────────────────────────────────────────────────────────
# APP SETUP
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="EGY-Sentinel AML API",
    description="""
AI-Powered Financial Surveillance & Fraud Intelligence System.

**Endpoints:**
- `GET /health` — service health check
- `POST /detect` — run pattern detectors on transactions
- `POST /score` — compute risk score for an account
- `POST /investigate` — run full agent pipeline (alert + case + explanation)
- `POST /case` — build a case report only
- `GET /graph` — get graph data for frontend visualization
    """,
    version="0.1.0",
)

# CORS — allow the frontend (Next.js on :3000 or Streamlit on :8501)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8501", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────────────
# HEALTH
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health():
    """Service health check."""
    return HealthResponse(
        status="ok",
        version="0.1.0",
        timestamp=datetime.utcnow(),
    )


# ─────────────────────────────────────────────────────────────────────────────
# /graph — for the frontend visualization
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/graph", response_model=GraphResponse, tags=["graph"])
async def get_graph():
    """
    Get graph data (nodes + edges) for frontend visualization.

    **STUB** — returns a small synthetic graph for now.
    Day 2: replace with call to DS-2's `build_digraph(df)` + serialization.
    """
    # TODO Day 2: replace with real data from DS-2's graph module
    # from egysentinel.graph.build import build_digraph, serialize_graph
    # return serialize_graph(build_digraph())

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
    return GraphResponse(
        nodes=nodes,
        edges=edges,
        stats={"node_count": len(nodes), "edge_count": len(edges), "note": "STUB data — real graph wired on Day 2"},
    )


# ─────────────────────────────────────────────────────────────────────────────
# /detect — run pattern detectors
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/detect", response_model=DetectResponse, tags=["detection"])
async def detect_patterns(req: DetectRequest):
    """
    Run pattern detectors on a list of transactions.

    **STUB** — returns one fake circular pattern.
    Day 4: replace with call to DS-2's `detect_all(graph)`.
    """
    # TODO Day 4: replace with real detector call
    # from egysentinel.detect import detect_all
    # from egysentinel.graph.build import build_digraph
    # graph = build_digraph(req.transactions)
    # patterns = detect_all(graph)
    # return DetectResponse(patterns=patterns, ...)

    fake_pattern = {
        "type": "circular",
        "accounts": ["A", "B", "C", "D"],
        "edges": [
            {"source": "A", "target": "B", "amount": 450000},
            {"source": "B", "target": "C", "amount": 440000},
            {"source": "C", "target": "D", "amount": 430000},
            {"source": "D", "target": "A", "amount": 420000},
        ],
        "description": "STUB: Circular transaction pattern A→B→C→D→A",
    }
    return DetectResponse(
        patterns=[fake_pattern],
        total_patterns=1,
        accounts_flagged=["A", "B", "C", "D"],
    )


# ─────────────────────────────────────────────────────────────────────────────
# /score — compute risk score
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/score", response_model=ScoreResponse, tags=["scoring"])
async def score_account(req: ScoreRequest):
    """
    Compute risk score for an account.

    **STUB** — returns a high-risk score for any account starting with 'A', 'B', 'C', 'D'.
    Day 5: replace with call to DS-3's `combine_score(account_id)`.
    """
    # TODO Day 5: replace with real scorer call
    # from egysentinel.score.combine import combine_score
    # account = combine_score(req.account_id)
    # return ScoreResponse(account=account)

    # Stub logic: accounts A-D are high risk, everything else is low
    high_risk_accounts = {"A", "B", "C", "D"}
    if req.account_id in high_risk_accounts:
        return ScoreResponse(account=Account(
            account_id=req.account_id,
            risk_score=85.0,
            risk_band=RiskBand.HIGH,
            pattern_count=1,
        ))
    else:
        return ScoreResponse(account=Account(
            account_id=req.account_id,
            risk_score=15.0,
            risk_band=RiskBand.LOW,
            pattern_count=0,
        ))


# ─────────────────────────────────────────────────────────────────────────────
# /investigate — full agent pipeline
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/investigate", response_model=InvestigateResponse, tags=["agents"])
async def investigate(req: InvestigateRequest):
    """
    Run the full agent pipeline on an account:
    1. Alert Agent → generates alert
    2. Case Builder Agent → generates case report
    3. Explanation Agent → generates explanation

    **STUB** — returns placeholder agent responses.
    Day 5: replace with call to AI-1's `orchestrator.investigate(account_id)`.
    """
    # TODO Day 5: replace with real orchestrator call
    # from egysentinel.agents.orchestrator import investigate as real_investigate
    # return real_investigate(req.account_id)

    now = datetime.utcnow()
    account_id = req.account_id
    high_risk_accounts = {"A", "B", "C", "D"}

    if account_id not in high_risk_accounts:
        raise HTTPException(
            status_code=404,
            detail=f"Account {account_id} not found or not high-risk. Try one of: A, B, C, D (stub data)."
        )

    # STUB alert
    alert = Alert(
        account_id=account_id,
        risk_score=85.0,
        risk_band=RiskBand.HIGH,
        pattern_type=PatternType.CIRCULAR,
        priority=AlertPriority.HIGH,
        summary=f"High-risk circular transaction pattern detected for account {account_id}",
        recommended_action="investigate",
        timestamp=now,
    )

    # STUB case report
    case = CaseReport(
        case_id=f"STUB-CASE-{account_id}",
        account_id=account_id,
        alert_id=f"STUB-ALERT-{account_id}",
        timeline=[
            TimelineEntry(step=100, event="Transfer to B", account_id="B", amount=450000),
            TimelineEntry(step=102, event="Transfer to C (from B)", account_id="C", amount=440000),
            TimelineEntry(step=104, event="Transfer to D (from C)", account_id="D", amount=430000),
            TimelineEntry(step=106, event="Transfer back to A (from D)", account_id="A", amount=420000),
        ],
        parties=[
            Party(account_id="A", role=PartyRole.SUBJECT, total_amount=870000),
            Party(account_id="B", role=PartyRole.INTERMEDIARY, total_amount=890000),
            Party(account_id="C", role=PartyRole.INTERMEDIARY, total_amount=870000),
            Party(account_id="D", role=PartyRole.INTERMEDIARY, total_amount=850000),
        ],
        total_amount=1740000,
        pattern_type=PatternType.CIRCULAR,
        narrative=(
            f"Account {account_id} is the subject of a circular transaction pattern "
            f"involving accounts A, B, C, and D. Funds totaling approximately 1.74 million "
            f"were transferred in a closed loop over 6 hours (steps 100-106), with each "
            f"transfer slightly smaller than the last (classic layering signature). "
            f"This pattern is consistent with money laundering layering activity."
        ),
        sar_fields=SARFields(
            filing_reason="Suspected layering via circular transactions",
            suspicious_activity_type="structuring",
            reporting_institution="EGY-Sentinel AML (capstone)",
            subject_info=f"Account {account_id}",
        ),
        generated_at=now,
    )

    # STUB explanation
    explanation = Explanation(
        case_id=case.case_id,
        explanation_text=(
            f"Account {account_id} has been flagged as high-risk due to a circular transaction "
            f"pattern involving four accounts (A, B, C, D). The total amount of 1.74 million "
            f"transferred in a closed loop over 6 hours is a classic money-laundering layering "
            f"signature. The risk score of 85/100 reflects both the pattern detection and the "
            f"unusual transaction amounts. We recommend immediate investigation and potential "
            f"filing of a Suspicious Activity Report."
        ),
        citations=[
            Citation(type=CitationType.PATTERN, value="Circular transaction A→B→C→D→A"),
            Citation(type=CitationType.ANOMALY, value="Total amount 1.74M in 6 hours"),
            Citation(type=CitationType.SCORE, value="Risk score 85/100 (high band)"),
        ],
        confidence=0.87,
        generated_at=now,
    )

    return InvestigateResponse(
        alert=alert,
        case=case,
        explanation=explanation,
    )


# ─────────────────────────────────────────────────────────────────────────────
# /case — build a case report only (without alert/explanation)
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/case", response_model=CaseResponse, tags=["agents"])
async def build_case(req: CaseRequest):
    """
    Build a case report for an account (without the alert and explanation).

    Useful for the frontend when you only want the case details.

    **STUB** — returns the same case as /investigate but standalone.
    Day 5: replace with call to AI-3's `case_builder_agent.build_case(account_id)`.
    """
    # TODO Day 5: replace with real case builder call
    # from egysentinel.agents.case_builder_agent import build_case as real_build_case
    # return CaseResponse(case=real_build_case(req.account_id, req.alert_id))

    # Reuse the stub logic from /investigate
    invest_response = await investigate(InvestigateRequest(account_id=req.account_id))
    return CaseResponse(case=invest_response.case)


# ─────────────────────────────────────────────────────────────────────────────
# ROOT — redirect to docs
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/", tags=["system"])
async def root():
    """Root endpoint — returns service info."""
    return {
        "service": "EGY-Sentinel AML API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("egysentinel.api.main:app", host="0.0.0.0", port=8000, reload=True)
