"""
Input validation utilities for Incident AI.
These are unit-testable functions that can be used independently.
"""
from typing import Optional, List, Tuple
from app.ai.schemas import DisasterType, SeverityLevel


def validate_incident_description(description: str) -> Tuple[bool, Optional[str]]:
    """
    Validate incident description text.
    Returns (is_valid, error_message).
    """
    if not description or not description.strip():
        return False, "Description is required"

    if len(description.strip()) < 10:
        return False, "Description must be at least 10 characters"

    if len(description) > 5000:
        return False, "Description must not exceed 5000 characters"

    return True, None


def validate_affected_people(count: int) -> Tuple[bool, Optional[str]]:
    """
    Validate affected people count.
    Returns (is_valid, error_message).
    """
    if count < 0:
        return False, "Affected people count cannot be negative"

    if count > 100000:
        return False, "Affected people count exceeds reasonable maximum"

    return True, None


def validate_coordinates(latitude: Optional[float], longitude: Optional[float]) -> Tuple[bool, Optional[str]]:
    """
    Validate latitude and longitude coordinates.
    Returns (is_valid, error_message).
    """
    if latitude is not None:
        if not (-90 <= latitude <= 90):
            return False, f"Invalid latitude: {latitude}. Must be between -90 and 90"

    if longitude is not None:
        if not (-180 <= longitude <= 180):
            return False, f"Invalid longitude: {longitude}. Must be between -180 and 180"

    return True, None


def validate_image_url(url: Optional[str]) -> Tuple[bool, Optional[str]]:
    """
    Validate image URL format.
    Returns (is_valid, error_message).
    """
    if url is None:
        return True, None

    if not (url.startswith("http://") or url.startswith("https://")):
        return False, "Image URL must be a valid HTTP/HTTPS URL"

    return True, None


def validate_incident_input(incident_data: dict) -> Tuple[bool, List[str]]:
    """
    Comprehensive validation of incident input data.
    Returns (is_valid, list_of_errors).
    """
    errors = []

    # Description
    desc_valid, desc_error = validate_incident_description(incident_data.get("description", ""))
    if not desc_valid:
        errors.append(f"description: {desc_error}")

    # Affected people
    if "affected_people" in incident_data:
        ap_valid, ap_error = validate_affected_people(incident_data["affected_people"])
        if not ap_valid:
            errors.append(f"affected_people: {ap_error}")

    # Coordinates
    lat_valid, lat_error = validate_coordinates(
        incident_data.get("latitude"),
        incident_data.get("longitude")
    )
    if not lat_valid:
        errors.append(lat_error)

    # Image URL
    img_valid, img_error = validate_image_url(incident_data.get("image_url"))
    if not img_valid:
        errors.append(f"image_url: {img_error}")

    # Disaster type (if provided)
    if incident_data.get("disaster_type"):
        try:
            DisasterType(incident_data["disaster_type"])
        except ValueError:
            valid_types = [dt.value for dt in DisasterType]
            errors.append(f"disaster_type: must be one of {valid_types}")

    # Reported severity (if provided)
    if incident_data.get("reported_severity"):
        try:
            SeverityLevel(incident_data["reported_severity"])
        except ValueError:
            valid_levels = [sl.value for sl in SeverityLevel]
            errors.append(f"reported_severity: must be one of {valid_levels}")

    return len(errors) == 0, errors


def validate_image_file(file_obj) -> Tuple[bool, Optional[str]]:
    """
    Validate uploaded image file (FastAPI UploadFile or similar).
    Returns (is_valid, error_message).
    """
    if not file_obj:
        return False, "No file provided"

    # Check filename
    if not hasattr(file_obj, "filename") or not file_obj.filename:
        return False, "No filename provided"

    # Check file extension
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}
    filename_lower = file_obj.filename.lower()
    if not any(filename_lower.endswith(ext) for ext in allowed_extensions):
        return False, f"Unsupported file extension. Allowed: {', '.join(allowed_extensions)}"

    # Check content type if available
    if hasattr(file_obj, "content_type") and file_obj.content_type:
        allowed_types = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}
        if file_obj.content_type not in allowed_types:
            return False, f"Unsupported content type: {file_obj.content_type}"

    return True, None