"""
Demo Resource Optimization Schemas
=================================================================
DEMO/PROTOTYPE ONLY — not a production emergency-dispatch system.

Simple input/output contracts for the rule-based resource optimizer.
No trained ML model is involved; see scoring.py for the transparent
rule set (RULESET_VERSION).
"""
from typing import Optional, List, Dict
from pydantic import BaseModel, Field


class ResourceInput(BaseModel):
    """One pool of an emergency resource type (demo inventory)."""

    type: str = Field(description="Resource type, e.g. ambulance, rescue_team, relief_kit")
    available: int = Field(ge=0, description="Units available in this demo pool")
    location_text: Optional[str] = Field(default=None, description="Optional depot/staging-area label")


class IncidentForOptimization(BaseModel):
    """Minimal incident fields needed for priority scoring."""

    incident_id: str = Field(description="Incident identifier from IncidentContext/Firestore")
    disaster_type: Optional[str] = Field(default=None, description="e.g. flood, earthquake, fire")
    severity: Optional[str] = Field(default=None, description="low | moderate | high | critical")
    ai_predicted_severity: Optional[str] = Field(
        default=None,
        description="AI assessment severity, preferred over manual severity when present",
    )
    affected_people: int = Field(default=0, ge=0)
    status: Optional[str] = Field(default="ACTIVE")
    location_text: Optional[str] = Field(default=None)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)


class OptimizeRequest(BaseModel):
    """Request body for POST /api/optimize-resources."""

    incidents: List[IncidentForOptimization] = Field(
        default_factory=list, description="Incidents to rank (usually ACTIVE ones)"
    )
    resources: List[ResourceInput] = Field(
        default_factory=list,
        description="Available resource pools. Empty = use built-in DEMO inventory.",
    )


class AllocationItem(BaseModel):
    """Per-incident optimization result."""

    rank: int
    incident_id: str
    priority_score: float
    priority_level: str = Field(description="critical | high | moderate | low")
    recommended_resource: str
    recommended_quantity: int
    allocated_quantity: int
    unmet_need: bool = Field(description="True when need exceeds demo availability")
    explanation: str


class OptimizeResponse(BaseModel):
    """Response body for POST /api/optimize-resources."""

    success: bool
    ranked: List[AllocationItem] = []
    warnings: List[str] = []
    error: Optional[str] = None
    processing_time_ms: int = 0
    provider: str = "rule-based-v1"
    is_demo: bool = True
    resource_usage: Dict[str, Dict[str, int]] = Field(
        default_factory=dict,
        description="Per resource type: {available, allocated, remaining}",
    )
