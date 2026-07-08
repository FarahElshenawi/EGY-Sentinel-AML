"""EGY-Sentinel AML — Case Store & Decision API

Persistence layer for case decisions. In-memory for the capstone demo;
would be a real database table in production.

Each case decision is recorded with:
- case_id (from the investigation)
- account_id
- decision: escalate | close | needs_review | generate_report
- reason: required for escalate and close
- actor: who made the decision
- timestamp: when

All decisions are appended to an in-memory list and also written to
data/decisions.jsonl for persistence across restarts.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/cases", tags=["decisions"])

# In-memory store + JSONL persistence
DECISIONS_PATH = Path(__file__).resolve().parents[2] / "data" / "decisions.jsonl"
_decisions: list[dict[str, Any]] = []


def _load_decisions() -> None:
    """Load decisions from JSONL file on startup."""
    global _decisions
    if DECISIONS_PATH.exists():
        _decisions = []
        with open(DECISIONS_PATH) as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        _decisions.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass
        logger.info(f"Loaded {len(_decisions)} decisions from {DECISIONS_PATH}")


def _append_decision(decision: dict[str, Any]) -> None:
    """Append a decision to the in-memory store and JSONL file."""
    _decisions.append(decision)
    DECISIONS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(DECISIONS_PATH, "a") as f:
        f.write(json.dumps(decision) + "\n")


# Load on module import
_load_decisions()


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class DecisionRequest(BaseModel):
    case_id: str = Field(..., description="The case ID from the investigation")
    account_id: str = Field(..., description="The account being decided on")
    decision: str = Field(..., description="escalate | close | needs_review | generate_report")
    reason: str = Field(..., min_length=3, max_length=500, description="Required reason for the decision")
    detail: str | None = Field(None, max_length=2000, description="Optional additional context")
    actor: str = Field("investigator", description="Who made the decision")


class DecisionResponse(BaseModel):
    id: str
    case_id: str
    account_id: str
    decision: str
    reason: str
    detail: str | None
    actor: str
    timestamp: str
    status: str = "recorded"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

VALID_DECISIONS = {"escalate", "close", "needs_review", "generate_report"}


@router.post("/decide", response_model=DecisionResponse)
async def record_decision(req: DecisionRequest):
    """Record a case decision (escalate, close, needs review, generate report).

    All decisions are logged to the audit trail with timestamp and actor.
    The reason field is required — no silent decisions.
    """
    if req.decision not in VALID_DECISIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid decision '{req.decision}'. Must be one of: {VALID_DECISIONS}",
        )

    if req.decision in ("escalate", "close") and len(req.reason.strip()) < 3:
        raise HTTPException(
            status_code=400,
            detail=f"Reason is required for '{req.decision}' decisions (min 3 characters).",
        )

    decision_id = f"DEC-{len(_decisions) + 1:06d}"
    timestamp = datetime.now(timezone.utc).isoformat()

    record = {
        "id": decision_id,
        "case_id": req.case_id,
        "account_id": req.account_id,
        "decision": req.decision,
        "reason": req.reason,
        "detail": req.detail,
        "actor": req.actor,
        "timestamp": timestamp,
    }

    _append_decision(record)
    logger.info(f"Decision recorded: {decision_id} — {req.decision} on {req.case_id} by {req.actor}")

    return DecisionResponse(**record, status="recorded")


@router.get("/decisions")
async def list_decisions(case_id: str | None = None, account_id: str | None = None):
    """List all decisions, optionally filtered by case_id or account_id."""
    results = _decisions
    if case_id:
        results = [d for d in results if d["case_id"] == case_id]
    if account_id:
        results = [d for d in results if d["account_id"] == account_id]
    return {"decisions": results, "total": len(results)}


@router.get("/decisions/{case_id}")
async def get_decisions_for_case(case_id: str):
    """Get all decisions for a specific case."""
    results = [d for d in _decisions if d["case_id"] == case_id]
    return {"case_id": case_id, "decisions": results, "total": len(results)}
