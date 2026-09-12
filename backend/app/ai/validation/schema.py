"""
AI Result schema validation utilities.
"""
from typing import Optional, List, Tuple
from app.ai.schemas import IncidentAIResult, DisasterType, SeverityLevel


def validate_confidence(confidence: float) -> Tuple[bool, Optional[str]]:
    """
    Validate confidence score.
    Returns (is_valid, error_message).
    """
    if not isinstance(confidence, (int, float)):
        return False, "Confidence must be a number"

    if confidence < 0.0 or confidence > 1.0:
        return False, f"Confidence must be between 0.0 and 1.0, got {confidence}"

    return True, None


def validate_incident_ai_result(result: IncidentAIResult) -> Tuple[bool, List[str]]:
    """
    Validate a complete IncidentAIResult object.
    Returns (is_valid, list_of_errors).
    """
    errors = []

    # Validate confidence
    conf_valid, conf_error = validate_confidence(result.confidence)
    if not conf_valid:
        errors.append(f"confidence: {conf_error}")

    # Validate disaster type
    try:
        DisasterType(result.predicted_disaster_type)
    except ValueError:
        errors.append(f"predicted_disaster_type: invalid value '{result.predicted_disaster_type}'")

    # Validate severity
    try:
        SeverityLevel(result.predicted_severity)
    except ValueError:
        errors.append(f"predicted_severity: invalid value '{result.predicted_severity}'")

    # Validate text fields not empty
    if not result.infrastructure_impact or not result.infrastructure_impact.strip():
        errors.append("infrastructure_impact: cannot be empty")

    if not result.safety_assessment or not result.safety_assessment.strip():
        errors.append("safety_assessment: cannot be empty")

    # Validate processing time
    if result.processing_time_ms < 0:
        errors.append("processing_time_ms: must be non-negative")

    # Validate model version
    if not result.model_version or not result.model_version.strip():
        errors.append("model_version: cannot be empty")

    # Validate lists if present
    if result.affected_areas is not None:
        if not isinstance(result.affected_areas, list):
            errors.append("affected_areas: must be a list if present")
        else:
            for area in result.affected_areas:
                if not isinstance(area, str):
                    errors.append("affected_areas: all items must be strings")

    if result.recommended_actions is not None:
        if not isinstance(result.recommended_actions, list):
            errors.append("recommended_actions: must be a list if present")
        else:
            for action in result.recommended_actions:
                if not isinstance(action, str):
                    errors.append("recommended_actions: all items must be strings")

    return len(errors) == 0, errors


def validate_ai_result_consistency(result: IncidentAIResult) -> Tuple[bool, List[str]]:
    """
    Check internal consistency of AI result.
    Returns (is_consistent, list_of_warnings).
    """
    warnings = []

    # Check confidence vs demo flag
    if result.is_demo and result.confidence > 0.9:
        warnings.append("Demo provider returning unusually high confidence (>0.9)")

    if not result.is_demo and result.confidence < 0.3:
        warnings.append("Non-demo model returning very low confidence (<0.3)")

    # Check if critical severity has appropriate confidence
    if result.predicted_severity == "critical" and result.confidence < 0.5:
        warnings.append("Critical severity with low confidence (<0.5)")

    # Check if infrastructure impact mentions the disaster type
    disaster_type = result.predicted_disaster_type.lower()
    impact_lower = result.infrastructure_impact.lower()
    if disaster_type not in impact_lower and "infrastructure" not in impact_lower:
        warnings.append("Infrastructure impact may not reference predicted disaster type")

    # Check safety assessment has actionable content
    safety_lower = result.safety_assessment.lower()
    action_words = ["evacuat", "avoid", "move", "call", "shelter", "stay", "monitor", "follow"]
    if not any(word in safety_lower for word in action_words):
        warnings.append("Safety assessment may lack actionable guidance")

    return len(warnings) == 0, warnings


def sanitize_ai_result(result: IncidentAIResult) -> IncidentAIResult:
    """
    Sanitize AI result - clamp values, trim strings, ensure validity.
    Returns a new validated IncidentAIResult.
    """
    # Clamp confidence
    confidence = max(0.0, min(1.0, float(result.confidence)))

    # Trim strings
    infrastructure_impact = result.infrastructure_impact.strip() if result.infrastructure_impact else ""
    safety_assessment = result.safety_assessment.strip() if result.safety_assessment else ""

    # Ensure lists are lists of strings
    affected_areas = None
    if result.affected_areas:
        affected_areas = [str(a).strip() for a in result.affected_areas if str(a).strip()]

    recommended_actions = None
    if result.recommended_actions:
        recommended_actions = [str(a).strip() for a in result.recommended_actions if str(a).strip()]

    return IncidentAIResult(
        predicted_disaster_type=result.predicted_disaster_type,
        predicted_severity=result.predicted_severity,
        confidence=confidence,
        infrastructure_impact=infrastructure_impact,
        safety_assessment=safety_assessment,
        affected_areas=affected_areas,
        recommended_actions=recommended_actions,
        model_version=result.model_version.strip(),
        processing_time_ms=max(0, int(result.processing_time_ms)),
        is_demo=bool(result.is_demo)
    )