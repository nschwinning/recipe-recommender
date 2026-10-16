"""Tests for the recipe-of-the-day service layer."""

from __future__ import annotations

from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session
from tests.fakes import FakeRecipeAgent

from recipe_recommender.recipes.models import RecipeOfTheDay
from recipe_recommender.recipes.service import get_or_create_recipe_of_the_day


def test_generates_and_persists_when_missing(db_session: Session) -> None:
    agent = FakeRecipeAgent()
    day = date(2026, 10, 15)

    recipe = get_or_create_recipe_of_the_day(db_session, recipe_date=day, agent=agent)

    assert recipe.recipe_date == day
    assert recipe.title == "Fake Pasta"
    assert recipe.generated_by == "fake"
    # No language passed → falls back to the default app language (German).
    assert agent.calls == [(day, "de")]
    assert recipe.language == "de"
    stored = db_session.scalars(select(RecipeOfTheDay)).all()
    assert len(stored) == 1


def test_is_idempotent_per_day(db_session: Session) -> None:
    agent = FakeRecipeAgent()
    day = date(2026, 10, 15)

    first = get_or_create_recipe_of_the_day(db_session, recipe_date=day, agent=agent)
    second = get_or_create_recipe_of_the_day(db_session, recipe_date=day, agent=agent)

    assert first.id == second.id
    # The agent is only invoked once; the second call re-reads the stored row.
    assert agent.calls == [(day, "de")]
    assert len(db_session.scalars(select(RecipeOfTheDay)).all()) == 1


def test_regenerates_when_language_changes(db_session: Session) -> None:
    agent = FakeRecipeAgent()
    day = date(2026, 10, 15)

    first = get_or_create_recipe_of_the_day(db_session, recipe_date=day, language="de", agent=agent)
    second = get_or_create_recipe_of_the_day(
        db_session, recipe_date=day, language="en", agent=agent
    )

    # Same row, regenerated in place; the agent is invoked once per language.
    assert first.id == second.id
    assert second.language == "en"
    assert agent.calls == [(day, "de"), (day, "en")]
    assert len(db_session.scalars(select(RecipeOfTheDay)).all()) == 1


def test_different_days_create_distinct_recipes(db_session: Session) -> None:
    agent = FakeRecipeAgent()

    get_or_create_recipe_of_the_day(db_session, recipe_date=date(2026, 10, 15), agent=agent)
    get_or_create_recipe_of_the_day(db_session, recipe_date=date(2026, 10, 16), agent=agent)

    assert len(db_session.scalars(select(RecipeOfTheDay)).all()) == 2
