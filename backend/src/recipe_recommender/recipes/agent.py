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
from recipe_recommender.app_settings.constants import LANGUAGE_PROMPT_NAMES
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
    tags: list[str] = Field(
        default_factory=list,
        description=(
            "3-6 short labels describing the dish (dietary style, effort, meal "
            "type, key ingredient), e.g. 'vegetarian', 'quick', 'comfort food'"
        ),
    )


class RecipeAgent(Protocol):
    """Seam for recipe generation so tests can inject a fake."""

    def generate(self, recipe_date: date, language: str) -> RecipeDraft:
        """Produce a recipe for the given calendar day, written in ``language``."""
        ...

    def parse(self, text: str, language: str) -> RecipeDraft:
        """Extract a structured recipe from free-form ``text``, in ``language``."""
        ...

    def suggest(self, prompt: str, language: str) -> RecipeDraft:
        """Generate a recipe that answers the user's free-form ``prompt``."""
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

_PARSE_INSTRUCTIONS = (
    "You extract a single structured recipe from free-form text that a user pasted. "
    "Identify the title, a short summary, the cuisine, prep and cook times in minutes, "
    "the number of servings, the ingredient lines (each with quantities), and the "
    "ordered preparation steps. Also suggest 3-6 short descriptive tags. Leave optional "
    "fields empty when the text does not provide them, and never invent ingredients or "
    "steps that are not present or clearly implied by the source text."
)


def _build_parse_prompt(text: str, language: str) -> str:
    """Build the user prompt that asks the model to structure pasted recipe text."""
    return (
        "Extract a structured recipe from the text below. Write ALL text fields "
        "(title, summary, cuisine, ingredients, steps, tags) in "
        f"{_language_name(language)}, translating if the source is in another language.\n\n"
        f"---\n{text}"
    )


_SUGGEST_INSTRUCTIONS = (
    "You are a helpful chef. The user describes what they want (ingredients they "
    "have on hand, dietary needs, a craving, time constraints) and you respond with a "
    "single recipe that best fits their request. Prefer the ingredients they mention, "
    "honour any dietary or time constraints, and keep the recipe achievable for a home "
    "cook with exact quantities and clear, ordered steps."
)


def _build_suggest_prompt(prompt: str, language: str) -> str:
    """Build the user prompt that asks the model to answer a recipe request."""
    return (
        "Create one recipe that best answers the following request. Also provide 3-6 "
        "short descriptive tags (dietary style, effort, meal type, key ingredient). "
        "Write ALL text fields (title, summary, cuisine, ingredients, steps, tags) in "
        f"{_language_name(language)}.\n\nRequest:\n{prompt}"
    )


def _language_name(language: str) -> str:
    """Human-readable language name for the prompt (fallback: the code itself)."""
    return LANGUAGE_PROMPT_NAMES.get(language, language)


def _build_prompt(recipe_date: date, language: str) -> str:
    """Build the per-day user prompt. The date seeds day-to-day variety."""
    return (
        f"Create the recipe of the day for {recipe_date.isoformat()} "
        f"({recipe_date.strftime('%A')}). Make it feel fresh and seasonal for this date. "
        f"Also provide 3-6 short descriptive tags (dietary style, effort, meal type, "
        f"key ingredient). Write ALL text fields (title, summary, cuisine, ingredients, "
        f"steps, tags) in {_language_name(language)}."
    )


class OpenAIRecipeAgent:
    """Production recipe agent backed by ``openai-agents``."""

    def __init__(self, model: str | None = None) -> None:
        self._model = model or settings.RECIPE_MODEL

    @property
    def generator_name(self) -> str:
        return self._model

    def generate(self, recipe_date: date, language: str) -> RecipeDraft:
        """Synchronous seam over the async SDK, mirroring the cadence pattern."""
        return asyncio.run(self._run(_INSTRUCTIONS, _build_prompt(recipe_date, language)))

    def parse(self, text: str, language: str) -> RecipeDraft:
        """Structure pasted free-form recipe text into a :class:`RecipeDraft`."""
        return asyncio.run(self._run(_PARSE_INSTRUCTIONS, _build_parse_prompt(text, language)))

    def suggest(self, prompt: str, language: str) -> RecipeDraft:
        """Generate a recipe that answers the user's free-form request."""
        return asyncio.run(
            self._run(_SUGGEST_INSTRUCTIONS, _build_suggest_prompt(prompt, language))
        )

    async def _run(self, instructions: str, prompt: str) -> RecipeDraft:
        agent = build_agent(
            name=RECIPE_AGENT_NAME,
            instructions=instructions,
            output_type=RecipeDraft,
            model=self._model,
        )
        timeout = settings.RECIPE_AGENT_TIMEOUT_SECONDS
        try:
            result = await asyncio.wait_for(
                Runner.run(agent, prompt, max_turns=settings.RECIPE_MAX_TURNS),
                timeout=timeout,
            )
        except TimeoutError as exc:
            raise RecipeAgentError(f"The recipe agent timed out after {timeout}s.") from exc
        except Exception as exc:
            raise RecipeAgentError(f"The recipe agent failed: {exc}") from exc
        draft: RecipeDraft = result.final_output
        return draft


class StubRecipeAgent:
    """Deterministic agent used when ``RECIPE_STUB`` is set or no key is configured."""

    @property
    def generator_name(self) -> str:
        return STUB_GENERATOR

    def generate(self, recipe_date: date, language: str) -> RecipeDraft:
        """Return a fixed, language-appropriate recipe with no network calls."""
        if language == "de":
            return self._german(recipe_date)
        return self._english(recipe_date)

    def parse(self, text: str, language: str) -> RecipeDraft:
        """Deterministically structure pasted text with no network calls.

        Uses a simple heuristic: the first line is the title, and lines are routed
        into ingredients or steps by ``Ingredients:``/``Zutaten:`` and
        ``Steps:``/``Zubereitung:`` section headers (steps by default).
        """
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        title = (
            lines[0]
            if lines
            else ("Importiertes Rezept" if language == "de" else "Imported Recipe")
        )

        ingredient_headers = {"ingredients", "ingredients:", "zutaten", "zutaten:"}
        step_headers = {"steps", "steps:", "method", "method:", "zubereitung", "zubereitung:"}
        ingredients: list[str] = []
        steps: list[str] = []
        bucket = steps
        for line in lines[1:]:
            lowered = line.lower()
            if lowered in ingredient_headers:
                bucket = ingredients
                continue
            if lowered in step_headers:
                bucket = steps
                continue
            bucket.append(line)

        summary = (
            "Aus eingefügtem Text importiert." if language == "de" else "Imported from pasted text."
        )
        return RecipeDraft(
            title=title,
            summary=summary,
            cuisine=None,
            ingredients=ingredients,
            steps=steps,
            tags=[],
        )

    def suggest(self, prompt: str, language: str) -> RecipeDraft:
        """Return a fixed, language-appropriate suggestion with no network calls."""
        if language == "de":
            return RecipeDraft(
                title="Schnelle Gemüsepfanne",
                summary="Ein schnelles vegetarisches Gericht auf Basis deiner Anfrage.",
                cuisine="Vegetarisch",
                prep_minutes=10,
                cook_minutes=15,
                servings=2,
                ingredients=["1 Paprika", "1 Brokkoli", "2 EL Olivenöl", "Salz und Pfeffer"],
                steps=["Das Gemüse klein schneiden.", "In der Pfanne 10 Minuten braten."],
                tags=["vegetarisch", "schnell"],
            )
        return RecipeDraft(
            title="Quick Veggie Stir-Fry",
            summary="A quick vegetarian dish based on your request.",
            cuisine="Vegetarian",
            prep_minutes=10,
            cook_minutes=15,
            servings=2,
            ingredients=["1 bell pepper", "1 head broccoli", "2 tbsp olive oil", "Salt and pepper"],
            steps=["Chop the vegetables.", "Stir-fry in the pan for 10 minutes."],
            tags=["vegetarian", "quick"],
        )

    @staticmethod
    def _english(recipe_date: date) -> RecipeDraft:
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
            tags=["one-pan", "high-protein", "dinner", "gluten-free"],
        )

    @staticmethod
    def _german(recipe_date: date) -> RecipeDraft:
        return RecipeDraft(
            title="Zitronen-Kräuter-Hähnchen aus einer Pfanne",
            summary=(
                f"Ein unkompliziertes, aromatisches Abendessen für den "
                f"{recipe_date.isoformat()}, das mit Vorratskammer-Zutaten in einer "
                "einzigen Pfanne gelingt."
            ),
            cuisine="Mediterran",
            prep_minutes=15,
            cook_minutes=30,
            servings=4,
            ingredients=[
                "4 Hähnchenschenkel mit Knochen",
                "2 EL Olivenöl",
                "1 Zitrone, in Scheiben",
                "4 Knoblauchzehen, angedrückt",
                "1 TL getrockneter Oregano",
                "400 g Drillinge, halbiert",
                "Salz und schwarzer Pfeffer nach Geschmack",
            ],
            steps=[
                "Das Olivenöl in einer ofenfesten Pfanne bei mittelhoher Hitze erhitzen.",
                (
                    "Das Hähnchen würzen und mit der Hautseite nach unten goldbraun "
                    "anbraten, etwa 6 Minuten."
                ),
                "Kartoffeln, Knoblauch, Zitrone und Oregano um das Hähnchen verteilen.",
                "In den auf 200 °C vorgeheizten Ofen geben und 25 Minuten garen.",
                "5 Minuten ruhen lassen und warm servieren.",
            ],
            tags=["aus einer Pfanne", "proteinreich", "Abendessen", "glutenfrei"],
        )


def get_recipe_agent() -> RecipeAgent:
    """Select the recipe agent based on configuration.

    Falls back to the stub when ``RECIPE_STUB`` is set or no OpenAI key exists, so
    the app always has a working generator.
    """
    if settings.RECIPE_STUB or not settings.OPENAI_API_KEY:
        return StubRecipeAgent()
    return OpenAIRecipeAgent()
