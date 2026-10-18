"""Recipe-of-the-day router. Mounted under ``/api/v1``."""

from __future__ import annotations

import hmac
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from recipe_recommender.api.schemas import (
    RecipeCreate,
    RecipeDraftRead,
    RecipeOfTheDayRead,
    RecipeParseRequest,
    RecipeRead,
    RecipeSuggestRequest,
    RecipeTagsUpdate,
)
from recipe_recommender.config import settings
from recipe_recommender.database import get_db
from recipe_recommender.recipes.models import RecipeOfTheDay
from recipe_recommender.recipes.service import (
    create_recipe,
    get_or_create_recipe_of_the_day,
    get_saved_recipe_for_rotd,
    like_recipe_of_the_day,
    list_saved_recipes,
    parse_recipe_text,
    set_recipe_of_the_day_tags,
    suggest_recipe,
    unlike_recipe_of_the_day,
)

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
    if not expected or not x_cron_token or not hmac.compare_digest(x_cron_token, expected):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing cron token",
        )


def _rotd_read(db: Session, recipe: RecipeOfTheDay) -> RecipeOfTheDayRead:
    """Build the read model, flagging whether this day's recipe has been liked."""
    saved = get_saved_recipe_for_rotd(db, recipe.id)
    read = RecipeOfTheDayRead.model_validate(recipe)
    read.saved_recipe_id = saved.id if saved is not None else None
    return read


@router.get("/recipe-of-the-day", response_model=RecipeOfTheDayRead)
def read_recipe_of_the_day(db: DbSession) -> RecipeOfTheDayRead:
    """Return today's recipe, generating it on demand if it does not exist yet."""
    recipe = get_or_create_recipe_of_the_day(db)
    return _rotd_read(db, recipe)


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
    return _rotd_read(db, recipe)


@router.patch("/recipe-of-the-day/tags", response_model=RecipeOfTheDayRead)
def update_today_tags(db: DbSession, body: RecipeTagsUpdate) -> RecipeOfTheDayRead:
    """Replace today's recipe tags (syncing the saved copy if it has been liked)."""
    recipe = set_recipe_of_the_day_tags(db, body.tags)
    return _rotd_read(db, recipe)


@router.post(
    "/recipe-of-the-day/like",
    response_model=RecipeRead,
    status_code=status.HTTP_200_OK,
)
def like_today(db: DbSession) -> RecipeRead:
    """Save today's recipe to the reusable library. Idempotent per day."""
    saved = like_recipe_of_the_day(db)
    return RecipeRead.model_validate(saved)


@router.delete("/recipe-of-the-day/like", status_code=status.HTTP_204_NO_CONTENT)
def unlike_today(db: DbSession) -> None:
    """Remove today's recipe from the library. No-op if it was never liked."""
    unlike_recipe_of_the_day(db)


@router.get("/recipes", response_model=list[RecipeRead])
def list_recipes(db: DbSession) -> list[RecipeRead]:
    """Return all saved recipes in the library, newest first."""
    return [RecipeRead.model_validate(recipe) for recipe in list_saved_recipes(db)]


@router.post("/recipes/parse", response_model=RecipeDraftRead)
def parse_recipe(db: DbSession, body: RecipeParseRequest) -> RecipeDraftRead:
    """Parse pasted recipe text into a structured draft for the user to review.

    The draft is NOT persisted; the user reviews/edits it and then saves it via
    ``POST /recipes``.
    """
    parsed = parse_recipe_text(db, body.text, language=body.language)
    return RecipeDraftRead(
        **parsed.draft.model_dump(),
        language=parsed.language,
        generated_by=parsed.generated_by,
    )


@router.post("/recipes/suggest", response_model=RecipeDraftRead)
def suggest_recipe_endpoint(db: DbSession, body: RecipeSuggestRequest) -> RecipeDraftRead:
    """Generate a recipe from a free-form user prompt, for the user to review.

    The draft is NOT persisted; the user reviews it and then saves it via
    ``POST /recipes``.
    """
    suggested = suggest_recipe(db, body.prompt, language=body.language)
    return RecipeDraftRead(
        **suggested.draft.model_dump(),
        language=suggested.language,
        generated_by=suggested.generated_by,
    )


@router.post("/recipes", response_model=RecipeRead, status_code=status.HTTP_201_CREATED)
def create_recipe_endpoint(db: DbSession, body: RecipeCreate) -> RecipeRead:
    """Save a reviewed recipe into the library (manual entry or AI-parsed text)."""
    recipe = create_recipe(db, **body.model_dump())
    return RecipeRead.model_validate(recipe)
