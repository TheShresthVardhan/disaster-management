"""
Landslide Risk Model Configuration
=================================================================
Configuration settings for the landslide risk prediction model.
All values can be overridden via environment variables.
"""
import os
from dataclasses import dataclass, field
from typing import Optional, List


@dataclass
class LandslideConfig:
    """
    Configuration for Landslide Risk Model.
    All values can be overridden via environment variables.
    """

    # Model settings
    model_type: str = field(
        default_factory=lambda: os.getenv("LANDSLIDE_MODEL_TYPE", "random_forest")
    )
    model_path: Optional[str] = field(
        default_factory=lambda: os.getenv("LANDSLIDE_MODEL_PATH")
    )

    # Training settings
    test_size: float = field(
        default_factory=lambda: float(os.getenv("LANDSLIDE_TEST_SIZE", "0.2"))
    )
    validation_size: float = field(
        default_factory=lambda: float(os.getenv("LANDSLIDE_VALIDATION_SIZE", "0.1"))
    )
    random_state: int = field(
        default_factory=lambda: int(os.getenv("LANDSLIDE_RANDOM_STATE", "42"))
    )

    # Random Forest specific
    n_estimators: int = field(
        default_factory=lambda: int(os.getenv("LANDSLIDE_N_ESTIMATORS", "200"))
    )
    max_depth: Optional[int] = field(
        default_factory=lambda: int(os.getenv("LANDSLIDE_MAX_DEPTH", "20")) if os.getenv("LANDSLIDE_MAX_DEPTH") else None
    )
    min_samples_split: int = field(
        default_factory=lambda: int(os.getenv("LANDSLIDE_MIN_SAMPLES_SPLIT", "5"))
    )
    min_samples_leaf: int = field(
        default_factory=lambda: int(os.getenv("LANDSLIDE_MIN_SAMPLES_LEAF", "2"))
    )
    max_features: str = field(
        default_factory=lambda: os.getenv("LANDSLIDE_MAX_FEATURES", "sqrt")
    )
    class_weight: str = field(
        default_factory=lambda: os.getenv("LANDSLIDE_CLASS_WEIGHT", "balanced")
    )

    # Feature engineering
    feature_scaling: bool = field(
        default_factory=lambda: os.getenv("LANDSLIDE_FEATURE_SCALING", "true").lower() == "true"
    )
    handle_missing: str = field(
        default_factory=lambda: os.getenv("LANDSLIDE_HANDLE_MISSING", "median")
    )

    # Risk categories and thresholds
    risk_categories: List[str] = field(
        default_factory=lambda: ["low", "moderate", "high", "critical"]
    )
    risk_thresholds: List[float] = field(
        default_factory=lambda: [0.25, 0.5, 0.75]  # low < 0.25 < moderate < 0.5 < high < 0.75 < critical
    )

    # Model persistence
    model_dir: str = field(
        default_factory=lambda: os.getenv("LANDSLIDE_MODEL_DIR", "models/landslide")
    )
    model_filename: str = field(
        default_factory=lambda: os.getenv("LANDSLIDE_MODEL_FILENAME", "landslide_risk_model.pkl")
    )
    scaler_filename: str = field(
        default_factory=lambda: os.getenv("LANDSLIDE_SCALER_FILENAME", "landslide_scaler.pkl")
    )

    # Feature configuration
    required_features: List[str] = field(
        default_factory=lambda: [
            "rainfall_24h",
            "rainfall_72h",
            "rainfall_7d",
            "soil_moisture",
            "slope",
            "elevation",
            "vegetation_index",
            "soil_type",
            "historical_landslides",
        ]
    )
    optional_features: List[str] = field(
        default_factory=lambda: [
            "rainfall_1h",
            "temperature",
            "humidity",
            "wind_speed",
            "distance_to_fault",
            "distance_to_road",
            "land_cover",
            "geology",
        ]
    )

    # Target configuration
    target_column: str = field(
        default_factory=lambda: os.getenv("LANDSLIDE_TARGET_COLUMN", "risk_category")
    )
    target_type: str = field(
        default_factory=lambda: os.getenv("LANDSLIDE_TARGET_TYPE", "categorical")  # categorical or continuous
    )

    # Training pipeline
    cv_folds: int = field(
        default_factory=lambda: int(os.getenv("LANDSLIDE_CV_FOLDS", "5"))
    )
    n_jobs: int = field(
        default_factory=lambda: int(os.getenv("LANDSLIDE_N_JOBS", "-1"))
    )
    verbose: int = field(
        default_factory=lambda: int(os.getenv("LANDSLIDE_VERBOSE", "1"))
    )

    # Inference settings
    prediction_threshold: float = field(
        default_factory=lambda: float(os.getenv("LANDSLIDE_PREDICTION_THRESHOLD", "0.5"))
    )
    confidence_threshold: float = field(
        default_factory=lambda: float(os.getenv("LANDSLIDE_CONFIDENCE_THRESHOLD", "0.6"))
    )

    # Demo mode
    demo_mode: bool = field(
        default_factory=lambda: os.getenv("LANDSLIDE_DEMO_MODE", "true").lower() == "true"
    )

    # Paths
    data_dir: str = field(
        default_factory=lambda: os.getenv("LANDSLIDE_DATA_DIR", "data/landslide")
    )
    raw_data_path: str = field(
        default_factory=lambda: os.getenv("LANDSLIDE_RAW_DATA_PATH", "data/landslide/raw/landslide_data.csv")
    )
    processed_data_path: str = field(
        default_factory=lambda: os.getenv("LANDSLIDE_PROCESSED_DATA_PATH", "data/landslide/processed/landslide_processed.csv")
    )

    # Logging
    log_level: str = field(
        default_factory=lambda: os.getenv("LANDSLIDE_LOG_LEVEL", "INFO")
    )

    def __post_init__(self):
        """Validate configuration after initialization."""
        if self.test_size <= 0 or self.test_size >= 1:
            raise ValueError("test_size must be between 0 and 1")
        if self.validation_size <= 0 or self.validation_size >= 1:
            raise ValueError("validation_size must be between 0 and 1")
        if self.test_size + self.validation_size >= 1:
            raise ValueError("test_size + validation_size must be less than 1")
        if self.n_estimators <= 0:
            raise ValueError("n_estimators must be positive")
        if len(self.risk_categories) != 4:
            raise ValueError("risk_categories must have exactly 4 categories")
        if len(self.risk_thresholds) != 3:
            raise ValueError("risk_thresholds must have exactly 3 thresholds")

    @property
    def model_path_full(self) -> str:
        """Full path to model file."""
        import os
        return os.path.join(self.model_dir, self.model_filename)

    @property
    def scaler_path_full(self) -> str:
        """Full path to scaler file."""
        import os
        return os.path.join(self.model_dir, self.scaler_filename)


# Global config instance
_config: Optional["LandslideConfig"] = None


def get_landslide_config() -> LandslideConfig:
    """Get global landslide config instance (singleton)."""
    global _config
    if _config is None:
        _config = LandslideConfig()
    return _config


def reset_landslide_config() -> None:
    """Reset global config (useful for testing)."""
    global _config
    _config = None