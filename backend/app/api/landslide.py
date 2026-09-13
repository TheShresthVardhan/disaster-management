"""
Landslide Risk API Endpoint
=================================================================
Phase 6A - Landslide Risk API Integration
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List
import time
import logging

from app.ai import get_provider
from app.ai.landslide.schemas import (
    LandslideInputFeatures,
    LandslideRiskRequest,
    LandslideRiskResult,
    LandslideRiskResponse,
    LandslidePredictionBatchRequest,
    LandslidePredictionBatchResponse,
    LandslideRiskCategory,
)
from app.ai.landslide.validation.validator import validate_landslide_input
from app.ai.landslide.inference.predictor import LandslideRiskPredictor

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai/landslide", tags=["Landslide Risk"])

# Initialize predictor (singleton)
_predictor = None

def get_landslide_predictor() -> 'LandslideRiskPredictor':
    """Get or create the global landslide risk predictor."""
    global _predictor
    if _predictor is None:
        _predictor = LandslideRiskPredictor()
    return _predictor


@router.post(
    "/predict-risk",
    response_model=LandslideRiskResponse,
    summary="Predict landslide risk",
    description="Analyze environmental conditions and return landslide risk assessment"
)
async def predict_landslide_risk(request: LandslideRiskRequest) -> LandslideRiskResponse:
    """
    Predict landslide risk based on environmental features.
    
    Returns structured assessment including:
    - Risk category (low/moderate/high/critical)
    - Risk score (0-1)
    - Confidence score
    - Infrastructure impact assessment
    - Safety recommendations
    - Demo/real model indicator
    """
    start_time = time.time()
    
    try:
        # Validate input using validation utilities
        is_valid, errors = validate_landslide_input(request.features)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Invalid input", "errors": errors}
            )
        
        # Get predictor
        predictor = get_landslide_predictor()
        
        # Run prediction
        logger.info(f"Predicting landslide risk with provider: demo")
        result = predictor.predict_single(
            request.features,
            return_probabilities=request.return_probabilities,
            return_feature_contributions=request.return_feature_contributions
        )
        
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        return LandslideRiskResponse(
            success=True,
            result=result,
            error=None,
            processing_time_ms=processing_time_ms,
            provider="demo",
            is_demo=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Landslide risk prediction failed: {e}", exc_info=True)
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        return LandslideRiskResponse(
            success=False,
            result=None,
            error=f"Landslide risk prediction failed: {str(e)}",
            processing_time_ms=processing_time_ms,
            provider="unknown",
            is_demo=False
        )


@router.post(
    "/predict-risk-batch",
    response_model=LandslidePredictionBatchResponse,
    summary="Batch predict landslide risk",
    description="Analyze multiple locations for landslide risk"
)
async def predict_landslide_risk_batch(request: LandslidePredictionBatchRequest) -> LandslidePredictionBatchResponse:
    """
    Batch predict landslide risk for multiple locations.
    """
    start_time = time.time()
    
    try:
        # Validate all inputs
        for i, features in enumerate(request.locations):
            is_valid, errors = validate_landslide_input(features)
            if not is_valid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"message": f"Invalid input at index {i}", "errors": errors}
                )
        
        predictor = get_landslide_predictor()
        
        # Run batch prediction
        results = predictor.predict_batch(request.locations)
        
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        return LandslidePredictionBatchResponse(
            success=True,
            results=results,
            error=None,
            processing_time_ms=processing_time_ms,
            provider="demo",
            is_demo=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch landslide risk prediction failed: {e}", exc_info=True)
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        return LandslidePredictionBatchResponse(
            success=False,
            results=[],
            error=f"Batch prediction failed: {str(e)}",
            processing_time_ms=processing_time_ms,
            provider="unknown",
            is_demo=False
        )


@router.get(
    "/health",
    summary="Landslide AI service health check",
    description="Check if landslide risk service is available"
)
async def landslide_health_check():
    """Health check for landslide risk service."""
    predictor = get_landslide_predictor()
    
    return {
        "status": "ok",
        "provider": "demo",
        "is_demo": True,
        "firestore_available": False,  # Will be updated when Firestore is configured
        "model_loaded": True,
        "timestamp": int(time.time())
    }


@router.get(
    "/model-info",
    summary="Get landslide model information",
    description="Get metadata about the loaded landslide risk model"
)
async def get_model_info():
    """Get information about the loaded landslide risk model."""
    predictor = get_landslide_predictor()
    return predictor.get_model_info()