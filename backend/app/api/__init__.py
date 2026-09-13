"""
API Package
=================================================================
API routes for the Disaster Intelligence System.
"""
from app.api.ai import router as ai_router
from app.api.landslide import router as landslide_router

__all__ = ['ai_router', 'landslide_router']