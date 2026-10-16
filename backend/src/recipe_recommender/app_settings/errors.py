"""Domain errors for the application-settings domain."""

from __future__ import annotations


class AppSettingsError(Exception):
    """Base class for application-settings errors."""


class UnsupportedLanguageError(AppSettingsError):
    """Raised when an unsupported language code is requested."""
