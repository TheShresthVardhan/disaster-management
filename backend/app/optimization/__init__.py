"""
Demo Resource Optimization Package
=================================================================
DEMO/PROTOTYPE ONLY — rule-based incident prioritization + greedy
allocation against a simulated inventory.

Not a production dispatch system. No trained ML model involved.
"""
from app.optimization.schemas import (
    ResourceInput,
    IncidentForOptimization,
    OptimizeRequest,
    AllocationItem,
    OptimizeResponse,
)
from app.optimization.scoring import (
    RULESET_VERSION,
    DEMO_INVENTORY,
    score_incident,
    priority_level_for,
)
from app.optimization.optimizer import optimize

__all__ = [
    "ResourceInput",
    "IncidentForOptimization",
    "OptimizeRequest",
    "AllocationItem",
    "OptimizeResponse",
    "RULESET_VERSION",
    "DEMO_INVENTORY",
    "score_incident",
    "priority_level_for",
    "optimize",
]
