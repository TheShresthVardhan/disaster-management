"""
Preprocessing Package
=================================================================
Text and image preprocessing utilities for Incident AI.
"""
from app.ai.preprocessing.text import (
    clean_text,
    extract_keywords,
    normalize_severity_text,
    extract_location_entities,
    prepare_incident_text,
    truncate_text,
)

# Image preprocessing (interface only - no model yet)
from app.ai.preprocessing.image import (
    ImageFeatures,
    ImagePreprocessor,
    MockImagePreprocessor,
    get_image_preprocessor,
)

__all__ = [
    # Text
    "clean_text",
    "extract_keywords",
    "normalize_severity_text",
    "extract_location_entities",
    "prepare_incident_text",
    "truncate_text",
    # Image
    "ImageFeatures",
    "ImagePreprocessor",
    "MockImagePreprocessor",
    "get_image_preprocessor",
]