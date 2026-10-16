"""Business logic for the recipe of the day."""

from __future__ import annotations

from datetime import date, datetime
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from recipe_recommender.config import settings
from recipe_recommender.recipes.agent import RecipeAgent, get_recipe_agent
from recipe_recommender.recipes.models import RecipeOfTheDay


def today_in_app_tz() -> date:
    """Return the current calendar day in the configured recipe timezone."""
    return datetime.now(ZoneInfo(settings.RECIPE_TIMEZONE)).date()


def get_recipe_for_date(session: Session, recipe_date: date) -> RecipeOfTheDay | None:
    """Return the stored recipe for ``recipe_date``, or ``None`` if not generated."""
    return session.scalar(
        select(RecipeOfTheDay).where(RecipeOfTheDay.recipe_date == recipe_date)
    )


def get_or_create_recipe_of_the_day(
    session: Session,
    *,
    recipe_date: date | None = None,
    agent: RecipeAgent | None = None,
) -> RecipeOfTheDay:
    """Return the recipe for the given day, generating and storing it if missing.

    Idempotent on ``recipe_date``: the unique constraint guarantees a single
    recipe per day even under concurrent requests. If a racing request wins the
    insert, this re-reads that row instead of failing.
    """
    day = recipe_date or today_in_app_tz()

    existing = get_recipe_for_date(session, day)
    if existing is not None:
        return existing

    agent = agent or get_recipe_agent()
    draft = agent.generate(day)

    recipe = RecipeOfTheDay(
        recipe_date=day,
        title=draft.title,
        summary=draft.summary,
        cuisine=draft.cuisine,
        prep_minutes=draft.prep_minutes,
        cook_minutes=draft.cook_minutes,
        servings=draft.servings,
        ingredients=draft.ingredients,
        steps=draft.steps,
        generated_by=agent.generator_name,
    )
    session.add(recipe)
    try:
        session.flush()
    except IntegrityError:
        # A concurrent request already inserted today's recipe; use theirs.
        session.rollback()
        winner = get_recipe_for_date(session, day)
        if winner is None:  # pragma: no cover - defensive, constraint guarantees a row
            raise
        return winner
    return recipe
