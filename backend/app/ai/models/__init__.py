"""
AI Model Providers Package
=================================================================
This package contains the base provider interface and available implementations.
"""

from app.ai.models.base import IncidentAIProvider

# Import available providers
from app.ai.models.demo_provider import DemoIncidentAIProvider

__all__ = [
    "IncidentAIProvider",
    "DemoIncidentAIProvider",
]