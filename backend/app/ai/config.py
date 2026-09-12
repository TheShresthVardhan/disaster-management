"""
AI Configuration
=================================================================
Configuration settings for Incident AI module.
Uses environment variables with sensible defaults.
"""
import os
from typing import Optional
from dataclasses import dataclass, field


@dataclass
class AIConfig:
    """
    Configuration for Incident AI module.
    All values can be overridden via environment variables.
    """

    # Provider selection
    default_provider: str = field(
        default_factory=lambda: os.getenv("AI_DEFAULT_PROVIDER", "demo")
    )

    # Demo provider settings
    demo_enabled: bool = field(
        default_factory=lambda: os.getenv("AI_DEMO_ENABLED", "true").lower() == "true"
    )

    # Model settings (for future real models)
    model_path: Optional[str] = field(
        default_factory=lambda: os.getenv("AI_MODEL_PATH")
    )
    model_device: str = field(
        default_factory=lambda: os.getenv("AI_MODEL_DEVICE", "cpu")
    )

    # Confidence thresholds
    min_confidence_threshold: float = field(
        default_factory=lambda: float(os.getenv("AI_MIN_CONFIDENCE", "0.3"))
    )
    high_confidence_threshold: float = field(
        default_factory=lambda: float(os.getenv("AI_HIGH_CONFIDENCE", "0.75"))
    )

    # Processing limits
    max_text_length: int = field(
        default_factory=lambda: int(os.getenv("AI_MAX_TEXT_LENGTH", "4000"))
    )
    max_image_size_mb: int = field(
        default_factory=lambda: int(os.getenv("AI_MAX_IMAGE_MB", "5"))
    )
    request_timeout_seconds: int = field(
        default_factory=lambda: int(os.getenv("AI_REQUEST_TIMEOUT", "30"))
    )

    # Feature flags
    enable_image_analysis: bool = field(
        default_factory=lambda: os.getenv("AI_ENABLE_IMAGE", "false").lower() == "true"
    )
    enable_real_time_updates: bool = field(
        default_factory=lambda: os.getenv("AI_REALTIME", "false").lower() == "true"
    )

    # Logging
    log_level: str = field(
        default_factory=lambda: os.getenv("AI_LOG_LEVEL", "INFO")
    )
    log_predictions: bool = field(
        default_factory=lambda: os.getenv("AI_LOG_PREDICTIONS", "false").lower() == "true"
    )

    def __post_init__(self):
        """Validate config after initialization."""
        if self.min_confidence_threshold < 0 or self.min_confidence_threshold > 1:
            raise ValueError("min_confidence_threshold must be between 0 and 1")
        if self.high_confidence_threshold < 0 or self.high_confidence_threshold > 1:
            raise ValueError("high_confidence_threshold must be between 0 and 1")
        if self.max_text_length <= 0:
            raise ValueError("max_text_length must be positive")
        if self.max_image_size_mb <= 0:
            raise ValueError("max_image_size_mb must be positive")
        if self.request_timeout_seconds <= 0:
            raise ValueError("request_timeout_seconds must be positive")


# Global config instance
_config: Optional[AIConfig] = None


def get_config() -> AIConfig:
    """
    Get global AI configuration (singleton).
    """
    global _config
    if _config is None:
        _config = AIConfig()
    return _config


def reset_config() -> None:
    """
    Reset global config (useful for testing).
    """
    global _config
    _config = None