"""Tests for the recipe-of-the-day API (uses the stub agent, no network)."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from recipe_recommender.config import settings


def test_get_recipe_of_the_day_generates_on_demand(client: TestClient) -> None:
    response = client.get("/api/v1/recipe-of-the-day")
    assert response.status_code == 200
    body = response.json()
    assert body["title"]
    assert body["ingredients"]
    assert body["steps"]
    assert body["generated_by"] == "stub"


def test_get_recipe_of_the_day_is_stable_within_a_day(client: TestClient) -> None:
    first = client.get("/api/v1/recipe-of-the-day").json()
    second = client.get("/api/v1/recipe-of-the-day").json()
    assert first["id"] == second["id"]
    assert first["recipe_date"] == second["recipe_date"]


def test_generate_requires_cron_token(client: TestClient) -> None:
    response = client.post("/api/v1/recipe-of-the-day/generate")
    assert response.status_code == 403


def test_generate_with_valid_token(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "RECIPE_CRON_TOKEN", "secret-token")

    response = client.post(
        "/api/v1/recipe-of-the-day/generate",
        headers={"X-Cron-Token": "secret-token"},
    )
    assert response.status_code == 200
    assert response.json()["generated_by"] == "stub"
