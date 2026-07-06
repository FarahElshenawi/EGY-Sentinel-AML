"""EGY-Sentinel AML — Pydantic Models (aligned with locked schemas)"""
from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

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

class Account(BaseModel):
    account_id: str = Field(...)
    in_degree: Optional[int] = Field(None)
    out_degree: Optional[int] = Field(None)
    pattern_count: Optional[int] = Field(0)
    risk_score: float = Field(..., ge=0, le=100)
    risk_band: RiskBand = Field(...)

class Transaction(BaseModel):
    txn_id: str = Field(...)
    step: int = Field(..., ge=1, le=743)
    type: TransactionType = Field(...)
    amount: float = Field(..., ge=0)
    nameOrig: str = Field(...)
    nameDest: str = Field(...)
    oldbalanceOrg: float = Field(0.0)
    newbalanceOrig: float = Field(0.0)
    oldbalanceDest: float = Field(0.0)
    newbalanceDest: float = Field(0.0)
    isFraud: int = Field(0, ge=0, le=1)

class Alert(BaseModel):
    account_id: str = Field(...)
    risk_score: float = Field(..., ge=0, le=100)
    risk_band: RiskBand = Field(...)
    pattern_type: PatternType = Field(...)
    priority: AlertPriority = Field(...)
    summary: str = Field(..., max_length=200)
    recommended_action: str = Field(...)
    timestamp: Optional[datetime] = Field(None)

class TimelineEntry(BaseModel):
    step: int = Field(...)
    event: str = Field(...)
    account_id: str = Field(...)
    amount: float = Field(...)

class Party(BaseModel):
    account_id: str = Field(...)
    role: PartyRole = Field(...)
    total_amount: float = Field(...)

class SARFields(BaseModel):
    filing_reason: str = Field(...)
    suspicious_activity_type: str = Field(...)
    reporting_institution: Optional[str] = Field(None)
    subject_info: Optional[str] = Field(None)

class CaseReport(BaseModel):
    case_id: str = Field(...)
    account_id: str = Field(...)
    alert_id: str = Field(...)
    timeline: List[TimelineEntry] = Field(...)
    parties: List[Party] = Field(...)
    total_amount: float = Field(...)
    pattern_type: PatternType = Field(...)
    narrative: str = Field(...)
    sar_fields: SARFields = Field(...)
    generated_at: Optional[datetime] = Field(None)

class Citation(BaseModel):
    type: CitationType = Field(...)
    value: str = Field(...)

class Explanation(BaseModel):
    case_id: str = Field(...)
    explanation_text: str = Field(..., min_length=100, max_length=1000)
    citations: List[Citation] = Field(..., min_items=1)
    confidence: float = Field(..., ge=0, le=1)
    generated_at: Optional[datetime] = Field(None)

class GraphNode(BaseModel):
    id: str
    label: str
    risk_score: float = 0.0
    risk_band: RiskBand = RiskBand.LOW
    type: str = "unknown"

class GraphEdge(BaseModel):
    source: str
    target: str
    amount: float
    type: TransactionType
    step: int
    isFraud: int = 0

class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    stats: dict = {}

class DetectResponse(BaseModel):
    patterns: List[dict] = Field(...)
    total_patterns: int = Field(...)
    accounts_flagged: List[str] = Field(...)

class ScoreRequest(BaseModel):
    account_id: str

class ScoreResponse(BaseModel):
    account: Account

class InvestigateRequest(BaseModel):
    account_id: str

class InvestigateResponse(BaseModel):
    alert: Alert
    case: CaseReport
    explanation: Explanation

class CaseRequest(BaseModel):
    account_id: str
    alert_id: Optional[str] = None

class CaseResponse(BaseModel):
    case: CaseReport

class HealthResponse(BaseModel):
    status: str = "ok"
    version: str
    timestamp: datetime
