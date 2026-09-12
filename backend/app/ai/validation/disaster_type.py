"""
Disaster type validation utilities.
"""
from typing import Optional
from app.ai.schemas import DisasterType


# Mapping from various disaster type representations to standard types
DISASTER_TYPE_NORMALIZATION_MAP = {
    # Flood variations
    "flood": DisasterType.FLOOD,
    "flooding": DisasterType.FLOOD,
    "flash flood": DisasterType.FLOOD,
    "inundation": DisasterType.FLOOD,
    "water logging": DisasterType.FLOOD,
    "river overflow": DisasterType.FLOOD,

    # Landslide variations
    "landslide": DisasterType.LANDSLIDE,
    "mudslide": DisasterType.LANDSLIDE,
    "rockslide": DisasterType.LANDSLIDE,
    "slope failure": DisasterType.LANDSLIDE,
    "debris flow": DisasterType.LANDSLIDE,
    "mud flow": DisasterType.LANDSLIDE,

    # Earthquake variations
    "earthquake": DisasterType.EARTHQUAKE,
    "quake": DisasterType.EARTHQUAKE,
    "tremor": DisasterType.EARTHQUAKE,
    "seismic": DisasterType.EARTHQUAKE,
    "aftershock": DisasterType.EARTHQUAKE,

    # Fire variations
    "fire": DisasterType.FIRE,
    "wildfire": DisasterType.FIRE,
    "forest fire": DisasterType.FIRE,
    "brush fire": DisasterType.FIRE,
    "structure fire": DisasterType.FIRE,
    "building fire": DisasterType.FIRE,
    "arson": DisasterType.FIRE,

    # Cyclone variations
    "cyclone": DisasterType.CYCLONE,
    "hurricane": DisasterType.CYCLONE,
    "typhoon": DisasterType.CYCLONE,
    "tropical storm": DisasterType.CYCLONE,
    "storm surge": DisasterType.CYCLONE,

    # Storm variations
    "storm": DisasterType.STORM,
    "thunderstorm": DisasterType.STORM,
    "hail": DisasterType.STORM,
    "lightning": DisasterType.STORM,
    "tornado": DisasterType.STORM,
    "twister": DisasterType.STORM,
    "severe weather": DisasterType.STORM,

    # Infrastructure damage
    "infrastructure damage": DisasterType.INFRASTRUCTURE_DAMAGE,
    "building collapse": DisasterType.INFRASTRUCTURE_DAMAGE,
    "bridge collapse": DisasterType.INFRASTRUCTURE_DAMAGE,
    "road damage": DisasterType.INFRASTRUCTURE_DAMAGE,
    "structural damage": DisasterType.INFRASTRUCTURE_DAMAGE,
    "utility damage": DisasterType.INFRASTRUCTURE_DAMAGE,
}


def normalize_disaster_type(disaster_text: str) -> Optional[DisasterType]:
    """
    Normalize free-text disaster type to standard DisasterType.
    Returns None if no match found.
    """
    if not disaster_text:
        return None

    normalized = disaster_text.lower().strip()

    # Direct match
    if normalized in DISASTER_TYPE_NORMALIZATION_MAP:
        return DISASTER_TYPE_NORMALIZATION_MAP[normalized]

    # Check for partial matches
    for variant, standard in DISASTER_TYPE_NORMALIZATION_MAP.items():
        if variant in normalized:
            return standard

    return None


def validate_disaster_type(disaster_type: str) -> bool:
    """
    Check if a string is a valid DisasterType value.
    """
    try:
        DisasterType(disaster_type)
        return True
    except ValueError:
        return False


def get_disaster_type_label(disaster_type: DisasterType) -> str:
    """
    Get human-readable label for disaster type.
    """
    labels = {
        DisasterType.FLOOD: "Flood",
        DisasterType.LANDSLIDE: "Landslide",
        DisasterType.EARTHQUAKE: "Earthquake",
        DisasterType.FIRE: "Fire",
        DisasterType.CYCLONE: "Cyclone",
        DisasterType.STORM: "Storm",
        DisasterType.INFRASTRUCTURE_DAMAGE: "Infrastructure Damage",
        DisasterType.OTHER: "Other",
    }
    return labels.get(disaster_type, "Unknown")


def get_disaster_type_icon(disaster_type: DisasterType) -> str:
    """
    Get emoji icon for disaster type (for UI display).
    """
    icons = {
        DisasterType.FLOOD: "🌊",
        DisasterType.LANDSLIDE: "🏔️",
        DisasterType.EARTHQUAKE: "🌍",
        DisasterType.FIRE: "🔥",
        DisasterType.CYCLONE: "🌀",
        DisasterType.STORM: "⛈️",
        DisasterType.INFRASTRUCTURE_DAMAGE: "🏚️",
        DisasterType.OTHER: "❓",
    }
    return icons.get(disaster_type, "❓")


def get_all_disaster_types() -> list:
    """
    Get list of all supported disaster types.
    """
    return [dt.value for dt in DisasterType]


def is_disaster_type_supported(disaster_type: str) -> bool:
    """
    Check if a disaster type string is supported.
    """
    return validate_disaster_type(disaster_type)