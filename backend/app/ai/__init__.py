"""
Incident AI Package
=================================================================
Phase 5A Foundation - Incident AI for Disaster Intelligence System
Phase 6A Foundation - Landslide Risk Model Foundation
=====================================================================================

This package provides the foundation for AI-powered incident analysis
and environmental landslide risk prediction.

Phase 5A - Incident AI Foundation:
- schemas: Pydantic models for input/output contracts
- models: Provider interface and implementations (demo, future: sklearn/torch/etc.)
- preprocessing: Text and image preprocessing utilities
- validation: Unit-testable validation functions
- providers: Provider registry for dynamic model selection
- config: Configuration management

Phase 6A - Landslide Risk Model Foundation:
- data: Data loading and synthetic data generation
- models: Model implementations (RandomForest, Demo)
- preprocessing: Feature preprocessing and encoding
- training: Training pipeline with cross-validation
- inference: Inference interface with predictor
- validation: Input/output validation
- config: Configuration management

Supported Disaster Types:
- flood, landslide, earthquake, fire, cyclone, storm, infrastructure_damage, other

Supported Severity Levels:
- critical, high, moderate, low

Landslide Risk Categories:
- low, moderate, high, critical

Current Implementation Status:
- ✅ Schemas (IncidentInput, IncidentAIResult, LandslideInputFeatures, LandslideRiskResult)
- ✅ Provider interface (IncidentAIProvider abstract base)
- ✅ Demo provider (rule-based, clearly labeled as DEMO)
- ✅ Text preprocessing utilities
- ✅ Image preprocessing interface (mock only)
- ✅ Validation utilities (input, severity, disaster_type, schema, confidence)
- ✅ Provider registry
- ✅ Configuration management
- ✅ Landslide data loading and synthetic data generation
- ✅ Landslide feature preprocessing
- ✅ Random Forest landslide model (trainable)
- ✅ Demo landslide model (rule-based)
- ✅ Training pipeline with cross-validation
- ✅ Inference interface with predictor
- ✅ Validation utilities for landslide features
- ❌ Trained ML models with real data (requires dataset)
- ❌ Image analysis models (Phase 5B+)
- ❌ Forecasting/prediction (Phase 5C+)
- ❌ Resource optimization (Phase 5D+)

Usage:
    from app.ai import get_provider
    from app.ai.schemas import IncidentInput

    provider = get_provider()  # Returns demo provider by default
    result = await provider.analyze(incident_input)

Configuration:
    Environment variables (see AIConfig in config.py):
    - AI_DEFAULT_PROVIDER: Provider name (default: "demo")
    - AI_DEMO_ENABLED: Enable demo provider (default: true)
    - AI_MIN_CONFIDENCE: Minimum confidence threshold (default: 0.3)
    - AI_MAX_TEXT_LENGTH: Max text length for analysis (default: 4000)
    - AI_LOG_LEVEL: Logging level (default: INFO)

Landslide Configuration (see LandslideConfig in landslide/config.py):
    - LANDSLIDE_MODEL_TYPE: Model type (default: "random_forest")
    - LANDSLIDE_DEMO_MODE: Enable demo mode (default: true)
    - LANDSLIDE_MODEL_PATH: Path to model file
    - LANDSLIDE_DATA_DIR: Data directory
    - LANDSLIDE_MODEL_DIR: Model output directory

Testing:
    pytest backend/tests/ -v

Integration with Firestore:
    The IncidentAIResult schema is compatible with the existing Incident object
    in IncidentContext. Phase 5B will add API endpoint to attach AI results to
    Firestore incidents.
"""

from app.ai.schemas import (
    IncidentInput,
    IncidentAIResult,
    DisasterType,
    SeverityLevel,
    IncidentAIRequest,
    IncidentAIResponse,
)

from app.ai.models import (
    IncidentAIProvider,
    DemoIncidentAIProvider,
)

from app.ai.preprocessing import (
    clean_text,
    extract_keywords,
    normalize_severity_text,
    extract_location_entities,
    prepare_incident_text,
    truncate_text,
    ImageFeatures,
    ImagePreprocessor,
    MockImagePreprocessor,
    get_image_preprocessor,
)

from app.ai.validation import (
    validate_incident_description,
    validate_affected_people,
    validate_coordinates,
    validate_image_url,
    validate_incident_input,
    validate_image_file,
    normalize_severity,
    severity_to_numeric,
    numeric_to_severity,
    compare_severity,
    get_severity_priority,
    validate_severity_consistency,
    get_severity_color,
    get_severity_label,
    normalize_disaster_type,
    validate_disaster_type,
    get_disaster_type_label,
    get_disaster_type_icon,
    get_all_disaster_types,
    is_disaster_type_supported,
    validate_confidence,
    validate_incident_ai_result,
    validate_ai_result_consistency,
    sanitize_ai_result,
    validate_confidence_range,
    interpret_confidence,
    confidence_to_percent,
    is_confidence_reliable,
    combine_confidences,
    calibrate_confidence,
    confidence_interval,
    flag_low_confidence,
)

from app.ai.providers import (
    ProviderRegistry,
    get_registry,
    get_provider,
)

from app.ai.config import (
    AIConfig,
    get_config,
    reset_config,
)

# Phase 6A - Landslide Risk Model
from app.ai.landslide.config import (
    LandslideConfig,
    get_landslide_config,
    reset_landslide_config,
)
from app.ai.landslide.schemas import (
    LandslideInputFeatures,
    LandslideRiskResult,
    LandslideRiskCategory,
    SoilType,
    LandCover,
    Geology,
    LandslidePredictionBatchRequest,
    LandslidePredictionBatchResponse,
    LandslideTrainingData,
)
from app.ai.landslide.models import (
    RandomForestLandslideModel,
    DemoLandslideModel,
    get_landslide_model,
)
from app.ai.landslide.preprocessing.processor import LandslidePreprocessor
from app.ai.landslide.inference.predictor import LandslideRiskPredictor, create_predictor
from app.ai.landslide.validation.validator import (
    validate_landslide_input,
    validate_landslide_risk_result,
    get_risk_category_from_score,
    validate_landslide_input,
    validate_landslide_risk_result,
    validate_environmental_features,
    validate_coordinates,
    validate_risk_category,
    sanitize_input_features,
    validate_feature_completeness,
)

__all__ = [
    # Schemas (Phase 5A)
    "IncidentInput",
    "IncidentAIResult",
    "DisasterType",
    "SeverityLevel",
    "IncidentAIRequest",
    "IncidentAIResponse",
    # Models (Phase 5A)
    "IncidentAIProvider",
    "DemoIncidentAIProvider",
    # Preprocessing (Phase 5A)
    "clean_text",
    "extract_keywords",
    "normalize_severity_text",
    "extract_location_entities",
    "prepare_incident_text",
    "truncate_text",
    "ImageFeatures",
    "ImagePreprocessor",
    "MockImagePreprocessor",
    "get_image_preprocessor",
    # Validation (Phase 5A)
    "validate_incident_description",
    "validate_affected_people",
    "validate_coordinates",
    "validate_image_url",
    "validate_incident_input",
    "validate_image_file",
    "normalize_severity",
    "severity_to_numeric",
    "numeric_to_severity",
    "compare_severity",
    "get_severity_priority",
    "validate_severity_consistency",
    "get_severity_color",
    "get_severity_label",
    "normalize_disaster_type",
    "validate_disaster_type",
    "get_disaster_type_label",
    "get_disaster_type_icon",
    "get_all_disaster_types",
    "is_disaster_type_supported",
    "validate_confidence",
    "validate_incident_ai_result",
    "validate_ai_result_consistency",
    "sanitize_ai_result",
    "validate_confidence_range",
    "interpret_confidence",
    "confidence_to_percent",
    "is_confidence_reliable",
    "combine_confidences",
    "calibrate_confidence",
    "confidence_interval",
    "flag_low_confidence",
    # Providers
    "ProviderRegistry",
    "get_registry",
    "get_provider",
    # Config
    "AIConfig",
    "get_config",
    "reset_config",
    # Phase 6A - Landslide
    "LandslideConfig",
    "get_landslide_config",
    "reset_landslide_config",
    "LandslideInputFeatures",
    "LandslideRiskResult",
    "LandslideRiskCategory",
    "SoilType",
    "LandCover",
    "Geology",
    "LandslidePredictionBatchRequest",
    "LandslidePredictionBatchResponse",
    "LandslideTrainingData",
    "RandomForestLandslideModel",
    "DemoLandslideModel",
    "get_landslide_model",
    "LandslidePreprocessor",
    "LandslideRiskPredictor",
    "create_predictor",
    "validate_landslide_input",
    "validate_landslide_risk_result",
    "get_risk_category_from_score",
    "validate_landslide_input",
    "validate_landslide_risk_result",
    "validate_environmental_features",
    "validate_coordinates",
    "validate_risk_category",
    "sanitize_input_features",
    "validate_feature_completeness",
]