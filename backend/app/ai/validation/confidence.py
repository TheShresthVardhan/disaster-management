"""
Confidence validation and calibration utilities.
"""
from typing import Optional, Tuple


def validate_confidence_range(confidence: float) -> Tuple[bool, Optional[str]]:
    """
    Validate confidence is in valid range [0.0, 1.0].
    Returns (is_valid, error_message).
    """
    if not isinstance(confidence, (int, float)):
        return False, f"Confidence must be a number, got {type(confidence).__name__}"

    if confidence < 0.0:
        return False, f"Confidence cannot be negative: {confidence}"

    if confidence > 1.0:
        return False, f"Confidence cannot exceed 1.0: {confidence}"

    return True, None


def interpret_confidence(confidence: float) -> str:
    """
    Get human-readable interpretation of confidence score.
    """
    if confidence >= 0.9:
        return "Very High"
    elif confidence >= 0.75:
        return "High"
    elif confidence >= 0.6:
        return "Moderate"
    elif confidence >= 0.4:
        return "Low"
    elif confidence >= 0.2:
        return "Very Low"
    else:
        return "Very Low / Unreliable"


def confidence_to_percent(confidence: float) -> str:
    """
    Format confidence as percentage string.
    """
    return f"{confidence * 100:.1f}%"


def is_confidence_reliable(confidence: float, threshold: float = 0.6) -> bool:
    """
    Check if confidence meets minimum threshold for reliable decisions.
    """
    return confidence >= threshold


def combine_confidences(confidences: list, weights: Optional[list] = None) -> float:
    """
    Combine multiple confidence scores using weighted average.
    If weights not provided, uses simple average.
    """
    if not confidences:
        return 0.0

    if weights is None:
        return sum(confidences) / len(confidences)

    if len(confidences) != len(weights):
        raise ValueError("confidences and weights must have same length")

    total_weight = sum(weights)
    if total_weight == 0:
        return 0.0

    weighted_sum = sum(c * w for c, w in zip(confidences, weights))
    return weighted_sum / total_weight


def calibrate_confidence(
    raw_confidence: float,
    calibration_data: Optional[dict] = None
) -> float:
    """
    Calibrate raw model confidence using calibration data.
    This is a placeholder for future calibration (Platt scaling, isotonic regression, etc.).
    """
    if calibration_data is None:
        return raw_confidence

    # Future: implement Platt scaling, isotonic regression, etc.
    # For now, return as-is
    return raw_confidence


def confidence_interval(confidence: float, margin: float = 0.1) -> tuple:
    """
    Get confidence interval around a confidence score.
    Returns (lower_bound, upper_bound).
    """
    lower = max(0.0, confidence - margin)
    upper = min(1.0, confidence + margin)
    return (lower, upper)


def flag_low_confidence(confidence: float, threshold: float = 0.5) -> bool:
    """
    Flag if confidence is below operational threshold.
    """
    return confidence < threshold