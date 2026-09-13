"""
Landslide Risk Package
=================================================================
Phase 6A Foundation - Landslide Risk Model for Disaster Intelligence System
=====================================================================================

This package provides the foundation for environmental landslide risk prediction.

Architecture:
- config: Configuration management
- schemas: Pydantic models for input/output contracts
- data: Data loading and synthetic data generation
- models: Model implementations (RandomForest, Demo)
- preprocessing: Feature preprocessing and encoding
- training: Training pipeline with cross-validation
- inference: Inference interface with predictor
- validation: Input/output validation
- config: Configuration management

Supported Features:
- rainfall (1h, 24h, 72h, 7d)
- soil moisture / VWC
- slope, elevation, aspect
- vegetation index, land cover
- soil type, soil properties
- geology
- historical landslide information

Output:
- risk category: low / moderate / high / critical
- risk score (0-1)
- confidence score
- feature contributions
- risk factors
- recommended actions

Current Implementation Status:
- ✅ Schemas (LandslideInputFeatures, LandslideRiskResult)
- ✅ Model interface (base class)
- ✅ Demo provider (rule-based, clearly labeled as DEMO)
- ✅ Random Forest model (trainable with scikit-learn)
- ✅ Data loading and synthetic data generation
- ✅ Feature preprocessing (encoding, scaling, imputation)
- ✅ Training pipeline with cross-validation
- ✅ Inference interface with predictor
- ✅ Validation utilities (input, output, feature completeness)
- ❌ Real trained model (requires dataset)
- ❌ Real dataset (requires sourcing)

Usage:
    from app.ai.landslide import create_predictor
    from app.ai.landslide.schemas import LandslideInputFeatures

    predictor = create_predictor()  # Returns demo predictor by default
    result = predictor.predict_single(features)

Configuration:
    Environment variables (see config.py):
    - LANDSLIDE_MODEL_TYPE: Provider name (default: "random_forest")
    - LANDSLIDE_DEMO_MODE: Enable demo mode (default: true)
    - LANDSLIDE_MODEL_PATH: Path to model file
    - LANDSLIDE_DATA_DIR: Data directory
    - LANDSLIDE_MODEL_DIR: Model output directory

Training:
    from app.ai.landslide.training import run_training_pipeline
    
    result = run_training_pipeline(
        use_synthetic=True,
        n_samples=5000,
        model_type="random_forest"
    )

Testing:
    pytest backend/tests/ -v -k landslide
"""

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
from app.ai.landslide.inference.predictor import (
    LandslideRiskPredictor,
    create_predictor,
    LandslideRiskBatchProcessor,
)
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
    # Config
    "LandslideConfig",
    "get_landslide_config",
    "reset_landslide_config",
    # Schemas
    "LandslideInputFeatures",
    "LandslideRiskResult",
    "LandslideRiskCategory",
    "SoilType",
    "LandCover",
    "Geology",
    "LandslidePredictionBatchRequest",
    "LandslidePredictionBatchResponse",
    "LandslideTrainingData",
    # Models
    "RandomForestLandslideModel",
    "DemoLandslideModel",
    "get_landslide_model",
    # Preprocessing
    "LandslidePreprocessor",
    # Inference
    "LandslideRiskPredictor",
    "create_predictor",
    "LandslideRiskBatchProcessor",
    # Validation
    "validate_landslide_input",
    "validate_landslide_risk_result",
    "get_risk_category_from_score",
    "validate_environmental_features",
    "validate_coordinates",
    "validate_risk_category",
    "sanitize_input_features",
    "validate_feature_completeness",
]