"""Application-settings router. Mounted under ``/api/v1``."""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from recipe_recommender.api.schemas import (
    AppSettingsRead,
    AppSettingsUpdate,
    CookingPreferencesUpdate,
    LanguageOption,
)
from recipe_recommender.app_settings.constants import SUPPORTED_DIETS, SUPPORTED_LANGUAGES
from recipe_recommender.app_settings.errors import (
    UnsupportedDietError,
    UnsupportedLanguageError,
)
from recipe_recommender.app_settings.models import AppSettings
from recipe_recommender.app_settings.service import (
    get_app_settings,
    update_language,
    update_preferences,
)
from recipe_recommender.database import get_db
from recipe_recommender.recipes.service import get_or_create_recipe_of_the_day

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/settings", tags=["settings"])

DbSession = Annotated[Session, Depends(get_db)]


def _read(row: AppSettings) -> AppSettingsRead:
    """Build the settings response with the available language and diet options."""
    return AppSettingsRead(
        language=row.language,
        available_languages=[
            LanguageOption(code=code, label=label) for code, label in SUPPORTED_LANGUAGES.items()
        ],
        servings=row.servings,
        diet=row.diet,
        liked_ingredients=list(row.liked_ingredients),
        disliked_ingredients=list(row.disliked_ingredients),
        available_diets=list(SUPPORTED_DIETS),
    )


@router.get("", response_model=AppSettingsRead)
def read_settings(db: DbSession) -> AppSettingsRead:
    """Return the current application settings plus the available options."""
    return _read(get_app_settings(db))


@router.put("", response_model=AppSettingsRead)
def update_settings(db: DbSession, body: AppSettingsUpdate) -> AppSettingsRead:
    """Update the app language and regenerate today's recipe in that language."""
    try:
        row = update_language(db, body.language)
    except UnsupportedLanguageError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc
    # Reflect the change immediately: regenerate today's recipe in the new language.
    get_or_create_recipe_of_the_day(db, language=row.language)
    return _read(row)


@router.put("/preferences", response_model=AppSettingsRead)
def update_cooking_preferences(db: DbSession, body: CookingPreferencesUpdate) -> AppSettingsRead:
    """Update the cooking preferences that steer AI recipe generation.

    These apply to the generate/refine chat and to future recipe-of-the-day
    generations; today's existing recipe is left untouched.
    """
    try:
        row = update_preferences(
            db,
            servings=body.servings,
            diet=body.diet,
            liked_ingredients=body.liked_ingredients,
            disliked_ingredients=body.disliked_ingredients,
        )
    except UnsupportedDietError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc
    return _read(row)
