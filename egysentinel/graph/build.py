"""
EGY-Sentinel AML — Graph Builder (DS-2)
========================================

Builds a NetworkX DiGraph from a PaySim-format DataFrame.

Nodes = accounts (nameOrig / nameDest values)
Edges = transactions, with attributes:
    txn_id, amount, type, step, isFraud,
    oldbalanceOrg, newbalanceOrig, oldbalanceDest, newbalanceDest

Multi-edges are allowed (same sender -> same receiver multiple times)
because PaySim has many transactions between the same accounts. We use
nx.MultiDiGraph to preserve every transaction as a separate edge.

Public API:
    build_digraph(df) -> nx.MultiDiGraph
    get_account_subgraph(G, account_id, hops=1) -> nx.MultiDiGraph
    get_flagged_subgraph(G, flagged_accounts) -> nx.MultiDiGraph
"""
from __future__ import annotations

import logging
from typing import Iterable

import networkx as nx
import pandas as pd

logger = logging.getLogger(__name__)


def build_digraph(df: pd.DataFrame) -> nx.MultiDiGraph:
    """Build a directed graph from a PaySim-format DataFrame.

    Each row in the DataFrame becomes one directed edge from nameOrig
    to nameDest. All PaySim columns are attached as edge attributes.

    Args:
        df: PaySim-format DataFrame with at minimum:
            step, type, amount, nameOrig, nameDest,
            oldbalanceOrg, newbalanceOrig, oldbalanceDest, newbalanceDest,
            isFraud

    Returns:
        nx.MultiDiGraph where:
        - Nodes are account IDs (strings)
        - Each edge has attrs: txn_id, amount, type, step, isFraud,
          oldbalanceOrg, newbalanceOrig, oldbalanceDest, newbalanceDest
        - Node attrs: in_degree, out_degree (computed after build)
    """
    if df is None or df.empty:
        logger.warning("Empty DataFrame — returning empty graph")
        return nx.MultiDiGraph()

    G = nx.MultiDiGraph()

    # Add all transactions as edges with full attributes
    for idx, row in df.iterrows():
        orig = str(row["nameOrig"])
        dest = str(row["nameDest"])

        # Ensure both nodes exist
        if orig not in G:
            G.add_node(orig)
        if dest not in G:
            G.add_node(dest)

        # Add edge with all attributes
        G.add_edge(
            orig, dest,
            txn_id=f"TXN-{idx:06d}",
            amount=float(row["amount"]),
            type=str(row["type"]),
            step=int(row["step"]),
            isFraud=int(row.get("isFraud", 0)),
            oldbalanceOrg=float(row.get("oldbalanceOrg", 0)),
            newbalanceOrig=float(row.get("newbalanceOrig", 0)),
            oldbalanceDest=float(row.get("oldbalanceDest", 0)),
            newbalanceDest=float(row.get("newbalanceDest", 0)),
        )

    # Compute and attach degree info to each node
    for node in G.nodes():
        G.nodes[node]["in_degree"] = G.in_degree(node)
        G.nodes[node]["out_degree"] = G.out_degree(node)

    logger.info(
        f"Built graph: {G.number_of_nodes()} nodes, "
        f"{G.number_of_edges()} edges"
    )
    return G


def get_account_subgraph(
    G: nx.MultiDiGraph,
    account_id: str,
    hops: int = 1,
) -> nx.MultiDiGraph:
    """Extract a subgraph around a specific account.

    Includes the account plus all accounts within `hops` edges
    (in either direction). Used by /graph endpoint to avoid sending
    the full graph to the browser.

    Args:
        G: The full transaction graph.
        account_id: The center account.
        hops: How many hops to include (1 = direct neighbors only).

    Returns:
        A subgraph as MultiDiGraph.
    """
    if account_id not in G:
        return nx.MultiDiGraph()

    # Use undirected view to find neighbors in both directions
    undirected = G.to_undirected(as_view=True)
    if hops == 1:
        neighbors = {account_id} | set(undirected.neighbors(account_id))
    else:
        # Multi-hop: use shortest path length
        neighbors = {account_id}
        for node in G.nodes():
            try:
                if nx.shortest_path_length(undirected, account_id, node) <= hops:
                    neighbors.add(node)
            except nx.NetworkXNoPath:
                continue

    return G.subgraph(neighbors).copy()


def get_flagged_subgraph(
    G: nx.MultiDiGraph,
    flagged_accounts: Iterable[str],
    hops: int = 1,
) -> nx.MultiDiGraph:
    """Extract a subgraph containing all flagged accounts + their neighbors.

    Used by /graph endpoint to render only the suspicious part of the
    graph (not all 200+ accounts).

    Args:
        G: Full transaction graph.
        flagged_accounts: Iterable of account IDs flagged by detectors.
        hops: How many hops to include around each flagged account.

    Returns:
        Combined subgraph as MultiDiGraph.
    """
    flagged_set = set(flagged_accounts) & set(G.nodes())
    if not flagged_set:
        return nx.MultiDiGraph()

    # Collect all nodes to include
    nodes_to_include = set(flagged_set)
    undirected = G.to_undirected(as_view=True)
    for acc in flagged_set:
        if hops == 1:
            nodes_to_include.update(undirected.neighbors(acc))
        else:
            for node in G.nodes():
                try:
                    if nx.shortest_path_length(undirected, acc, node) <= hops:
                        nodes_to_include.add(node)
                except nx.NetworkXNoPath:
                    continue

    return G.subgraph(nodes_to_include).copy()
