"""
Provider Registry
=================================================================
Registry for Incident AI providers.
Allows dynamic provider selection and configuration.
"""
from typing import Dict, Optional, Type
from app.ai.models.base import IncidentAIProvider
from app.ai.models.demo_provider import DemoIncidentAIProvider


class ProviderRegistry:
    """
    Registry for managing Incident AI providers.
    Supports dynamic registration and selection of providers.
    """

    def __init__(self):
        self._providers: Dict[str, IncidentAIProvider] = {}
        self._default_provider: Optional[str] = None

    def register(self, provider: IncidentAIProvider, default: bool = False) -> None:
        """
        Register a provider.
        
        Args:
            provider: Provider instance to register
            default: Whether to set as default provider
        """
        if provider.name in self._providers:
            raise ValueError(f"Provider '{provider.name}' already registered")

        self._providers[provider.name] = provider

        if default or self._default_provider is None:
            self._default_provider = provider.name

    def get(self, name: str) -> Optional[IncidentAIProvider]:
        """
        Get a provider by name.
        """
        return self._providers.get(name)

    def get_default(self) -> Optional[IncidentAIProvider]:
        """
        Get the default provider.
        """
        if self._default_provider:
            return self._providers.get(self._default_provider)
        return None

    def list_providers(self) -> Dict[str, dict]:
        """
        List all registered providers with metadata.
        """
        return {
            name: {
                "name": provider.name,
                "version": provider.version,
                "is_demo": provider.is_demo,
            }
            for name, provider in self._providers.items()
        }

    def set_default(self, name: str) -> bool:
        """
        Set the default provider.
        Returns True if successful, False if provider not found.
        """
        if name in self._providers:
            self._default_provider = name
            return True
        return False


# Global registry instance
_registry: Optional[ProviderRegistry] = None


def get_registry() -> ProviderRegistry:
    """
    Get the global provider registry (singleton).
    Initializes with demo provider if empty.
    """
    global _registry
    if _registry is None:
        _registry = ProviderRegistry()
        # Register demo provider by default
        _registry.register(DemoIncidentAIProvider(), default=True)
    return _registry


def get_provider(name: Optional[str] = None) -> IncidentAIProvider:
    """
    Get a provider by name, or the default provider.
    """
    registry = get_registry()
    if name:
        provider = registry.get(name)
        if provider is None:
            raise ValueError(f"Provider '{name}' not found")
        return provider
    return registry.get_default() or DemoIncidentAIProvider()