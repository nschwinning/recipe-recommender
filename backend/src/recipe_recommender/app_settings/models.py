"""SQLAlchemy ORM model for application settings (a single-row table)."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from recipe_recommender.database import Base

# The application settings are a singleton: exactly one row, always id == 1.
APP_SETTINGS_ID = 1


class AppSettings(Base):
    """User-editable application preferences. Exactly one row (``id == 1``)."""

    __tablename__ = "app_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    language: Mapped[str] = mapped_column(String, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
