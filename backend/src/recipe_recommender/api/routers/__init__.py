"""API routers, re-exported for the application factory."""

from __future__ import annotations

from recipe_recommender.api.routers.health import router as health_router
from recipe_recommender.api.routers.recipes import router as recipes_router
from recipe_recommender.api.routers.settings import router as settings_router

__all__ = ["health_router", "recipes_router", "settings_router"]
