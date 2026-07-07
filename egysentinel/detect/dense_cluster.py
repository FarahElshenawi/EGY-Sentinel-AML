"""
EGY-Sentinel AML — Dense Cluster Detector (DS-2)
=================================================

Detects dense clusters of accounts that transact heavily among
themselves — a signature of coordinated money-laundering activity.

Algorithm:
    Uses NetworkX's Louvain community detection on the undirected
    projection of the graph. For each detected community:
    - If it has >= min_nodes accounts (default 4)
    - And the internal density (edges between members / max possible)
      is >= density threshold (default 0.5)
    Then flag it as a dense cluster.

    Density = actual_edges / (n * (n-1)) for n nodes.
    A fully-connected 5-node cluster has 5*4=20 possible directed
    edges, density 1.0. Our threshold of 0.5 means at least 10 edges.

Public API:
    detect_dense_cluster(G, min_nodes=4, density=0.5) -> list[dict]
"""
from __future__ import annotations

import logging
from typing import Any

import networkx as nx

logger = logging.getLogger(__name__)


def detect_dense_cluster(
    G: nx.MultiDiGraph,
    min_nodes: int = 4,
    density: float = 0.5,
) -> list[dict[str, Any]]:
    """Detect dense cluster patterns in the graph.

    Args:
        G: NetworkX MultiDiGraph from build_digraph().
        min_nodes: Minimum cluster size (default 4).
        density: Minimum internal density (default 0.5).

    Returns:
        List of pattern dicts, each with:
        - detector: "dense_cluster"
        - accounts: list of account IDs in the cluster
        - score_raw: float 0.0-1.0 (confidence)
        - evidence: dict with cluster_size, internal_edges,
                    density, total_amount, members
    """
    if G is None or G.number_of_nodes() == 0:
        return []

    # Convert to undirected simple graph for community detection
    # MultiDiGraph -> DiGraph -> undirected Graph
    simple_G = nx.DiGraph()
    edge_amounts: dict[tuple, float] = {}
    edge_counts: dict[tuple, int] = {}
    for u, v, data in G.edges(data=True):
        key = (u, v)
        if key in edge_amounts:
            edge_amounts[key] += data["amount"]
            edge_counts[key] += 1
        else:
            edge_amounts[key] = data["amount"]
            edge_counts[key] = 1
    for (u, v), total_amount in edge_amounts.items():
        simple_G.add_edge(u, v, amount=total_amount, edge_count=edge_counts[(u, v)])

    undirected_G = simple_G.to_undirected()

    # Run Louvain community detection
    try:
        communities = nx.community.louvain_communities(undirected_G, seed=42)
    except Exception as e:
        logger.warning(f"Louvain community detection failed: {e}")
        # Fallback: use connected components
        communities = list(nx.connected_components(undirected_G))

    patterns: list[dict[str, Any]] = []

    for community in communities:
        members = list(community)
        if len(members) < min_nodes:
            continue

        # Build the subgraph for this community
        subgraph = simple_G.subgraph(members)

        # Compute internal density
        n = len(members)
        max_possible_edges = n * (n - 1)  # directed
        actual_edges = subgraph.number_of_edges()
        if max_possible_edges == 0:
            continue
        internal_density = actual_edges / max_possible_edges

        if internal_density < density:
            continue

        # Compute total amount flowing within the cluster
        internal_amount = sum(
            data.get("amount", 0)
            for u, v, data in subgraph.edges(data=True)
        )

        # Count fraud-labeled edges in the original MultiDiGraph
        fraud_edges = 0
        total_internal_edges = 0
        for u, v in subgraph.edges():
            if G.has_edge(u, v):
                for _, data in G.get_edge_data(u, v).items():
                    total_internal_edges += 1
                    if data.get("isFraud", 0) == 1:
                        fraud_edges += 1

        # Score: density is the primary signal
        density_score = internal_density  # already 0-1
        size_score = min(n / 10, 1.0)  # larger clusters slightly more suspicious
        amount_score = min(internal_amount / 2_000_000, 1.0)
        fraud_score = (fraud_edges / total_internal_edges) if total_internal_edges > 0 else 0

        score_raw = round(
            0.4 * density_score + 0.2 * size_score +
            0.2 * amount_score + 0.2 * fraud_score, 3
        )

        patterns.append({
            "detector": "dense_cluster",
            "accounts": members,
            "score_raw": score_raw,
            "evidence": {
                "cluster_size": n,
                "internal_edges": actual_edges,
                "max_possible_edges": max_possible_edges,
                "density": round(internal_density, 3),
                "total_amount": round(internal_amount, 2),
                "fraud_edges": fraud_edges,
                "members": members,
            },
        })

    # Sort by score descending
    patterns.sort(key=lambda p: p["score_raw"], reverse=True)

    logger.info(f"Detected {len(patterns)} dense cluster patterns")
    return patterns
