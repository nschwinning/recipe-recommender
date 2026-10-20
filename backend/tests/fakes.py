"""Test doubles for the recipe domain."""

from __future__ import annotations

from datetime import date

from recipe_recommender.recipes.agent import RecipeDraft, RecipePreferences


class FakeRecipeAgent:
    """Records calls and returns a canned draft, for deterministic service tests."""

    def __init__(self, draft: RecipeDraft | None = None) -> None:
        self._draft = draft or RecipeDraft(
            title="Fake Pasta",
            summary="A canned recipe for tests.",
            cuisine="Italian",
            prep_minutes=10,
            cook_minutes=12,
            servings=2,
            ingredients=["200g spaghetti", "2 tbsp olive oil"],
            steps=["Boil pasta.", "Toss with oil."],
            tags=["vegetarian", "quick"],
        )
        self.calls: list[tuple[date, str]] = []
        self.parse_calls: list[tuple[str, str]] = []
        self.suggest_calls: list[tuple[str, str]] = []
        self.refine_calls: list[tuple[str, RecipeDraft, str]] = []
        # The preferences passed to the most recent generate/suggest/refine call.
        self.last_preferences: RecipePreferences | None = None

    @property
    def generator_name(self) -> str:
        return "fake"

    def generate(
        self, recipe_date: date, language: str, preferences: RecipePreferences | None = None
    ) -> RecipeDraft:
        self.calls.append((recipe_date, language))
        self.last_preferences = preferences
        return self._draft

    def parse(self, text: str, language: str) -> RecipeDraft:
        self.parse_calls.append((text, language))
        return self._draft

    def suggest(
        self, prompt: str, language: str, preferences: RecipePreferences | None = None
    ) -> RecipeDraft:
        self.suggest_calls.append((prompt, language))
        self.last_preferences = preferences
        return self._draft

    def refine(
        self,
        message: str,
        previous: RecipeDraft,
        language: str,
        preferences: RecipePreferences | None = None,
    ) -> RecipeDraft:
        self.refine_calls.append((message, previous, language))
        self.last_preferences = preferences
        return self._draft
