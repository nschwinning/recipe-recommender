"""SQLAlchemy ORM model for application settings (a single-row table)."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from recipe_recommender.app_settings.constants import DIET_NONE
from recipe_recommender.database import Base

# The application settings are a singleton: exactly one row, always id == 1.
APP_SETTINGS_ID = 1


class AppSettings(Base):
    """User-editable application preferences. Exactly one row (``id == 1``)."""

    __tablename__ = "app_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    language: Mapped[str] = mapped_column(String, nullable=False)
    # Default number of people to cook for; None means "let the AI decide".
    servings: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Dietary restriction code, e.g. "none", "vegetarian", "vegan".
    diet: Mapped[str] = mapped_column(String, nullable=False, server_default=DIET_NONE)
    # Free-form ingredient preferences that steer AI recipe generation.
    liked_ingredients: Mapped[list[str]] = mapped_column(JSONB, nullable=False, server_default="[]")
    disliked_ingredients: Mapped[list[str]] = mapped_column(
        JSONB, nullable=False, server_default="[]"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
