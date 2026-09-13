"""
FastAPI Incident AI Endpoint
=================================================================
Phase 5B - Incident AI API Integration
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
import time
import logging

from app.ai import get_provider
from app.ai.schemas import (
    IncidentInput,
    IncidentAIResult,
    DisasterType,
    SeverityLevel,
)
from app.ai.validation import validate_incident_input, validate_incident_ai_result

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["Incident AI"])


class AnalyzeIncidentRequest(BaseModel):
    """
    Request model for incident AI analysis.
    Uses Phase 5A schemas to avoid duplication.
    """
    disaster_type: Optional[str] = Field(default=None, description="User-reported disaster type")
    reported_severity: Optional[str] = Field(default=None, description="User-reported severity")
    description: str = Field(..., min_length=10, max_length=5000, description="Incident description")
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    location_text: Optional[str] = Field(default=None, max_length=500)
    affected_people: int = Field(default=0, ge=0)
    image_url: Optional[str] = Field(default=None, description="Firebase Storage download URL")
    incident_id: Optional[str] = Field(default=None, description="Incident ID for tracking")


class AnalyzeIncidentResponse(BaseModel):
    """
    Response model for incident AI analysis.
    Mirrors Phase 5A IncidentAIResult with additional metadata.
    """
    success: bool
    result: Optional[IncidentAIResult] = None
    error: Optional[str] = None
    processing_time_ms: int
    provider: str
    is_demo: bool


@router.post(
    "/analyze-incident",
    response_model=AnalyzeIncidentResponse,
    summary="Analyze incident using AI",
    description="Analyze a disaster incident and return structured AI assessment"
)
async def analyze_incident(request: AnalyzeIncidentRequest) -> AnalyzeIncidentResponse:
    """
    Analyze a disaster incident using the configured AI provider.
    
    Returns structured assessment including:
    - Predicted disaster type
    - Predicted severity
    - Confidence score
    - Infrastructure impact assessment
    - Safety assessment and recommendations
    - Demo/real model indicator
    """
    start_time = time.time()
    
    try:
        # Validate input using Phase 5A validation utilities
        incident_data = {
            "description": request.description,
            "affected_people": request.affected_people,
            "latitude": request.latitude,
            "longitude": request.longitude,
            "image_url": request.image_url,
            "disaster_type": request.disaster_type,
            "reported_severity": request.reported_severity,
        }
        
        is_valid, errors = validate_incident_input(incident_data)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Invalid input", "errors": errors}
            )
        
        # Build IncidentInput from validated data
        incident_input = IncidentInput(
            disaster_type=DisasterType(request.disaster_type) if request.disaster_type else None,
            reported_severity=SeverityLevel(request.reported_severity) if request.reported_severity else None,
            description=request.description,
            latitude=request.latitude,
            longitude=request.longitude,
            location_text=request.location_text,
            affected_people=request.affected_people,
            image_url=request.image_url,
            incident_id=request.incident_id,
        )
        
        # Get provider from registry (uses demo if no real model)
        provider = get_provider()
        
        # Run AI analysis
        logger.info(f"Analyzing incident with provider: {provider.name} (demo={provider.is_demo})")
        ai_result = await provider.analyze(incident_input)
        
        # Validate result using Phase 5A validation
        is_valid_result, result_errors = validate_incident_ai_result(ai_result)
        if not is_valid_result:
            logger.warning(f"AI result validation warnings: {result_errors}")
            # Don't fail - just log warnings
        
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        return AnalyzeIncidentResponse(
            success=True,
            result=ai_result,
            error=None,
            processing_time_ms=processing_time_ms,
            provider=provider.name,
            is_demo=provider.is_demo
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI analysis failed: {e}", exc_info=True)
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        return AnalyzeIncidentResponse(
            success=False,
            result=None,
            error=f"AI analysis failed: {str(e)}",
            processing_time_ms=processing_time_ms,
            provider="unknown",
            is_demo=False
        )


@router.get(
    "/providers",
    summary="List available AI providers",
    description="Get list of registered AI providers and their metadata"
)
async def list_providers():
    """Get list of available AI providers from registry."""
    from app.ai.providers import get_registry
    
    registry = get_registry()
    providers = registry.list_providers()
    
    return {
        "providers": providers,
        "default": registry.get_default().name if registry.get_default() else None
    }


@router.get(
    "/health",
    summary="AI service health check",
    description="Check if AI service and providers are available"
)
async def ai_health_check():
    """Health check for AI service."""
    from app.ai import is_firestore_available
    
    provider = get_provider()
    
    return {
        "status": "ok",
        "provider": provider.name,
        "provider_version": provider.version,
        "is_demo": provider.is_demo,
        "firestore_available": is_firestore_available(),
        "timestamp": int(time.time())
    }