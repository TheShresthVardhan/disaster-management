"""
Severity normalization and validation utilities.
"""
from typing import Optional
from app.ai.schemas import SeverityLevel


# Mapping from various severity representations to standard levels
SEVERITY_NORMALIZATION_MAP = {
    # Critical variations
    "critical": SeverityLevel.CRITICAL,
    "catastrophic": SeverityLevel.CRITICAL,
    "devastating": SeverityLevel.CRITICAL,
    "extreme": SeverityLevel.CRITICAL,
    "emergency": SeverityLevel.CRITICAL,
    "life-threatening": SeverityLevel.CRITICAL,
    "life threatening": SeverityLevel.CRITICAL,

    # High variations
    "high": SeverityLevel.HIGH,
    "severe": SeverityLevel.HIGH,
    "major": SeverityLevel.HIGH,
    "significant": SeverityLevel.HIGH,
    "serious": SeverityLevel.HIGH,
    "urgent": SeverityLevel.HIGH,
    "widespread": SeverityLevel.HIGH,
    "extensive": SeverityLevel.HIGH,

    # Moderate variations
    "moderate": SeverityLevel.MODERATE,
    "medium": SeverityLevel.MODERATE,
    "partial": SeverityLevel.MODERATE,
    "localized": SeverityLevel.MODERATE,
    "limited": SeverityLevel.MODERATE,
    "contained": SeverityLevel.MODERATE,

    # Low variations
    "low": SeverityLevel.LOW,
    "minor": SeverityLevel.LOW,
    "minimal": SeverityLevel.LOW,
    "slight": SeverityLevel.LOW,
    "negligible": SeverityLevel.LOW,
    "under control": SeverityLevel.LOW,
    "no damage": SeverityLevel.LOW,
    "no injuries": SeverityLevel.LOW,
}


def normalize_severity(severity_text: str) -> Optional[SeverityLevel]:
    """
    Normalize free-text severity to standard SeverityLevel.
    Returns None if no match found.
    """
    if not severity_text:
        return None

    normalized = severity_text.lower().strip()

    # Direct match
    if normalized in SEVERITY_NORMALIZATION_MAP:
        return SEVERITY_NORMALIZATION_MAP[normalized]

    # Check for partial matches (word boundaries)
    for variant, standard in SEVERITY_NORMALIZATION_MAP.items():
        if variant in normalized:
            return standard

    return None


def severity_to_numeric(severity: SeverityLevel) -> int:
    """
    Convert severity to numeric value for sorting/comparison.
    Critical=4, High=3, Moderate=2, Low=1
    """
    mapping = {
        SeverityLevel.CRITICAL: 4,
        SeverityLevel.HIGH: 3,
        SeverityLevel.MODERATE: 2,
        SeverityLevel.LOW: 1,
    }
    return mapping.get(severity, 0)


def numeric_to_severity(value: int) -> Optional[SeverityLevel]:
    """
    Convert numeric value back to SeverityLevel.
    """
    mapping = {
        4: SeverityLevel.CRITICAL,
        3: SeverityLevel.HIGH,
        2: SeverityLevel.MODERATE,
        1: SeverityLevel.LOW,
    }
    return mapping.get(value)


def compare_severity(a: SeverityLevel, b: SeverityLevel) -> int:
    """
    Compare two severity levels.
    Returns: -1 if a < b, 0 if a == b, 1 if a > b
    """
    return severity_to_numeric(a) - severity_to_numeric(b)


def get_severity_priority(severity: SeverityLevel) -> int:
    """
    Get priority value for severity (higher = more urgent).
    Same as numeric but explicitly named for clarity.
    """
    return severity_to_numeric(severity)


def validate_severity_consistency(
    predicted: SeverityLevel,
    reported: Optional[SeverityLevel],
    affected_people: int
) -> bool:
    """
    Check if predicted severity is consistent with reported severity and affected people.
    Returns True if consistent, False if major discrepancy.
    """
    if reported is None:
        return True  # No reported severity to check against

    # Major discrepancy check
    pred_num = severity_to_numeric(predicted)
    reported_num = severity_to_numeric(reported)

    # If difference > 2 levels, flag as inconsistent
    if abs(pred_num - reported_num) > 2:
        return False

    # Check against affected people
    if affected_people > 100 and pred_num < 3:  # >100 people but not high/critical
        return False
    if affected_people > 10 and pred_num == 1:  # >10 people but low severity
        return False

    return True


def get_severity_color(severity: SeverityLevel) -> str:
    """
    Get hex color code for severity level (for UI display).
    """
    colors = {
        SeverityLevel.CRITICAL: "#dc2626",  # red-600
        SeverityLevel.HIGH: "#ea580c",      # orange-600
        SeverityLevel.MODERATE: "#ca8a04",  # yellow-600
        SeverityLevel.LOW: "#16a34a",       # green-600
    }
    return colors.get(severity, "#6b7280")  # gray-500 default


def get_severity_label(severity: SeverityLevel) -> str:
    """
    Get human-readable label for severity level.
    """
    labels = {
        SeverityLevel.CRITICAL: "Critical",
        SeverityLevel.HIGH: "High",
        SeverityLevel.MODERATE: "Moderate",
        SeverityLevel.LOW: "Low",
    }
    return labels.get(severity, "Unknown")