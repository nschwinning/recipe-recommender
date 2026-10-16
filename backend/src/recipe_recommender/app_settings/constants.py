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
