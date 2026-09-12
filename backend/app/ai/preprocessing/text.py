"""
Text preprocessing utilities for Incident AI.
"""
import re
from typing import List, Optional


# Common disaster-related stop words to keep (don't remove these)
DISASTER_KEEP_WORDS = {
    "flood", "flooding", "landslide", "earthquake", "fire", "wildfire",
    "cyclone", "hurricane", "storm", "tsunami", "damage", "collapse",
    "evacuate", "emergency", "critical", "severe", "urgent", "help",
    "trapped", "injured", "missing", "dead", "death", "rescue",
    "shelter", "relief", "aid", "water", "food", "medical",
    "road", "bridge", "bridge", "building", "home", "house",
    "river", "lake", "sea", "coast", "mountain", "hill", "slope"
}


def clean_text(text: str) -> str:
    """
    Clean and normalize text for processing.
    Preserves disaster-relevant terms.
    """
    if not text:
        return ""

    # Convert to lowercase
    text = text.lower()

    # Remove URLs
    text = re.sub(r'http[s]?://\S+', '', text)

    # Remove email addresses
    text = re.sub(r'\S+@\S+', '', text)

    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)

    # Remove special characters but keep basic punctuation
    text = re.sub(r'[^\w\s\.\,\!\?\-]', ' ', text)

    # Remove extra whitespace again
    text = re.sub(r'\s+', ' ', text).strip()

    return text


def extract_keywords(text: str, max_keywords: int = 20) -> List[str]:
    """
    Extract disaster-relevant keywords from text.
    Simple frequency-based extraction keeping domain terms.
    """
    if not text:
        return []

    cleaned = clean_text(text)
    words = cleaned.split()

    # Filter: keep disaster-relevant words and words > 3 chars
    keywords = [
        w for w in words
        if (w in DISASTER_KEEP_WORDS) or (len(w) > 3 and w.isalpha())
    ]

    # Count frequencies
    freq = {}
    for kw in keywords:
        freq[kw] = freq.get(kw, 0) + 1

    # Sort by frequency
    sorted_keywords = sorted(freq.items(), key=lambda x: x[1], reverse=True)

    return [kw for kw, _ in sorted_keywords[:max_keywords]]


def normalize_severity_text(text: str) -> str:
    """
    Normalize severity-related text to standard terms.
    """
    if not text:
        return ""

    text_lower = text.lower()

    # Map variations to standard terms
    severity_mappings = {
        "catastrophic": "critical",
        "devastating": "critical",
        "extreme": "critical",
        "major": "high",
        "serious": "high",
        "significant": "high",
        "moderate": "moderate",
        "minor": "low",
        "minimal": "low",
        "slight": "low",
    }

    for variant, standard in severity_mappings.items():
        if variant in text_lower:
            return standard

    return text_lower


def extract_location_entities(text: str) -> List[str]:
    """
    Extract potential location entities from text.
    Simple pattern-based extraction for Indian locations.
    """
    if not text:
        return []

    # Common Indian location patterns
    location_patterns = [
        r'\b(?:in|at|near|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:district|city|town|village|area|region)',
        r'\b(?:NH|SH|highway)\s*\d+',
    ]

    locations = []
    for pattern in location_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        locations.extend(matches)

    # Deduplicate
    return list(dict.fromkeys(locations))


def prepare_incident_text(incident_data: dict) -> str:
    """
    Prepare combined text from incident data for analysis.
    Combines description, location, and other text fields.
    """
    parts = []

    if incident_data.get("description"):
        parts.append(incident_data["description"])

    if incident_data.get("location_text"):
        parts.append(incident_data["location_text"])

    # Add disaster type if provided
    if incident_data.get("disaster_type"):
        parts.append(incident_data["disaster_type"])

    return " ".join(parts)


def truncate_text(text: str, max_length: int = 4000) -> str:
    """
    Truncate text to maximum length for model input.
    """
    if not text:
        return ""
    if len(text) <= max_length:
        return text
    return text[:max_length].rsplit(' ', 1)[0] + "..."