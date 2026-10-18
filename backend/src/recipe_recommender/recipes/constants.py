"""Constants for the recipe-of-the-day domain."""

from __future__ import annotations

# Marker stored in ``generated_by`` when the deterministic stub agent is used.
STUB_GENERATOR = "stub"

# Name reported by the AI agent to the openai-agents SDK.
RECIPE_AGENT_NAME = "recipe-of-the-day"

# How a saved :class:`Recipe` entered the reusable library. These are the only
# accepted values for ``Recipe.source``; keep them in sync with any migration.
SOURCE_RECIPE_OF_THE_DAY = "recipe_of_the_day"
SOURCE_MANUAL = "manual"
SOURCE_AI_PARSED = "ai_parsed"
SOURCE_AI_GENERATED = "ai_generated"
RECIPE_SOURCES = frozenset(
    {SOURCE_RECIPE_OF_THE_DAY, SOURCE_MANUAL, SOURCE_AI_PARSED, SOURCE_AI_GENERATED}
)
