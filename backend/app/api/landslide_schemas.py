"""
Landslide Risk API Schemas
=================================================================
Request/Response schemas for landslide risk prediction API.
"""
from typing import Optional, List
from pydantic import BaseModel, Field
from app.ai.landslide.schemas import (
    LandslideInputFeatures,
    LandslideRiskResult,
    LandslideRiskCategory,
    LandslidePredictionBatchRequest,
    LandslidePredictionBatchResponse,
)


class LandslideRiskRequest(BaseModel):
    """
    Request model for landslide risk analysis.
    """
    features: LandslideInputFeatures = Field(..., description="Environmental features for risk assessment")
    return_probabilities: bool = Field(default=True, description="Whether to return probability distribution")
    return_feature_contributions: bool = Field(default=False, description="Whether to return feature importance")


class LandslideRiskResponse(BaseModel):
    """
    Response model for landslide risk analysis.
    """
    success: bool
    result: Optional[LandslideRiskResult] = None
    error: Optional[str] = None
    processing_time_ms: int
    provider: str
    is_demo: bool


class LandslideBatchRequest(BaseModel):
    """Request model for batch landslide risk prediction."""
    locations: List['LandslideInputFeatures'] = Field(..., description="List of locations to analyze")
    return_probabilities: bool = Field(default=True, description="Whether to return probability distribution")
    return_feature_contributions: bool = Field(default=False, description="Whether to return feature importance")


class LandslideBatchResponse(BaseModel):
    """Response model for batch landslide risk prediction."""
    success: bool
    results: List['LandslideRiskResult'] = []
    error: Optional[str] = None
    processing_time_ms: int
    provider: str
    is_demo: bool


# Forward references
from app.ai.landslide.schemas import LandslideInputFeatures, LandslideRiskResult, LandslideRiskCategory
LandslideBatchRequest.model_rebuild()
LandslideBatchResponse.model_rebuild()