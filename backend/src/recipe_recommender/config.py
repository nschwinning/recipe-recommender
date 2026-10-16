"""Application settings loaded from environment / .env via pydantic-settings."""

from __future__ import annotations

from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    """Typed application configuration."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # App metadata
    APP_NAME: str = "Recipe Recommender"
    APP_VERSION: str = "0.1.0"

    # Database (sync psycopg 3 driver)
    DATABASE_URL: str = (
        "postgresql+psycopg://recipe:recipe@localhost:5436/recipe"
    )
    TEST_DATABASE_URL: str = (
        "postgresql+psycopg://recipe:recipe@localhost:5436/recipe_test"
    )

    # CORS origins, parsed from a comma-separated env value
    CORS_ORIGINS: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:5175"]
    )

    # AI generation. All keys default empty so the app boots without them; the
    # stub agent lets the app run end-to-end with no OpenAI credentials.
    OPENAI_API_KEY: str = ""
    RECIPE_MODEL: str = "gpt-5-mini"
    RECIPE_STUB: bool = False
    RECIPE_AGENT_TIMEOUT_SECONDS: int = 120
    RECIPE_MAX_TURNS: int = 4

    # The timezone used to decide which calendar day "today's recipe" belongs to.
    RECIPE_TIMEZONE: str = "America/New_York"

    # Shared secret guarding the cron-triggered generation endpoint
    # (X-Cron-Token header). An empty default rejects every cron trigger.
    RECIPE_CRON_TOKEN: str = ""

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _split_cors_origins(cls, value: object) -> object:
        """Allow CORS_ORIGINS to be provided as a comma-separated string."""
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


settings = Settings()
