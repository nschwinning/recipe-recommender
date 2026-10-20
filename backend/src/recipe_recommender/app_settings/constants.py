"""Constants for the application-settings domain."""

from __future__ import annotations

# Default app language. German by product decision.
DEFAULT_LANGUAGE = "de"

# Supported languages: code -> native display label. The recipe agent generates
# in the selected language; the UI is translated for each of these.
SUPPORTED_LANGUAGES: dict[str, str] = {
    "de": "Deutsch",
    "en": "English",
}

# Human-readable language name passed to the AI agent's prompt.
LANGUAGE_PROMPT_NAMES: dict[str, str] = {
    "de": "German",
    "en": "English",
}

# Dietary preference codes. "none" means no restriction; vegan implies vegetarian.
DIET_NONE = "none"
DIET_VEGETARIAN = "vegetarian"
DIET_VEGAN = "vegan"
DEFAULT_DIET = DIET_NONE

# Supported diets (code -> English label). Labels are localized in the frontend;
# the codes are the stable contract shared with the API and the AI prompt.
SUPPORTED_DIETS: dict[str, str] = {
    DIET_NONE: "No restriction",
    DIET_VEGETARIAN: "Vegetarian",
    DIET_VEGAN: "Vegan",
}

# Words injected into the AI prompt for each restrictive diet ("none" is omitted).
DIET_PROMPT_NAMES: dict[str, str] = {
    DIET_VEGETARIAN: "vegetarian",
    DIET_VEGAN: "vegan",
}
