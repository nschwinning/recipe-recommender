"""FastAPI application factory."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from recipe_recommender.api.routers import health_router, recipes_router
from recipe_recommender.config import settings


def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""
    app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Health is unprefixed; resource routers mount under /api/v1.
    app.include_router(health_router)
    app.include_router(recipes_router, prefix="/api/v1")

    return app


app = create_app()
