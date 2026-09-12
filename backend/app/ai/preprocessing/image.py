"""
Image preprocessing interface for Incident AI.
=================================================================
⚠️  IMAGE MODEL NOT IMPLEMENTED YET - PHASE 5B+
=================================================================

This module defines the interface for image preprocessing.
Actual image model integration will happen in Phase 5B or later.

The interface is designed to be pluggable so that different
image models (CNN, ViT, CLIP, etc.) can be integrated without
changing the calling code.
"""
from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from dataclasses import dataclass


@dataclass
class ImageFeatures:
    """
    Extracted features from an incident image.
    This is what an image model would output for fusion with text.
    """
    # Classification probabilities for disaster types
    disaster_type_probs: Dict[str, float]

    # Severity probability distribution
    severity_probs: Dict[str, float]

    # Detected objects/entities (e.g., "flooded road", "collapsed building")
    detected_objects: List[Dict[str, Any]]

    # Scene classification (indoor/outdoor, day/night, etc.)
    scene_class: Optional[str] = None

    # Quality/confidence of the image itself
    image_quality: float = 1.0

    # Raw model embeddings (for advanced fusion)
    embeddings: Optional[List[float]] = None


class ImagePreprocessor(ABC):
    """
    Abstract base class for image preprocessing.
    Different models (CNN, ViT, CLIP, etc.) can implement this interface.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Model identifier (e.g., 'resnet50', 'vit-base', 'clip-vit')."""
        pass

    @property
    @abstractmethod
    def input_size(self) -> tuple:
        """Expected input image size as (height, width)."""
        pass

    @property
    @abstractmethod
    def supported_formats(self) -> List[str]:
        """Supported image formats (e.g., ['JPEG', 'PNG', 'WEBP'])."""
        pass

    @abstractmethod
    def preprocess(self, image_bytes: bytes) -> Any:
        """
        Preprocess raw image bytes for model input.
        Returns model-specific tensor/array.
        """
        pass

    @abstractmethod
    def extract_features(self, preprocessed_image: Any) -> ImageFeatures:
        """
        Run model inference and extract structured features.
        """
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Check if model weights and dependencies are available."""
        pass


class MockImagePreprocessor(ImagePreprocessor):
    """
    DEMO/MOCK image preprocessor.
    Returns placeholder features for testing pipeline without real model.
    """
    name = "mock"
    input_size = (224, 224)
    supported_formats = ["JPEG", "PNG", "WEBP"]

    def preprocess(self, image_bytes: bytes) -> dict:
        """Return mock preprocessed data."""
        return {"mock": True, "size": len(image_bytes)}

    def extract_features(self, preprocessed_image: Any) -> ImageFeatures:
        """Return mock features."""
        return ImageFeatures(
            disaster_type_probs={
                "flood": 0.15,
                "landslide": 0.10,
                "earthquake": 0.05,
                "fire": 0.20,
                "cyclone": 0.10,
                "storm": 0.15,
                "infrastructure_damage": 0.15,
                "other": 0.10,
            },
            severity_probs={
                "low": 0.25,
                "moderate": 0.35,
                "high": 0.25,
                "critical": 0.15,
            },
            detected_objects=[
                {"label": "flooded road", "confidence": 0.7},
                {"label": "water", "confidence": 0.9},
            ],
            scene_class="outdoor",
            image_quality=0.8,
        )

    def is_available(self) -> bool:
        return True


def get_image_preprocessor(name: str = "mock") -> ImagePreprocessor:
    """
    Factory function to get an image preprocessor by name.
    In Phase 5B+, this will load actual model weights.
    """
    if name == "mock":
        return MockImagePreprocessor()
    # Future: elif name == "resnet50": return ResNet50Preprocessor()
    # Future: elif name == "vit": return ViTPreprocessor()
    # Future: elif name == "clip": return CLIPPreprocessor()
    raise ValueError(f"Unknown image preprocessor: {name}")