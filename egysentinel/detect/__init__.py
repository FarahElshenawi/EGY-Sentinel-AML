"""Pattern detection modules (circular, fan_out, dense_cluster).

Public API:
    from egysentinel.detect import detect_all
    patterns = detect_all(graph)
"""
from .circular import detect_circular
from .fan_out import detect_fan_out
from .dense_cluster import detect_dense_cluster


def detect_all(
    G,
    min_cycle_len: int = 3,
    max_cycle_len: int = 6,
    fan_out_threshold: int = 5,
    fan_out_ratio: float = 0.6,
    cluster_min_nodes: int = 4,
    cluster_density: float = 0.5,
):
    """Run all 3 detectors and return a flattened list of patterns.

    Args:
        G: NetworkX MultiDiGraph from build_digraph().
        Detector-specific thresholds (see individual detectors for details).

    Returns:
        List of pattern dicts, each with:
        - detector: str ("circular" | "fan_out" | "dense_cluster")
        - accounts: list of account IDs
        - score_raw: float 0.0-1.0
        - evidence: dict of detector-specific evidence

        Patterns are sorted by score_raw descending.
    """
    patterns = []
    patterns.extend(detect_circular(G, min_len=min_cycle_len, max_len=max_cycle_len))
    patterns.extend(detect_fan_out(G, threshold=fan_out_threshold, ratio=fan_out_ratio))
    patterns.extend(detect_dense_cluster(G, min_nodes=cluster_min_nodes, density=cluster_density))

    # Sort by score descending
    patterns.sort(key=lambda p: p["score_raw"], reverse=True)
    return patterns


def get_flagged_accounts(patterns):
    """Extract the set of all flagged account IDs from a list of patterns.

    Args:
        patterns: List of pattern dicts from detect_all().

    Returns:
        Set of account ID strings.
    """
    flagged = set()
    for p in patterns:
        flagged.update(p.get("accounts", []))
    return flagged


__all__ = [
    "detect_circular",
    "detect_fan_out",
    "detect_dense_cluster",
    "detect_all",
    "get_flagged_accounts",
]
