"""
EGY-Sentinel AML — Pydantic Models
===================================
Generated from schemas/*.json (locked at v0.1-schemas-locked).
DO NOT edit these without bumping the schema version AND notifying all consumers.

These models are the single source of truth for request/response shapes
across the FastAPI service. The frontend (Next.js/Streamlit) and all agent
modules MUST import from here — never define their own versions.
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


# ─────────────────────────────────────────────────────────────────────────────
# ENUMS
# ─────────────────────────────────────────────────────────────────────────────

class TransactionType(str, Enum):
    CASH_IN = "CASH_IN"
    CASH_OUT = "CASH_OUT"
    DEBIT = "DEBIT"
    PAYMENT = "PAYMENT"
    TRANSFER = "TRANSFER"


class RiskBand(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class AlertPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class PatternType(str, Enum):
    CIRCULAR = "circular"
    FAN_OUT = "fan_out"
    FAN_IN = "fan_in"
    LAYERING = "layering"
    DENSE_CLUSTER = "dense_cluster"
    NONE = "none"


class PartyRole(str, Enum):
    SENDER = "sender"
    RECEIVER = "receiver"
    INTERMEDIARY = "intermediary"
    SUBJECT = "subject"


class CitationType(str, Enum):
    PATTERN = "pattern"
    ANOMALY = "anomaly"
    SCORE = "score"
    TRANSACTION = "transaction"


# ─────────────────────────────────────────────────────────────────────────────
# CORE MODELS (from schemas/)
# ─────────────────────────────────────────────────────────────────────────────

class Account(BaseModel):
    """Node in the transaction graph. See schemas/account.json."""
    account_id: str
    type: str = "unknown"
    in_degree: Optional[int] = None
    out_degree: Optional[int] = None
    risk_score: float = Field(ge=0, le=100)
    risk_band: RiskBand
    pattern_count: Optional[int] = None


class Transaction(BaseModel):
    """Edge in the transaction graph. See schemas/transaction.json."""
    txn_id: str
    step: int = Field(ge=1, le=743)
    type: TransactionType
    amount: float = Field(ge=0)
    nameOrig: str
    nameDest: str
    oldbalanceOrg: float = 0.0
    newbalanceOrig: float = 0.0
    oldbalanceDest: float = 0.0
    newbalanceDest: float = 0.0
    isFraud: int = Field(0, ge=0, le=1)
    isFlaggedFraud: int = Field(0, ge=0, le=1)


class Alert(BaseModel):
    """Output of the Alert Agent. See schemas/alert.json."""
    account_id: str
    risk_score: float = Field(ge=0, le=100)
    risk_band: RiskBand
    pattern_type: PatternType
    priority: AlertPriority
    summary: str = Field(max_length=200)
    recommended_action: str
    timestamp: Optional[datetime] = None


class TimelineEntry(BaseModel):
    step: int
    event: str
    account_id: str
    amount: float


class Party(BaseModel):
    account_id: str
    role: PartyRole
    total_amount: float


class SARFields(BaseModel):
    filing_reason: str
    suspicious_activity_type: str
    reporting_institution: Optional[str] = None
    subject_info: Optional[str] = None


class CaseReport(BaseModel):
    """Output of the Case Builder Agent. See schemas/case_report.json."""
    case_id: str
    account_id: str
    alert_id: str
    timeline: List[TimelineEntry]
    parties: List[Party]
    total_amount: float
    pattern_type: PatternType
    narrative: str
    sar_fields: SARFields
    generated_at: Optional[datetime] = None


class Citation(BaseModel):
    type: CitationType
    value: str


class Explanation(BaseModel):
    """Output of the Explanation Agent. See schemas/explanation.json."""
    case_id: str
    explanation_text: str = Field(min_length=100, max_length=1000)
    citations: List[Citation] = Field(min_items=1)
    confidence: float = Field(ge=0, le=1)
    generated_at: Optional[datetime] = None


# ─────────────────────────────────────────────────────────────────────────────
# API REQUEST/RESPONSE WRAPPERS
# ─────────────────────────────────────────────────────────────────────────────

class GraphNode(BaseModel):
    """Node in the /graph response — for the frontend visualization."""
    id: str
    label: str
    risk_score: float = 0.0
    risk_band: RiskBand = RiskBand.LOW
    type: str = "unknown"


class GraphEdge(BaseModel):
    """Edge in the /graph response — for the frontend visualization."""
    source: str
    target: str
    amount: float
    type: TransactionType
    step: int
    isFraud: int = 0


class GraphResponse(BaseModel):
    """Response for GET /graph — feeds the frontend graph visualization."""
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    stats: dict = Field(default_factory=dict, description="Graph stats: node_count, edge_count, etc.")


class DetectRequest(BaseModel):
    """Request for POST /detect — run pattern detectors on uploaded transactions."""
    transactions: List[Transaction]


class DetectResponse(BaseModel):
    """Response for POST /detect — list of suspicious patterns found."""
    patterns: List[dict] = Field(description="Each pattern: {type, accounts, edges, description}")
    total_patterns: int
    accounts_flagged: List[str]


class ScoreRequest(BaseModel):
    """Request for POST /score — compute risk score for an account."""
    account_id: str


class ScoreResponse(BaseModel):
    """Response for POST /score — the account's risk assessment."""
    account: Account


class InvestigateRequest(BaseModel):
    """Request for POST /investigate — run the full agent pipeline on an account."""
    account_id: str


class InvestigateResponse(BaseModel):
    """Response for POST /investigate — alert + case + explanation, all in one call."""
    alert: Alert
    case: CaseReport
    explanation: Explanation


class CaseRequest(BaseModel):
    """Request for POST /case — build a case report for an account (without alert/explanation)."""
    account_id: str
    alert_id: Optional[str] = None


class CaseResponse(BaseModel):
    """Response for POST /case."""
    case: CaseReport


class HealthResponse(BaseModel):
    """Response for GET /health."""
    status: str = "ok"
    version: str
    timestamp: datetime
