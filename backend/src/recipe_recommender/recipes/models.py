"""SQLAlchemy ORM models for the recipe-of-the-day domain."""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Date, DateTime, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from recipe_recommender.database import Base


class RecipeOfTheDay(Base):
    """A single AI-generated recipe, uniquely pinned to one calendar day.

    The unique ``recipe_date`` enforces the "generated once per day" rule at the
    database level: a second generation for the same day is a no-op that re-reads
    the existing row.
    """

    __tablename__ = "recipe_of_the_day"

    id: Mapped[int] = mapped_column(primary_key=True)
    recipe_date: Mapped[date] = mapped_column(
        Date, unique=True, index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    summary: Mapped[str] = mapped_column(String, nullable=False)
    cuisine: Mapped[str | None] = mapped_column(String, nullable=True)
    prep_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cook_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    servings: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ingredients: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    steps: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    generated_by: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
