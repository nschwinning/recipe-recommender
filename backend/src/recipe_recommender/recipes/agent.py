"""AI agent that generates the recipe of the day.

The production agent is backed by the ``openai-agents`` SDK and returns a
validated :class:`RecipeDraft`. A deterministic :class:`StubRecipeAgent` lets the
app boot and tests run with no OpenAI credentials. Both satisfy the
:class:`RecipeAgent` Protocol so callers (and tests) can swap one for the other.
"""

from __future__ import annotations

import asyncio
from datetime import date
from typing import Protocol

from agents.run import Runner
from pydantic import BaseModel, Field

from recipe_recommender.agents import build_agent
from recipe_recommender.config import settings
from recipe_recommender.recipes.constants import RECIPE_AGENT_NAME, STUB_GENERATOR
from recipe_recommender.recipes.errors import RecipeAgentError


class RecipeDraft(BaseModel):
    """Structured recipe produced by the agent (pre-persistence)."""

    title: str = Field(description="Short, appetising name of the dish")
    summary: str = Field(
        description="One or two sentences describing the dish and why it's great today"
    )
    cuisine: str | None = Field(
        default=None, description="Cuisine or style, e.g. Italian, Thai, comfort food"
    )
    prep_minutes: int | None = Field(default=None, description="Prep time in minutes")
    cook_minutes: int | None = Field(default=None, description="Cook time in minutes")
    servings: int | None = Field(default=None, description="Number of servings")
    ingredients: list[str] = Field(
        description="Ingredient lines, each with quantity, e.g. '200g spaghetti'"
    )
    steps: list[str] = Field(description="Ordered preparation steps")


class RecipeAgent(Protocol):
    """Seam for recipe generation so tests can inject a fake."""

    def generate(self, recipe_date: date) -> RecipeDraft:
        """Produce a recipe for the given calendar day."""
        ...

    @property
    def generator_name(self) -> str:
        """Identifier recorded on the stored recipe (model id or ``stub``)."""
        ...


_INSTRUCTIONS = (
    "You are a creative chef writing a single 'recipe of the day' for a home cook. "
    "Produce one appealing, achievable recipe using commonly available ingredients. "
    "Vary cuisine and ingredients day to day. Keep the summary warm and inviting. "
    "Give exact ingredient quantities and clear, ordered steps."
)


def _build_prompt(recipe_date: date) -> str:
    """Build the per-day user prompt. The date seeds day-to-day variety."""
    return (
        f"Create the recipe of the day for {recipe_date.isoformat()} "
        f"({recipe_date.strftime('%A')}). Make it feel fresh and seasonal for this date."
    )


class OpenAIRecipeAgent:
    """Production recipe agent backed by ``openai-agents``."""

    def __init__(self, model: str | None = None) -> None:
        self._model = model or settings.RECIPE_MODEL

    @property
    def generator_name(self) -> str:
        return self._model

    def generate(self, recipe_date: date) -> RecipeDraft:
        """Synchronous seam over the async SDK, mirroring the cadence pattern."""
        return asyncio.run(self._run(recipe_date))

    async def _run(self, recipe_date: date) -> RecipeDraft:
        agent = build_agent(
            name=RECIPE_AGENT_NAME,
            instructions=_INSTRUCTIONS,
            output_type=RecipeDraft,
            model=self._model,
        )
        timeout = settings.RECIPE_AGENT_TIMEOUT_SECONDS
        try:
            result = await asyncio.wait_for(
                Runner.run(
                    agent,
                    _build_prompt(recipe_date),
                    max_turns=settings.RECIPE_MAX_TURNS,
                ),
                timeout=timeout,
            )
        except TimeoutError as exc:
            raise RecipeAgentError(
                f"The recipe agent timed out after {timeout}s."
            ) from exc
        except Exception as exc:
            raise RecipeAgentError(f"The recipe agent failed: {exc}") from exc
        draft: RecipeDraft = result.final_output
        return draft


class StubRecipeAgent:
    """Deterministic agent used when ``RECIPE_STUB`` is set or no key is configured."""

    @property
    def generator_name(self) -> str:
        return STUB_GENERATOR

    def generate(self, recipe_date: date) -> RecipeDraft:
        """Return a fixed-but-date-flavoured recipe, no network calls."""
        weekday = recipe_date.strftime("%A")
        return RecipeDraft(
            title=f"{weekday} One-Pan Lemon Herb Chicken",
            summary=(
                f"A bright, fuss-free dinner for {recipe_date.isoformat()} that comes "
                "together in a single pan with pantry staples."
            ),
            cuisine="Mediterranean",
            prep_minutes=15,
            cook_minutes=30,
            servings=4,
            ingredients=[
                "4 chicken thighs, bone-in",
                "2 tbsp olive oil",
                "1 lemon, sliced",
                "4 cloves garlic, smashed",
                "1 tsp dried oregano",
                "400g baby potatoes, halved",
                "Salt and black pepper to taste",
            ],
            steps=[
                "Heat the olive oil in an oven-proof pan over medium-high heat.",
                "Season the chicken and sear skin-side down until golden, about 6 minutes.",
                "Add potatoes, garlic, lemon and oregano around the chicken.",
                "Transfer to a 200C oven and roast for 25 minutes until cooked through.",
                "Rest for 5 minutes, then serve warm.",
            ],
        )


def get_recipe_agent() -> RecipeAgent:
    """Select the recipe agent based on configuration.

    Falls back to the stub when ``RECIPE_STUB`` is set or no OpenAI key exists, so
    the app always has a working generator.
    """
    if settings.RECIPE_STUB or not settings.OPENAI_API_KEY:
        return StubRecipeAgent()
    return OpenAIRecipeAgent()
