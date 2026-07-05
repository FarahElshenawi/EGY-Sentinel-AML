"""EGY-Sentinel AML — Graph Serializer"""
from typing import Dict, Any
import networkx as nx

def serialize_graph(G: nx.DiGraph) -> Dict[str, Any]:
    """Serialize NetworkX DiGraph to GraphResponse format."""
    nodes = []
    for node_id, data in G.nodes(data=True):
        nodes.append({"id": node_id, "label": node_id, "risk_score": data.get("risk_score", 0.0), "risk_band": data.get("risk_band", "low"), "type": data.get("type", "unknown")})
    edges = []
    for u, v, data in G.edges(data=True):
        edges.append({"source": u, "target": v, "amount": data.get("amount", 0.0), "type": data.get("type", "TRANSFER"), "step": data.get("step", 1), "isFraud": data.get("isFraud", 0)})
    return {"nodes": nodes, "edges": edges, "stats": {"node_count": len(nodes), "edge_count": len(edges), "density": nx.density(G) if len(nodes) > 1 else 0}}
