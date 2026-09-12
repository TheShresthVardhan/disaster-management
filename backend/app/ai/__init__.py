"""
Incident AI Package
=================================================================
Phase 5A Foundation - Incident AI for Disaster Intelligence System
=================================================================

This package provides the foundation for AI-powered incident analysis.
Current status: Phase 5A Foundation - DEMO provider only, no trained models.

Architecture:
- schemas: Pydantic models for input/output contracts
- models: Provider interface and implementations (demo, future: sklearn/torch/etc.)
- preprocessing: Text and image preprocessing utilities
- validation: Unit-testable validation functions
- providers: Provider registry for dynamic model selection
- config: Configuration management

Supported Disaster Types:
- flood, landslide, earthquake, fire, cyclone, storm, infrastructure_damage, other

Supported Severity Levels:
- critical, high, moderate, low

Current Implementation Status:
- ✅ Schemas (IncidentInput, IncidentAIResult)
- ✅ Provider interface (IncidentAIProvider abstract base)
- ✅ Demo provider (rule-based, clearly labeled as DEMO)
- ✅ Text preprocessing utilities
- ✅ Image preprocessing interface (mock only)
- ✅ Validation utilities (input, severity, disaster_type, schema, confidence)
- ✅ Provider registry
- ✅ Configuration management
- ❌ Trained ML models (Phase 5B+)
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

__all__ = [
    # Schemas
    "IncidentInput",
    "IncidentAIResult",
    "DisasterType",
    "SeverityLevel",
    "IncidentAIRequest",
    "IncidentAIResponse",
    # Models
    "IncidentAIProvider",
    "DemoIncidentAIProvider",
    # Preprocessing
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
    # Validation
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
]