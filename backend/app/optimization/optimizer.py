"""
Demo Resource Optimizer (greedy allocation by priority rank)
=================================================================
DEMO/PROTOTYPE ONLY — greedy rank-order allocation against a small
simulated inventory. Not an operations-research solver and not
connected to any real dispatch system.
"""
import time
from typing import List, Dict

from app.optimization.schemas import (
    IncidentForOptimization,
    ResourceInput,
    AllocationItem,
)
from app.optimization.scoring import score_incident, DEMO_INVENTORY


def optimize(
    incidents: List[IncidentForOptimization],
    resources: List[ResourceInput],
) -> Dict:
    """Rank incidents and greedily allocate demo resources by rank."""
    start = time.time()
    warnings: List[str] = []

    pool: Dict[str, int] = {}
    if resources:
        for r in resources:
            pool[r.type] = pool.get(r.type, 0) + max(0, r.available)
    else:
        for item in DEMO_INVENTORY:
            pool[item["type"]] = item["available"]
        warnings.append("No resources supplied — using built-in DEMO inventory (simulated).")

    if not incidents:
        return {
            "ranked": [],
            "warnings": warnings + ["No incidents supplied — nothing to rank."],
            "resource_usage": {
                t: {"available": q, "allocated": 0, "remaining": q} for t, q in pool.items()
            },
            "processing_time_ms": int((time.time() - start) * 1000),
        }

    scored = []
    for inc in incidents:
        score, level, resource, explanation, qty = score_incident(
            severity=inc.severity,
            affected_people=inc.affected_people,
            disaster_type=inc.disaster_type,
            ai_predicted_severity=inc.ai_predicted_severity,
            status=inc.status,
        )
        scored.append((score, inc, level, resource, explanation, qty))

    # Highest score first; ties broken by affected people, then id for stability.
    scored.sort(key=lambda s: (-s[0], -(s[1].affected_people or 0), s[1].incident_id))

    ranked: List[AllocationItem] = []
    allocated: Dict[str, int] = {t: 0 for t in pool}
    for rank, (score, inc, level, resource, explanation, qty) in enumerate(scored, start=1):
        if resource not in pool:
            pool[resource] = 0
            allocated.setdefault(resource, 0)
            warnings.append(f"Resource '{resource}' not in demo pool — treated as 0 available.")
        give = min(qty, pool[resource] - allocated[resource])
        unmet = qty > give
        if unmet:
            warnings.append(
                f"{inc.incident_id}: needs {qty}x {resource}, only {give} available in demo pool."
            )
        allocated[resource] += give
        ranked.append(
            AllocationItem(
                rank=rank,
                incident_id=inc.incident_id,
                priority_score=score,
                priority_level=level,
                recommended_resource=resource,
                recommended_quantity=qty,
                allocated_quantity=give,
                unmet_need=unmet,
                explanation=explanation,
            )
        )

    usage = {
        t: {"available": pool[t], "allocated": allocated.get(t, 0), "remaining": pool[t] - allocated.get(t, 0)}
        for t in pool
    }
    return {
        "ranked": ranked,
        "warnings": warnings,
        "resource_usage": usage,
        "processing_time_ms": int((time.time() - start) * 1000),
    }
