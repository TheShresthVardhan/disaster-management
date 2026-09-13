"""
Landslide Risk Validation Module
=================================================================
Validation utilities for landslide risk prediction inputs/outputs.
"""
from typing import Optional, List, Tuple, Any, Dict
from app.ai.landslide.schemas import (
    LandslideInputFeatures,
    LandslideRiskResult,
    LandslideRiskCategory,
    SoilType,
    LandCover,
    Geology
)


def validate_landslide_input(features: 'LandslideInputFeatures') -> Tuple[bool, List[str]]:
    """
    Validate landslide input features.
    
    Args:
        features: LandslideInputFeatures to validate
        
    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []
    data = features.model_dump()
    
    # Validate rainfall fields
    for field in ['rainfall_1h', 'rainfall_24h', 'rainfall_72h', 'rainfall_7d']:
        val = data.get(field)
        if val is not None and val < 0:
            errors.append(f"{field}: must be non-negative")
    
    # Validate soil moisture
    sm = data.get('soil_moisture')
    if sm is not None and (sm < 0 or sm > 1):
        errors.append("soil_moisture: must be between 0 and 1")
    
    # Validate slope
    slope = data.get('slope')
    if slope is not None and (slope < 0 or slope > 90):
        errors.append("slope: must be between 0 and 90 degrees")
    
    # Validate elevation
    elev = data.get('elevation')
    if elev is not None and elev < 0:
        errors.append("elevation: must be non-negative")
    
    # Validate aspect
    aspect = data.get('aspect')
    if aspect is not None and (aspect < 0 or aspect > 360):
        errors.append("aspect: must be between 0 and 360 degrees")
    
    # Validate vegetation index
    vi = data.get('vegetation_index')
    if vi is not None and (vi < -1 or vi > 1):
        errors.append("vegetation_index: must be between -1 and 1")
    
    # Validate coordinates
    lat = data.get('latitude')
    lon = data.get('longitude')
    if lat is not None and (lat < -90 or lat > 90):
        errors.append("latitude: must be between -90 and 90")
    if lon is not None and (lon < -180 or lon > 180):
        errors.append("longitude: must be between -180 and 180")
    
    # Validate affected people
    affected = data.get('affected_people', 0)
    if affected < 0:
        errors.append("affected_people: must be non-negative")
    
    # Validate historical landslides
    hist = data.get('historical_landslides', 0)
    if hist < 0:
        errors.append("historical_landslides: must be non-negative")
    
    # Validate categorical enums
    if data.get('soil_type') and data['soil_type'] not in [e.value for e in SoilType]:
        errors.append(f"soil_type: must be one of {[e.value for e in SoilType]}")
    
    if data.get('land_cover') and data['land_cover'] not in [e.value for e in LandCover]:
        errors.append(f"land_cover: must be one of {[e.value for e in LandCover]}")
    
    if data.get('geology') and data['geology'] not in [e.value for e in Geology]:
        errors.append(f"geology: must be one of {[e.value for e in Geology]}")
    
    # Validate enums by trying to construct
    try:
        if data.get('soil_type'):
            SoilType(data['soil_type'])
    except ValueError as e:
        errors.append(f"soil_type: {str(e)}")
    
    try:
        if data.get('land_cover'):
            LandCover(data['land_cover'])
    except ValueError as e:
        errors.append(f"land_cover: {str(e)}")
    
    try:
        if data.get('geology'):
            Geology(data['geology'])
    except ValueError as e:
        errors.append(f"geology: {str(e)}")
    
    return len(errors) == 0, errors


def validate_landslide_risk_result(result: 'LandslideRiskResult') -> Tuple[bool, List[str]]:
    """
    Validate landslide risk result.
    
    Args:
        result: LandslideRiskResult to validate
        
    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []
    
    # Validate risk category
    try:
        LandslideRiskCategory(result.risk_category)
    except ValueError:
        errors.append(f"Invalid risk_category: {result.risk_category}")
    
    # Validate risk score
    if not 0 <= result.risk_score <= 1:
        errors.append(f"risk_score must be between 0 and 1, got {result.risk_score}")
    
    # Validate confidence
    if not 0 <= result.confidence <= 1:
        errors.append(f"confidence must be between 0 and 1, got {result.confidence}")
    
    # Validate probabilities sum to ~1
    if result.risk_probabilities:
        total = sum(result.risk_probabilities.values())
        if abs(total - 1.0) > 0.01:
            errors.append(f"Risk probabilities sum to {total:.4f}, expected ~1.0")
        
        # Check all categories present
        for cat in LandslideRiskCategory:
            if cat.value not in result.risk_probabilities:
                errors.append(f"Missing probability for category: {cat.value}")
    
    # Validate timestamp
    if result.timestamp is None:
        errors.append("timestamp is required")
    
    return len(errors) == 0, errors


def validate_environmental_features(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validate raw environmental feature dictionary.
    
    Args:
        data: Raw feature dictionary
        
    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    # Convert to model for validation
    try:
        features = LandslideInputFeatures(**data)
        return validate_landslide_input(features)
    except Exception as e:
        return False, [f"Invalid feature data: {str(e)}"]


def validate_coordinates(latitude: float, longitude: float) -> Tuple[bool, List[str]]:
    """
    Validate geographic coordinates.
    
    Args:
        latitude: Latitude in degrees
        longitude: Longitude in degrees
        
    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []
    
    if not (-90 <= latitude <= 90):
        errors.append(f"Invalid latitude: {latitude} (must be between -90 and 90)")
    
    if not (-180 <= longitude <= 180):
        errors.append(f"Invalid longitude: {longitude} (must be between -180 and 180)")
    
    return len(errors) == 0, errors


def validate_risk_category(category: str) -> bool:
    """
    Validate risk category string.
    
    Args:
        category: Risk category string
        
    Returns:
        True if valid
    """
    try:
        LandslideRiskCategory(category)
        return True
    except ValueError:
        return False


def get_risk_category_from_score(score: float) -> LandslideRiskCategory:
    """
    Convert continuous risk score to risk category.
    
    Args:
        score: Risk score between 0 and 1
        
    Returns:
        LandslideRiskCategory
    """
    if score < 0.25:
        return LandslideRiskCategory.LOW
    elif score < 0.5:
        return LandslideRiskCategory.MODERATE
    elif score < 0.75:
        return LandslideRiskCategory.HIGH
    else:
        return LandslideRiskCategory.CRITICAL


def validate_feature_completeness(
    features: 'LandslideInputFeatures',
    required_only: bool = True
) -> Tuple[float, List[str]]:
    """
    Check feature completeness.
    
    Args:
        features: Input features
        required_only: If True, check only required features
        
    Returns:
        Tuple of (completeness_ratio, list_of_missing_features)
    """
    from app.ai.landslide.config import get_landslide_config
    config = get_landslide_config()
    
    data = features.model_dump()
    
    if required_only:
        check_fields = config.required_features
    else:
        check_fields = config.required_features + config.optional_features
    
    present = 0
    missing = []
    
    for field in check_fields:
        val = features.__dict__.get(field)
        if val is not None:
            present += 1
        else:
            missing.append(field)
    
    completeness = present / len(check_fields) if check_fields else 1.0
    
    return completeness, missing


def sanitize_input_features(features: 'LandslideInputFeatures') -> 'LandslideInputFeatures':
    """
    Sanitize input features by clamping values to valid ranges.
    
    Args:
        features: Input features
        
    Returns:
        Sanitized LandslideInputFeatures
    """
    data = features.model_dump()
    
    # Clamp rainfall
    for field in ['rainfall_1h', 'rainfall_24h', 'rainfall_72h', 'rainfall_7d']:
        if data.get(field) is not None:
            data[field] = max(0, data[field])
    
    # Clamp soil moisture
    if data.get('soil_moisture') is not None:
        data['soil_moisture'] = max(0.0, min(1.0, data['soil_moisture']))
    
    # Clamp slope
    if data.get('slope') is not None:
        data['slope'] = max(0.0, min(90.0, data['slope']))
    
    # Clamp elevation
    if data.get('elevation') is not None:
        data['elevation'] = max(0.0, data['elevation'])
    
    # Clamp vegetation index
    if data.get('vegetation_index') is not None:
        data['vegetation_index'] = max(-1.0, min(1.0, data['vegetation_index']))
    
    # Clamp coordinates
    if data.get('latitude') is not None:
        data['latitude'] = max(-90.0, min(90.0, data['latitude']))
    if data.get('longitude') is not None:
        data['longitude'] = max(-180.0, min(180.0, data['longitude']))
    
    # Ensure non-negative
    for field in ['affected_people', 'historical_landslides']:
        if data.get(field) is not None:
            data[field] = max(0, int(data[field]))
    
    # Normalize enums
    for field, enum_class in [
        ('soil_type', SoilType),
        ('land_cover', LandCover),
        ('geology', Geology),
    ]:
        if data.get(field):
            try:
                enum_class(data[field])
            except ValueError:
                data[field] = list(enum_class)[-1].value  # Default to UNKNOWN
    
    return features.__class__(**data)