"""
Abstract base interface for Incident AI providers.
This allows plugging in different models (sklearn, torch, tensorflow, cloud APIs, etc.)
without changing the calling code.
"""
from abc import ABC, abstractmethod
from typing import Optional
from app.ai.schemas import IncidentInput, IncidentAIResult


class IncidentAIProvider(ABC):
    """
    Abstract base class for Incident AI providers.
    All providers must implement the analyze method.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique identifier for this provider (e.g., 'demo', 'sklearn', 'torch')."""
        pass

    @property
    @abstractmethod
    def version(self) -> str:
        """Version string for this provider (e.g., '1.0', 'demo-v1')."""
        pass

    @property
    @abstractmethod
    def is_demo(self) -> bool:
        """True if this is a demo/mock provider, not a trained model."""
        pass

    @abstractmethod
    async def analyze(self, incident: IncidentInput) -> IncidentAIResult:
        """
        Analyze an incident and return AI assessment.
        
        Args:
            incident: Validated incident input data
            
        Returns:
            IncidentAIResult with AI predictions and assessments
            
        Raises:
            ValueError: If input validation fails
            RuntimeError: If model inference fails
        """
        pass

    async def health_check(self) -> dict:
        """
        Optional health check for the provider.
        Override if provider needs initialization or has external dependencies.
        """
        return {"status": "ok", "provider": self.name}