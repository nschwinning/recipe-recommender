"""SQLAlchemy ORM models for the recipe-of-the-day domain."""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, func
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
    recipe_date: Mapped[date] = mapped_column(Date, unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    summary: Mapped[str] = mapped_column(String, nullable=False)
    cuisine: Mapped[str | None] = mapped_column(String, nullable=True)
    prep_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cook_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    servings: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ingredients: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    steps: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    # Language the recipe text was generated in (e.g. "de", "en").
    language: Mapped[str] = mapped_column(String, nullable=False)
    generated_by: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Recipe(Base):
    """A reusable recipe in the user's saved library.

    This is the generic, source-agnostic recipe model that every recipe in the
    app maps onto, regardless of how it got here: liked from the recipe of the
    day, entered by hand, or (later) parsed by the AI from pasted text. Keeping
    it independent of any one source lets future ingestion paths add rows without
    schema changes — they only vary ``source`` and ``generated_by``.
    """

    __tablename__ = "recipes"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    summary: Mapped[str] = mapped_column(String, nullable=False)
    cuisine: Mapped[str | None] = mapped_column(String, nullable=True)
    prep_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cook_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    servings: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ingredients: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    steps: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    # Language the recipe text is written in (e.g. "de", "en").
    language: Mapped[str] = mapped_column(String, nullable=False)
    # How this recipe entered the library (see recipes.constants.RECIPE_SOURCES).
    source: Mapped[str] = mapped_column(String, nullable=False)
    # Model id for AI-produced recipes, ``stub`` for the stub, NULL for manual.
    generated_by: Mapped[str | None] = mapped_column(String, nullable=True)
    # When saved from the recipe of the day, points back at that row so a given
    # day's recipe can be liked at most once. NULL for manual/parsed recipes.
    source_recipe_of_the_day_id: Mapped[int | None] = mapped_column(
        ForeignKey("recipe_of_the_day.id", ondelete="SET NULL"),
        unique=True,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
