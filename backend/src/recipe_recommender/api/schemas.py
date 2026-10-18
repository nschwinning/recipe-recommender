"""Pydantic v2 response/request schemas for the API."""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from recipe_recommender.recipes.constants import RECIPE_SOURCES, SOURCE_MANUAL


class HealthResponse(BaseModel):
    """Liveness/readiness payload. Always returned with HTTP 200."""

    status: str
    database: str


class RecipeOfTheDayRead(BaseModel):
    """A single AI-generated recipe for one calendar day."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    recipe_date: date
    title: str
    summary: str
    cuisine: str | None
    prep_minutes: int | None
    cook_minutes: int | None
    servings: int | None
    ingredients: list[str]
    steps: list[str]
    tags: list[str]
    language: str
    generated_by: str
    created_at: datetime
    # Id of the saved library copy when this day's recipe has been liked, else None.
    saved_recipe_id: int | None = None


class RecipeRead(BaseModel):
    """A reusable recipe stored in the user's saved library."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    summary: str
    cuisine: str | None
    prep_minutes: int | None
    cook_minutes: int | None
    servings: int | None
    ingredients: list[str]
    steps: list[str]
    tags: list[str]
    language: str
    source: str
    generated_by: str | None
    created_at: datetime


class RecipeTagsUpdate(BaseModel):
    """Request body to replace a recipe's tags."""

    tags: list[str] = Field(default_factory=list)


class RecipeParseRequest(BaseModel):
    """Request body to parse free-form recipe text into a structured draft."""

    text: str = Field(..., min_length=1, description="Raw pasted recipe text")
    language: str | None = Field(
        default=None, description="Target language code; defaults to the app language"
    )


class RecipeSuggestRequest(BaseModel):
    """Request body to generate a recipe from a free-form user prompt."""

    prompt: str = Field(..., min_length=1, description="What the user wants, in prose")
    language: str | None = Field(
        default=None, description="Target language code; defaults to the app language"
    )


class RecipeDraftRead(BaseModel):
    """A structured recipe parsed from text, returned for review before saving."""

    title: str
    summary: str
    cuisine: str | None
    prep_minutes: int | None
    cook_minutes: int | None
    servings: int | None
    ingredients: list[str]
    steps: list[str]
    tags: list[str]
    language: str
    # Provenance of the parse (model id or ``stub``), carried into the save step.
    generated_by: str


class RecipeCreate(BaseModel):
    """Request body to save a reviewed recipe into the library."""

    title: str = Field(..., min_length=1)
    summary: str = ""
    cuisine: str | None = None
    prep_minutes: int | None = Field(default=None, ge=0)
    cook_minutes: int | None = Field(default=None, ge=0)
    servings: int | None = Field(default=None, ge=0)
    ingredients: list[str] = Field(default_factory=list)
    steps: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    language: str | None = None
    source: str = SOURCE_MANUAL
    generated_by: str | None = None

    @field_validator("source")
    @classmethod
    def _valid_source(cls, value: str) -> str:
        if value not in RECIPE_SOURCES:
            raise ValueError(f"source must be one of {sorted(RECIPE_SOURCES)}")
        return value


class LanguageOption(BaseModel):
    """A selectable language: its code and native display label."""

    code: str
    label: str


class AppSettingsRead(BaseModel):
    """Current application settings plus the available language options."""

    language: str
    available_languages: list[LanguageOption]


class AppSettingsUpdate(BaseModel):
    """Request body to update application settings."""

    language: str = Field(..., min_length=2, description="Language code, e.g. 'de'")
