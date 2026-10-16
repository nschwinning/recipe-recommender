"""Recipe-of-the-day router. Mounted under ``/api/v1``."""

from __future__ import annotations

import hmac
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from recipe_recommender.api.schemas import RecipeOfTheDayRead
from recipe_recommender.config import settings
from recipe_recommender.database import get_db
from recipe_recommender.recipes.service import get_or_create_recipe_of_the_day

logger = logging.getLogger(__name__)

router = APIRouter(tags=["recipes"])

DbSession = Annotated[Session, Depends(get_db)]


def require_valid_cron_token(
    x_cron_token: Annotated[str | None, Header()] = None,
) -> None:
    """Reject the request unless ``X-Cron-Token`` matches the configured secret.

    An empty configured token means no valid token exists, so every request is
    rejected: the daily generation must be explicitly enabled by configuring a
    non-empty ``RECIPE_CRON_TOKEN``.
    """
    expected = settings.RECIPE_CRON_TOKEN
    if (
        not expected
        or not x_cron_token
        or not hmac.compare_digest(x_cron_token, expected)
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing cron token",
        )


@router.get("/recipe-of-the-day", response_model=RecipeOfTheDayRead)
def read_recipe_of_the_day(db: DbSession) -> RecipeOfTheDayRead:
    """Return today's recipe, generating it on demand if it does not exist yet."""
    recipe = get_or_create_recipe_of_the_day(db)
    return RecipeOfTheDayRead.model_validate(recipe)


@router.post(
    "/recipe-of-the-day/generate",
    response_model=RecipeOfTheDayRead,
    status_code=status.HTTP_200_OK,
)
def generate_recipe_of_the_day(
    db: DbSession,
    _token: Annotated[None, Depends(require_valid_cron_token)],
) -> RecipeOfTheDayRead:
    """Cron-triggered daily generation. Idempotent: re-reads today's if present."""
    recipe = get_or_create_recipe_of_the_day(db)
    return RecipeOfTheDayRead.model_validate(recipe)
