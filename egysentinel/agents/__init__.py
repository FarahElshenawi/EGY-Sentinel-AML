"""GLM-powered agentic AI layer (Alert, Case Builder, Explanation, Orchestrator).

Public API:
    from egysentinel.agents import (
        generate_alert,           # AI-2
        build_case, assemble_evidence,  # AI-3
        generate_explanation,     # AI-4
        investigate,              # AI-1 (orchestrator)
    )
"""
from .alert_agent import generate_alert, get_alert_fallback          # AI-2
from .case_builder_agent import build_case, build_case_stub, validate_case_report  # AI-3
from .evidence import assemble_evidence                                # AI-3
from .explanation_agent import generate_explanation, get_explanation_fallback  # AI-4
from .orchestrator import investigate, investigate_response, investigate_batch  # AI-1

__all__ = [
    "generate_alert",
    "get_alert_fallback",
    "build_case",
    "build_case_stub",
    "validate_case_report",
    "assemble_evidence",
    "generate_explanation",
    "get_explanation_fallback",
    "investigate",
    "investigate_response",
    "investigate_batch",
]
