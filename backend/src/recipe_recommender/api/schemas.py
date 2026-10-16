"""Pydantic v2 response/request schemas for the API."""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


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
    generated_by: str
    created_at: datetime
