"""
Pydantic schemas for Incident AI input/output.
These define the contract between the frontend/reporting system and the AI module.
"""
from enum import Enum
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, field_validator


class DisasterType(str, Enum):
    """Supported disaster types for AI classification."""
    FLOOD = "flood"
    LANDSLIDE = "landslide"
    EARTHQUAKE = "earthquake"
    FIRE = "fire"
    CYCLONE = "cyclone"
    STORM = "storm"
    INFRASTRUCTURE_DAMAGE = "infrastructure_damage"
    OTHER = "other"


class SeverityLevel(str, Enum):
    """Standardized severity levels matching the frontend/reporting system."""
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentInput(BaseModel):
    """
    Input schema for Incident AI analysis.
    Matches the data collected from the disaster report form.
    """
    disaster_type: Optional[DisasterType] = Field(
        default=None,
        description="User-reported disaster type (if provided). AI may override."
    )
    reported_severity: Optional[SeverityLevel] = Field(
        default=None,
        description="User-reported severity (if provided). AI may override."
    )
    description: str = Field(
        min_length=1,
        max_length=5000,
        description="User's textual description of the incident"
    )
    latitude: Optional[float] = Field(
        default=None,
        ge=-90,
        le=90,
        description="Incident latitude (if available)"
    )
    longitude: Optional[float] = Field(
        default=None,
        ge=-180,
        le=180,
        description="Incident longitude (if available)"
    )
    location_text: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Human-readable location description"
    )
    affected_people: int = Field(
        default=0,
        ge=0,
        description="Number of people reported affected"
    )
    image_url: Optional[str] = Field(
        default=None,
        description="Firebase Storage download URL for incident image (if uploaded)"
    )
    incident_id: Optional[str] = Field(
        default=None,
        description="Incident ID for tracking and image association"
    )

    @field_validator("image_url")
    @classmethod
    def validate_image_url(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("image_url must be a valid HTTP/HTTPS URL")
        return v


class IncidentAIResult(BaseModel):
    """
    Output schema for Incident AI analysis.
    This is the structured assessment that will be attached to Firestore incidents.
    """
    predicted_disaster_type: DisasterType = Field(
        description="AI-predicted disaster category"
    )
    predicted_severity: SeverityLevel = Field(
        description="AI-predicted severity level"
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Model confidence score (0.0-1.0). "
                    "Only meaningful if a trained model is used; "
                    "demo mode returns fixed placeholder values."
    )
    infrastructure_impact: str = Field(
        description="AI assessment of infrastructure impact"
    )
    safety_assessment: str = Field(
        description="AI safety recommendations and risk assessment"
    )
    affected_areas: Optional[List[str]] = Field(
        default=None,
        description="Identified affected areas/zones (if determinable from input)"
    )
    recommended_actions: Optional[List[str]] = Field(
        default=None,
        description="AI-recommended immediate actions for responders/public"
    )
    model_version: str = Field(
        description="Version identifier of the model used (e.g., 'demo-v1', 'sklearn-v0.1')"
    )
    processing_time_ms: int = Field(
        ge=0,
        description="Time taken for AI inference in milliseconds"
    )
    is_demo: bool = Field(
        default=False,
        description="True if result came from demo/mock provider, not a trained model"
    )


class IncidentAIRequest(BaseModel):
    """Wrapper for API requests to the AI service."""
    incident: IncidentInput
    use_demo: bool = Field(
        default=False,
        description="Force use of demo provider (for testing without trained model)"
    )


class IncidentAIResponse(BaseModel):
    """Wrapper for AI service responses."""
    success: bool
    result: Optional[IncidentAIResult] = None
    error: Optional[str] = None
    processing_time_ms: int