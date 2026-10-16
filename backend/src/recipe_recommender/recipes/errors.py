"""Domain errors for recipe generation."""

from __future__ import annotations


class RecipeError(Exception):
    """Base class for recipe-domain errors."""


class RecipeAgentError(RecipeError):
    """Raised when the AI agent fails to produce a recipe."""
