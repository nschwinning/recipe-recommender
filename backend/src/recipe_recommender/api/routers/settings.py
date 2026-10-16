"""Application-settings router. Mounted under ``/api/v1``."""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from recipe_recommender.api.schemas import (
    AppSettingsRead,
    AppSettingsUpdate,
    LanguageOption,
)
from recipe_recommender.app_settings.constants import SUPPORTED_LANGUAGES
from recipe_recommender.app_settings.errors import UnsupportedLanguageError
from recipe_recommender.app_settings.service import get_language, update_language
from recipe_recommender.database import get_db
from recipe_recommender.recipes.service import get_or_create_recipe_of_the_day

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/settings", tags=["settings"])

DbSession = Annotated[Session, Depends(get_db)]


def _read(language: str) -> AppSettingsRead:
    """Build the settings response with the available language options."""
    return AppSettingsRead(
        language=language,
        available_languages=[
            LanguageOption(code=code, label=label) for code, label in SUPPORTED_LANGUAGES.items()
        ],
    )


@router.get("", response_model=AppSettingsRead)
def read_settings(db: DbSession) -> AppSettingsRead:
    """Return the current application settings and the available languages."""
    return _read(get_language(db))


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
    return _read(row.language)
