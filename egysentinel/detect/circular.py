"""
EGY-Sentinel AML — Circular Pattern Detector (DS-2)
====================================================

Detects circular transaction patterns: A -> B -> C -> D -> A
where funds flow in a closed loop and return to the originator.

Classic money-laundering layering signature. Each transfer in the
loop is typically slightly smaller than the last (skimming), but
we detect the structural pattern regardless of amounts.

Algorithm:
    Uses NetworkX simple_cycles() to find all elementary cycles
    (no repeated nodes) of length 3-6. Cycles of length 2 (A->B->A)
    are excluded as they're usually just transfers back. Cycles
    longer than 6 are excluded as they're rare in real laundering
    and produce noisy output.

    For each cycle, we compute:
    - score_raw: confidence based on cycle length and total amount
    - evidence: cycle_length, accounts, total_amount, steps, amounts

Public API:
    detect_circular(G, min_len=3, max_len=6) -> list[dict]
"""
from __future__ import annotations

import logging
from typing import Any

import networkx as nx

logger = logging.getLogger(__name__)


def detect_circular(
    G: nx.MultiDiGraph,
    min_len: int = 3,
    max_len: int = 6,
) -> list[dict[str, Any]]:
    """Detect circular transaction patterns in the graph.

    Args:
        G: NetworkX MultiDiGraph from build_digraph().
        min_len: Minimum cycle length (default 3).
        max_len: Maximum cycle length (default 6).

    Returns:
        List of pattern dicts, each with:
        - detector: "circular"
        - accounts: list of account IDs in the cycle (in order)
        - score_raw: float 0.0-1.0 (confidence)
        - evidence: dict with cycle_length, total_amount, steps, amounts
    """
    if G is None or G.number_of_nodes() == 0:
        return []

    # Convert MultiDiGraph to DiGraph for cycle detection
    # (simple_cycles doesn't work on MultiDiGraph directly)
    # If multiple edges exist between same nodes, keep the one with
    # the highest amount
    simple_G = nx.DiGraph()
    edge_amounts: dict[tuple, float] = {}
    edge_data_map: dict[tuple, dict] = {}
    for u, v, data in G.edges(data=True):
        key = (u, v)
        if key not in edge_amounts or data["amount"] > edge_amounts[key]:
            edge_amounts[key] = data["amount"]
            edge_data_map[key] = data
    for (u, v), data in edge_data_map.items():
        simple_G.add_edge(u, v, **data)

    patterns: list[dict[str, Any]] = []
    seen_cycles: set[tuple] = set()

    try:
        cycles = nx.simple_cycles(simple_G)
    except Exception as e:
        logger.warning(f"simple_cycles failed: {e}")
        return []

    for cycle in cycles:
        if not (min_len <= len(cycle) <= max_len):
            continue

        # Normalize: rotate so smallest account ID is first, to dedupe
        min_idx = cycle.index(min(cycle))
        normalized = tuple(cycle[min_idx:] + cycle[:min_idx])
        if normalized in seen_cycles:
            continue
        seen_cycles.add(normalized)

        # Verify each edge in the cycle exists and gather evidence
        edge_data = []
        valid = True
        for i in range(len(cycle)):
            u = cycle[i]
            v = cycle[(i + 1) % len(cycle)]
            if not simple_G.has_edge(u, v):
                valid = False
                break
            edge_data.append(simple_G[u][v])

        if not valid or len(edge_data) != len(cycle):
            continue

        # Compute evidence
        amounts = [e["amount"] for e in edge_data]
        steps = [e["step"] for e in edge_data]
        total_amount = sum(amounts)

        # Score: longer cycles are slightly more suspicious (more layers)
        # but we cap at max_len
        length_score = min(len(cycle) / max_len, 1.0)
        # Higher amounts = more suspicious
        amount_score = min(total_amount / 1_000_000, 1.0)
        # Fraud-labeled edges boost score
        fraud_edges = sum(1 for e in edge_data if e.get("isFraud", 0) == 1)
        fraud_score = fraud_edges / len(edge_data)

        score_raw = round(0.4 * length_score + 0.4 * amount_score + 0.2 * fraud_score, 3)

        patterns.append({
            "detector": "circular",
            "accounts": list(cycle),
            "score_raw": score_raw,
            "evidence": {
                "cycle_length": len(cycle),
                "total_amount": round(total_amount, 2),
                "amounts": [round(a, 2) for a in amounts],
                "steps": steps,
                "fraud_edges": fraud_edges,
            },
        })

    # Sort by score descending
    patterns.sort(key=lambda p: p["score_raw"], reverse=True)

    logger.info(f"Detected {len(patterns)} circular patterns")
    return patterns
