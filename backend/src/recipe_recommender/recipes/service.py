"""Business logic for the recipe of the day."""

from __future__ import annotations

from datetime import date, datetime
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from recipe_recommender.app_settings.service import get_language
from recipe_recommender.config import settings
from recipe_recommender.recipes.agent import RecipeAgent, RecipeDraft, get_recipe_agent
from recipe_recommender.recipes.constants import SOURCE_RECIPE_OF_THE_DAY
from recipe_recommender.recipes.models import Recipe, RecipeOfTheDay


def today_in_app_tz() -> date:
    """Return the current calendar day in the configured recipe timezone."""
    return datetime.now(ZoneInfo(settings.RECIPE_TIMEZONE)).date()


def get_recipe_for_date(session: Session, recipe_date: date) -> RecipeOfTheDay | None:
    """Return the stored recipe for ``recipe_date``, or ``None`` if not generated."""
    return session.scalar(select(RecipeOfTheDay).where(RecipeOfTheDay.recipe_date == recipe_date))


def _apply_draft(
    recipe: RecipeOfTheDay, draft: RecipeDraft, *, language: str, generated_by: str
) -> None:
    """Copy a generated draft onto a (new or existing) recipe row."""
    recipe.title = draft.title
    recipe.summary = draft.summary
    recipe.cuisine = draft.cuisine
    recipe.prep_minutes = draft.prep_minutes
    recipe.cook_minutes = draft.cook_minutes
    recipe.servings = draft.servings
    recipe.ingredients = draft.ingredients
    recipe.steps = draft.steps
    recipe.language = language
    recipe.generated_by = generated_by


def get_or_create_recipe_of_the_day(
    session: Session,
    *,
    recipe_date: date | None = None,
    language: str | None = None,
    agent: RecipeAgent | None = None,
) -> RecipeOfTheDay:
    """Return the recipe for the given day in the active language.

    Behaviour:
    - If a recipe already exists for the day **in the current language**, return it.
    - If one exists but in a *different* language, regenerate it in place so a
      language change is reflected immediately.
    - Otherwise generate and store a new recipe.

    Idempotent per day: the unique ``recipe_date`` guarantees a single row even
    under concurrent requests.
    """
    day = recipe_date or today_in_app_tz()
    lang = language or get_language(session)
    agent = agent or get_recipe_agent()

    existing = get_recipe_for_date(session, day)
    if existing is not None:
        if existing.language == lang:
            return existing
        # Language changed: regenerate today's recipe in the new language.
        draft = agent.generate(day, lang)
        _apply_draft(existing, draft, language=lang, generated_by=agent.generator_name)
        session.flush()
        return existing

    draft = agent.generate(day, lang)
    recipe = RecipeOfTheDay(recipe_date=day)
    _apply_draft(recipe, draft, language=lang, generated_by=agent.generator_name)
    session.add(recipe)
    try:
        session.flush()
    except IntegrityError:
        # A concurrent request already inserted today's recipe; use theirs.
        session.rollback()
        winner = get_recipe_for_date(session, day)
        if winner is None:  # pragma: no cover - constraint guarantees a row
            raise
        return winner
    return recipe


def list_saved_recipes(session: Session) -> list[Recipe]:
    """Return all saved recipes in the library, newest first."""
    return list(
        session.scalars(select(Recipe).order_by(Recipe.created_at.desc(), Recipe.id.desc()))
    )


def get_saved_recipe_for_rotd(session: Session, recipe_of_the_day_id: int) -> Recipe | None:
    """Return the saved library recipe sourced from a recipe-of-the-day row, if any."""
    return session.scalar(
        select(Recipe).where(Recipe.source_recipe_of_the_day_id == recipe_of_the_day_id)
    )


def like_recipe_of_the_day(session: Session, *, recipe_date: date | None = None) -> Recipe:
    """Save a recipe-of-the-day into the reusable library (idempotent per day).

    Ensures the day's recipe exists, then copies its content into a generic
    :class:`Recipe`. Liking the same day twice returns the already-saved recipe
    rather than creating a duplicate.
    """
    source = get_or_create_recipe_of_the_day(session, recipe_date=recipe_date)

    existing = get_saved_recipe_for_rotd(session, source.id)
    if existing is not None:
        return existing

    saved = Recipe(
        title=source.title,
        summary=source.summary,
        cuisine=source.cuisine,
        prep_minutes=source.prep_minutes,
        cook_minutes=source.cook_minutes,
        servings=source.servings,
        ingredients=list(source.ingredients),
        steps=list(source.steps),
        language=source.language,
        source=SOURCE_RECIPE_OF_THE_DAY,
        generated_by=source.generated_by,
        source_recipe_of_the_day_id=source.id,
    )
    session.add(saved)
    try:
        session.flush()
    except IntegrityError:
        # A concurrent like already saved this day's recipe; return the winner.
        session.rollback()
        winner = get_saved_recipe_for_rotd(session, source.id)
        if winner is None:  # pragma: no cover - constraint guarantees a row
            raise
        return winner
    return saved


def unlike_recipe_of_the_day(session: Session, *, recipe_date: date | None = None) -> bool:
    """Remove the saved library copy of a day's recipe. Returns True if deleted."""
    day = recipe_date or today_in_app_tz()
    source = get_recipe_for_date(session, day)
    if source is None:
        return False
    saved = get_saved_recipe_for_rotd(session, source.id)
    if saved is None:
        return False
    session.delete(saved)
    session.flush()
    return True
