"""Pydantic v2 response/request schemas for the API."""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


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
    language: str
    source: str
    generated_by: str | None
    created_at: datetime


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
