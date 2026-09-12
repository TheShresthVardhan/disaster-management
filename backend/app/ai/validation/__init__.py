"""
Validation Package
=================================================================
Unit-testable validation utilities for Incident AI.
"""
from app.ai.validation.input import (
    validate_incident_description,
    validate_affected_people,
    validate_coordinates,
    validate_image_url,
    validate_incident_input,
    validate_image_file,
)

from app.ai.validation.severity import (
    normalize_severity,
    severity_to_numeric,
    numeric_to_severity,
    compare_severity,
    get_severity_priority,
    validate_severity_consistency,
    get_severity_color,
    get_severity_label,
)

from app.ai.validation.disaster_type import (
    normalize_disaster_type,
    validate_disaster_type,
    get_disaster_type_label,
    get_disaster_type_icon,
    get_all_disaster_types,
    is_disaster_type_supported,
)

from app.ai.validation.schema import (
    validate_confidence,
    validate_incident_ai_result,
    validate_ai_result_consistency,
    sanitize_ai_result,
)

from app.ai.validation.confidence import (
    validate_confidence_range,
    interpret_confidence,
    confidence_to_percent,
    is_confidence_reliable,
    combine_confidences,
    calibrate_confidence,
    confidence_interval,
    flag_low_confidence,
)

__all__ = [
    # Input
    "validate_incident_description",
    "validate_affected_people",
    "validate_coordinates",
    "validate_image_url",
    "validate_incident_input",
    "validate_image_file",
    # Severity
    "normalize_severity",
    "severity_to_numeric",
    "numeric_to_severity",
    "compare_severity",
    "get_severity_priority",
    "validate_severity_consistency",
    "get_severity_color",
    "get_severity_label",
    # Disaster Type
    "normalize_disaster_type",
    "validate_disaster_type",
    "get_disaster_type_label",
    "get_disaster_type_icon",
    "get_all_disaster_types",
    "is_disaster_type_supported",
    # Schema
    "validate_confidence",
    "validate_incident_ai_result",
    "validate_ai_result_consistency",
    "sanitize_ai_result",
    # Confidence
    "validate_confidence_range",
    "interpret_confidence",
    "confidence_to_percent",
    "is_confidence_reliable",
    "combine_confidences",
    "calibrate_confidence",
    "confidence_interval",
    "flag_low_confidence",
]