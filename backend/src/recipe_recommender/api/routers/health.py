"""Health router. Unprefixed (``/health``)."""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from recipe_recommender.api.schemas import HealthResponse
from recipe_recommender.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])

DbSession = Annotated[Session, Depends(get_db)]


@router.get("/health", response_model=HealthResponse)
def get_health(db: DbSession) -> HealthResponse:
    """Report liveness plus a real database round-trip. Always HTTP 200."""
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        logger.exception("Health check database probe failed")
        return HealthResponse(status="degraded", database="disconnected")
    return HealthResponse(status="ok", database="connected")
