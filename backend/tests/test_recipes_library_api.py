"""Tests for the saved-recipes library (liking the recipe of the day)."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_like_saves_recipe_of_the_day_to_library(client: TestClient) -> None:
    today = client.get("/api/v1/recipe-of-the-day").json()
    assert today["saved_recipe_id"] is None

    response = client.post("/api/v1/recipe-of-the-day/like")
    assert response.status_code == 200
    saved = response.json()
    assert saved["title"] == today["title"]
    assert saved["ingredients"] == today["ingredients"]
    assert saved["source"] == "recipe_of_the_day"
    assert saved["language"] == today["language"]

    # The recipe of the day now reports the saved library id.
    after = client.get("/api/v1/recipe-of-the-day").json()
    assert after["saved_recipe_id"] == saved["id"]

    listed = client.get("/api/v1/recipes").json()
    assert [r["id"] for r in listed] == [saved["id"]]


def test_like_is_idempotent_per_day(client: TestClient) -> None:
    client.get("/api/v1/recipe-of-the-day")
    first = client.post("/api/v1/recipe-of-the-day/like").json()
    second = client.post("/api/v1/recipe-of-the-day/like").json()

    assert first["id"] == second["id"]
    assert len(client.get("/api/v1/recipes").json()) == 1


def test_unlike_removes_recipe_from_library(client: TestClient) -> None:
    client.get("/api/v1/recipe-of-the-day")
    client.post("/api/v1/recipe-of-the-day/like")

    response = client.delete("/api/v1/recipe-of-the-day/like")
    assert response.status_code == 204

    assert client.get("/api/v1/recipes").json() == []
    assert client.get("/api/v1/recipe-of-the-day").json()["saved_recipe_id"] is None


def test_unlike_is_a_noop_when_not_liked(client: TestClient) -> None:
    client.get("/api/v1/recipe-of-the-day")
    response = client.delete("/api/v1/recipe-of-the-day/like")
    assert response.status_code == 204
    assert client.get("/api/v1/recipes").json() == []
