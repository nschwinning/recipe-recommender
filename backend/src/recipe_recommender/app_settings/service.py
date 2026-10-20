"""Business logic for application settings."""

from __future__ import annotations

from sqlalchemy.orm import Session

from recipe_recommender.app_settings.constants import (
    DEFAULT_LANGUAGE,
    SUPPORTED_DIETS,
    SUPPORTED_LANGUAGES,
)
from recipe_recommender.app_settings.errors import (
    UnsupportedDietError,
    UnsupportedLanguageError,
)
from recipe_recommender.app_settings.models import APP_SETTINGS_ID, AppSettings

# Guardrails for the free-form liked/disliked ingredient lists.
_MAX_INGREDIENTS = 50
_MAX_INGREDIENT_LENGTH = 60


def _clean_ingredients(values: list[str]) -> list[str]:
    """Trim, drop blanks, truncate, and dedupe (case-insensitive) an ingredient list."""
    cleaned: list[str] = []
    seen: set[str] = set()
    for raw in values:
        item = raw.strip()[:_MAX_INGREDIENT_LENGTH].strip()
        if not item:
            continue
        key = item.casefold()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(item)
        if len(cleaned) >= _MAX_INGREDIENTS:
            break
    return cleaned


def get_app_settings(session: Session) -> AppSettings:
    """Return the singleton settings row, creating it with defaults if missing."""
    row = session.get(AppSettings, APP_SETTINGS_ID)
    if row is None:
        row = AppSettings(id=APP_SETTINGS_ID, language=DEFAULT_LANGUAGE)
        session.add(row)
        session.flush()
    return row


def get_language(session: Session) -> str:
    """Return the currently configured app language code."""
    return get_app_settings(session).language


def update_language(session: Session, language: str) -> AppSettings:
    """Update the app language. Raises on an unsupported language code."""
    if language not in SUPPORTED_LANGUAGES:
        raise UnsupportedLanguageError(
            f"Unsupported language '{language}'. "
            f"Supported: {', '.join(sorted(SUPPORTED_LANGUAGES))}."
        )
    row = get_app_settings(session)
    row.language = language
    session.flush()
    return row


def update_preferences(
    session: Session,
    *,
    servings: int | None,
    diet: str,
    liked_ingredients: list[str],
    disliked_ingredients: list[str],
) -> AppSettings:
    """Update the cooking preferences. Raises on an unsupported diet code.

    These preferences steer AI recipe generation (the generate/refine chat and future
    recipe-of-the-day generations); they do not retroactively change existing recipes.
    """
    if diet not in SUPPORTED_DIETS:
        raise UnsupportedDietError(
            f"Unsupported diet '{diet}'. Supported: {', '.join(sorted(SUPPORTED_DIETS))}."
        )
    row = get_app_settings(session)
    row.servings = servings
    row.diet = diet
    row.liked_ingredients = _clean_ingredients(liked_ingredients)
    row.disliked_ingredients = _clean_ingredients(disliked_ingredients)
    session.flush()
    return row
