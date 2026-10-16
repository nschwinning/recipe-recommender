"""Business logic for application settings."""

from __future__ import annotations

from sqlalchemy.orm import Session

from recipe_recommender.app_settings.constants import (
    DEFAULT_LANGUAGE,
    SUPPORTED_LANGUAGES,
)
from recipe_recommender.app_settings.errors import UnsupportedLanguageError
from recipe_recommender.app_settings.models import APP_SETTINGS_ID, AppSettings


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
