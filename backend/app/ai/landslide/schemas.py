"""
Landslide Risk Feature Schemas
=================================================================
Pydantic schemas for landslide risk prediction input/output.
"""
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict
from datetime import datetime


class SoilType(Enum):
    """Standard soil type classifications."""
    CLAY = "clay"
    SILT = "silt"
    SAND = "sand"
    LOAM = "loam"
    PEAT = "peat"
    CHALK = "chalk"
    ROCKY = "rocky"
    MIXED = "mixed"
    UNKNOWN = "unknown"


class LandCover(Enum):
    """Land cover classifications."""
    FOREST = "forest"
    GRASSLAND = "grassland"
    AGRICULTURE = "agriculture"
    URBAN = "urban"
    BARREN = "barren"
    WETLAND = "wetland"
    WATER = "water"
    SNOW_ICE = "snow_ice"
    UNKNOWN = "unknown"


class Geology(Enum):
    """Geological formation types."""
    SEDIMENTARY = "sedimentary"
    METAMORPHIC = "metamorphic"
    IGNEOUS = "igneous"
    VOLCANIC = "volcanic"
    ALLUVIAL = "alluvial"
    COLLUVIAL = "colluvial"
    UNKNOWN = "unknown"


class LandslideRiskCategory(Enum):
    """Landslide risk categories."""
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class SoilTypeInfo(BaseModel):
    """Soil type information with properties."""
    model_config = ConfigDict(use_enum_values=False)
    
    type: SoilType
    cohesion: Optional[float] = Field(default=None, ge=0, description="Soil cohesion in kPa")
    friction_angle: Optional[float] = Field(default=None, ge=0, le=90, description="Internal friction angle in degrees")
    permeability: Optional[float] = Field(default=None, ge=0, description="Hydraulic conductivity in m/s")
    unit_weight: Optional[float] = Field(default=None, ge=0, description="Unit weight in kN/m³")


class LandslideInputFeatures(BaseModel):
    """
    Input features for landslide risk prediction.
    All features should be numeric values where applicable.
    """
    model_config = ConfigDict(use_enum_values=False)
    
    # Rainfall features (mm)
    rainfall_1h: Optional[float] = Field(default=None, ge=0, description="Rainfall in last 1 hour (mm)")
    rainfall_24h: float = Field(ge=0, description="Rainfall in last 24 hours (mm)")
    rainfall_72h: float = Field(ge=0, description="Rainfall in last 72 hours (mm)")
    rainfall_7d: float = Field(ge=0, description="Rainfall in last 7 days (mm)")

    # Soil moisture
    soil_moisture: Optional[float] = Field(
        default=None, ge=0, le=1,
        description="Volumetric water content (0-1) or percentage (0-100)"
    )

    # Topographic features
    slope: float = Field(ge=0, le=90, description="Slope angle in degrees")
    elevation: float = Field(ge=0, description="Elevation in meters")
    aspect: Optional[float] = Field(default=None, ge=0, le=360, description="Aspect in degrees (0=N, 90=E, 180=S, 270=W)")
    curvature: Optional[float] = Field(default=None, description="Plan/profile curvature")

    # Vegetation
    vegetation_index: Optional[float] = Field(
        default=None, ge=-1, le=1,
        description="NDVI or similar vegetation index (-1 to 1)"
    )
    land_cover: Optional[str] = Field(default=None)

    # Soil properties
    soil_type: Optional[str] = Field(default=None)
    soil_depth: Optional[float] = Field(default=None, ge=0, description="Soil depth in meters")
    soil_cohesion: Optional[float] = Field(default=None, ge=0, description="Soil cohesion in kPa")
    soil_friction_angle: Optional[float] = Field(default=None, ge=0, le=90, description="Friction angle in degrees")
    soil_permeability: Optional[float] = Field(default=None, ge=0, description="Permeability in m/s")

    # Geological features
    geology: Optional[str] = Field(default=None)
    distance_to_fault: Optional[float] = Field(default=None, ge=0, description="Distance to nearest fault in km")
    distance_to_road: Optional[float] = Field(default=None, ge=0, description="Distance to nearest road in km")
    distance_to_stream: Optional[float] = Field(default=None, ge=0, description="Distance to nearest stream in km")

    # Historical data
    historical_landslides: int = Field(
        default=0, ge=0,
        description="Number of historical landslides in the area"
    )
    last_landslide_date: Optional[str] = Field(
        default=None,
        description="Date of last known landslide (ISO format)"
    )
    landslide_frequency: Optional[float] = Field(
        default=None, ge=0,
        description="Average landslides per year in the area"
    )

    # Weather
    temperature: Optional[float] = Field(default=None, description="Air temperature in Celsius")
    humidity: Optional[float] = Field(default=None, ge=0, le=100, description="Relative humidity percentage")
    wind_speed: Optional[float] = Field(default=None, ge=0, description="Wind speed in m/s")

    # Additional metadata
    location_name: Optional[str] = Field(default=None, description="Location name/identifier")
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow)

    @field_validator("soil_moisture")
    @classmethod
    def validate_soil_moisture(cls, v: Optional[float]) -> Optional[float]:
        """Normalize soil moisture to 0-1 range if provided as percentage."""
        if v is not None and v > 1:
            return v / 100.0
        return v

    @field_validator("soil_type", mode="before")
    @classmethod
    def validate_soil_type(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return SoilType.UNKNOWN.value
        try:
            SoilType(v)
            return v
        except ValueError:
            return SoilType.UNKNOWN.value

    @field_validator("land_cover")
    @classmethod
    def validate_land_cover(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return LandCover.UNKNOWN.value
        try:
            LandCover(v)
            return v
        except ValueError:
            return LandCover.UNKNOWN.value

    @field_validator("geology")
    @classmethod
    def validate_geology(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return Geology.UNKNOWN.value
        try:
            Geology(v)
            return v
        except ValueError:
            return Geology.UNKNOWN.value

    @field_validator("historical_landslides")
    @classmethod
    def validate_historical_landslides(cls, v: int) -> int:
        if v < 0:
            raise ValueError("historical_landslides must be non-negative")
        return v

    @field_validator("land_cover", "geology", mode="before")
    @classmethod
    def normalize_enum_strings(cls, v: Optional[str]) -> Optional[str]:
        """Normalize enum string values to lowercase."""
        if v is None:
            return None
        return v.lower().strip()


class LandslideRiskResult(BaseModel):
    """
    Output schema for landslide risk prediction.
    """
    model_config = ConfigDict(use_enum_values=False)
    
    risk_category: 'LandslideRiskCategory' = Field(
        description="Predicted landslide risk category"
    )
    risk_score: float = Field(
        ge=0.0, le=1.0,
        description="Continuous risk score (0-1)"
    )
    confidence: float = Field(
        ge=0.0, le=1.0,
        description="Model confidence in prediction"
    )
    risk_probabilities: Dict[str, float] = Field(
        description="Probability for each risk category"
    )
    risk_factors: List[str] = Field(
        default_factory=list,
        description="Key contributing factors to the risk assessment"
    )
    feature_contributions: Optional[Dict[str, float]] = Field(
        default=None,
        description="Feature importance/contribution for this prediction"
    )
    infrastructure_at_risk: Optional[List[str]] = Field(
        default=None,
        description="Types of infrastructure potentially at risk"
    )
    recommended_actions: List[str] = Field(
        default_factory=list,
        description="AI-recommended immediate actions for responders/public"
    )
    model_version: str = Field(
        description="Version identifier of the model used (e.g., 'demo-v1', 'sklearn-v0.1')"
    )
    processing_time_ms: int = Field(
        ge=0,
        description="Time taken for AI inference in milliseconds"
    )
    is_demo: bool = Field(
        default=False,
        description="True if result came from demo/mock provider, not a trained model"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Prediction timestamp"
    )


class LandslideRiskRequest(BaseModel):
    """Request model for landslide risk analysis."""
    features: 'LandslideInputFeatures' = Field(..., description="Environmental features for risk assessment")
    return_probabilities: bool = Field(default=True, description="Whether to return probability distribution")
    return_feature_contributions: bool = Field(default=False, description="Whether to return feature importance")


class LandslideRiskResponse(BaseModel):
    """Response model for landslide risk analysis."""
    success: bool
    result: Optional['LandslideRiskResult'] = None
    error: Optional[str] = None
    processing_time_ms: int
    provider: str
    is_demo: bool


class LandslidePredictionBatchRequest(BaseModel):
    """Request for batch landslide risk prediction."""
    locations: List['LandslideInputFeatures'] = Field(..., description="List of locations to analyze")
    return_probabilities: bool = Field(default=True, description="Whether to return probability distribution")
    return_feature_contributions: bool = Field(default=False, description="Whether to return feature importance")


class LandslidePredictionBatchResponse(BaseModel):
    """Response model for batch landslide risk prediction."""
    success: bool
    results: List['LandslideRiskResult'] = []
    error: Optional[str] = None
    processing_time_ms: int
    provider: str
    is_demo: bool


class LandslideTrainingData(BaseModel):
    """Schema for landslide training data records."""
    features: 'LandslideInputFeatures'
    target: 'LandslideRiskCategory'
    target_score: Optional[float] = Field(default=None, ge=0, le=1)
    source: str = Field(description="Data source identifier")
    verified: bool = Field(default=False, description="Whether the record has been verified")


# Forward references
LandslideInputFeatures.model_rebuild()
LandslideRiskResult.model_rebuild()