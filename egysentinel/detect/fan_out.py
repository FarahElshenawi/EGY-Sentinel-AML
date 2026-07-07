"""
EGY-Sentinel AML — Fan-Out Pattern Detector (DS-2)
===================================================

Detects fan-out (smurfing) patterns: one sender disburses funds to
many different receivers in a short time window, typically with
amounts just below reporting thresholds.

Classic money-laundering structuring signature.

Algorithm:
    For each account, group its outgoing transactions by step (1-hour
    window). If an account sends to >= threshold different receivers
    in the same step, flag it as a fan-out pattern.

    Default threshold: 5 receivers in one step.
    Default ratio threshold: 0.6 (60% of receivers get similar amounts,
    indicating structured smurfing).

Public API:
    detect_fan_out(G, threshold=5, ratio=0.6) -> list[dict]
"""
from __future__ import annotations

import logging
from collections import defaultdict
from typing import Any

import networkx as nx

logger = logging.getLogger(__name__)


def detect_fan_out(
    G: nx.MultiDiGraph,
    threshold: int = 5,
    ratio: float = 0.6,
) -> list[dict[str, Any]]:
    """Detect fan-out (smurfing) patterns in the graph.

    Args:
        G: NetworkX MultiDiGraph from build_digraph().
        threshold: Minimum number of distinct receivers in one step
                   to trigger detection (default 5).
        ratio: Minimum fraction of receivers that should receive
               similar amounts (within 20% of each other) to confirm
               structured smurfing (default 0.6).

    Returns:
        List of pattern dicts, each with:
        - detector: "fan_out"
        - accounts: [sender, receiver1, receiver2, ...]
        - score_raw: float 0.0-1.0 (confidence)
        - evidence: dict with sender, receivers, step, amounts,
                    threshold_met, structuring_ratio
    """
    if G is None or G.number_of_nodes() == 0:
        return []

    # Group outgoing edges by (sender, step)
    # out_edges[sender][step] = [(dest, amount, edge_data), ...]
    out_edges: dict[str, dict[int, list[tuple[str, float, dict]]]] = defaultdict(
        lambda: defaultdict(list)
    )

    for u, v, data in G.edges(data=True):
        out_edges[u][data["step"]].append((v, data["amount"], data))

    patterns: list[dict[str, Any]] = []

    for sender, steps in out_edges.items():
        for step, edges in steps.items():
            # Count distinct receivers
            receivers = [(dest, amt, data) for dest, amt, data in edges]
            distinct_receivers = set(r[0] for r in receivers)

            if len(distinct_receivers) < threshold:
                continue

            # Check structuring ratio: how many receivers got similar amounts?
            amounts = [r[1] for r in receivers]
            if not amounts:
                continue

            # Define "similar" as within 20% of the median amount
            median_amount = sorted(amounts)[len(amounts) // 2]
            if median_amount > 0:
                similar_count = sum(
                    1 for a in amounts
                    if abs(a - median_amount) / median_amount <= 0.2
                )
                structuring_ratio = similar_count / len(amounts)
            else:
                structuring_ratio = 0.0

            # Only flag if structuring ratio is high enough
            if structuring_ratio < ratio:
                continue

            # Compute score
            receiver_score = min(len(distinct_receivers) / 10, 1.0)  # more receivers = higher
            structuring_score = structuring_ratio  # already 0-1
            amount_score = min(sum(amounts) / 1_000_000, 1.0)
            fraud_score = sum(1 for r in receivers if r[2].get("isFraud", 0) == 1) / len(receivers)

            score_raw = round(
                0.3 * receiver_score + 0.3 * structuring_score +
                0.2 * amount_score + 0.2 * fraud_score, 3
            )

            # Build receivers list sorted by amount descending
            receivers_sorted = sorted(receivers, key=lambda r: r[1], reverse=True)

            patterns.append({
                "detector": "fan_out",
                "accounts": [sender] + [r[0] for r in receivers_sorted],
                "score_raw": score_raw,
                "evidence": {
                    "sender": sender,
                    "receivers": [r[0] for r in receivers_sorted],
                    "step": step,
                    "amounts": [round(r[1], 2) for r in receivers_sorted],
                    "total_amount": round(sum(amounts), 2),
                    "receiver_count": len(distinct_receivers),
                    "threshold_met": len(distinct_receivers),
                    "structuring_ratio": round(structuring_ratio, 3),
                },
            })

    # Sort by score descending
    patterns.sort(key=lambda p: p["score_raw"], reverse=True)

    logger.info(f"Detected {len(patterns)} fan-out patterns")
    return patterns
