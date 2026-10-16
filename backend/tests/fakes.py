"""Test doubles for the recipe domain."""

from __future__ import annotations

from datetime import date

from recipe_recommender.recipes.agent import RecipeDraft


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
        )
        self.calls: list[tuple[date, str]] = []

    @property
    def generator_name(self) -> str:
        return "fake"

    def generate(self, recipe_date: date, language: str) -> RecipeDraft:
        self.calls.append((recipe_date, language))
        return self._draft
