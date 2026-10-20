"""Tests for the application-settings API (language preference)."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_get_settings_defaults_to_german(client: TestClient) -> None:
    response = client.get("/api/v1/settings")
    assert response.status_code == 200
    body = response.json()
    assert body["language"] == "de"
    codes = {opt["code"] for opt in body["available_languages"]}
    assert codes == {"de", "en"}


def test_update_language_persists_and_regenerates_recipe(client: TestClient) -> None:
    # Generate today's recipe in the default language first.
    first = client.get("/api/v1/recipe-of-the-day").json()
    assert first["language"] == "de"

    update = client.put("/api/v1/settings", json={"language": "en"})
    assert update.status_code == 200
    assert update.json()["language"] == "en"

    # The settings change is persisted...
    assert client.get("/api/v1/settings").json()["language"] == "en"
    # ...and today's recipe was regenerated in the new language in place.
    second = client.get("/api/v1/recipe-of-the-day").json()
    assert second["id"] == first["id"]
    assert second["language"] == "en"


def test_update_language_rejects_unsupported(client: TestClient) -> None:
    response = client.put("/api/v1/settings", json={"language": "xx"})
    assert response.status_code == 422
    # The stored language is unchanged.
    assert client.get("/api/v1/settings").json()["language"] == "de"


def test_get_settings_exposes_default_cooking_preferences(client: TestClient) -> None:
    body = client.get("/api/v1/settings").json()
    assert body["servings"] is None
    assert body["diet"] == "none"
    assert body["liked_ingredients"] == []
    assert body["disliked_ingredients"] == []
    assert body["available_diets"] == ["none", "vegetarian", "vegan"]


def test_update_preferences_persists_and_normalizes(client: TestClient) -> None:
    response = client.put(
        "/api/v1/settings/preferences",
        json={
            "servings": 6,
            "diet": "vegan",
            "liked_ingredients": ["  Tofu ", "tofu", "Spinach"],
            "disliked_ingredients": ["Cilantro", ""],
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["servings"] == 6
    assert body["diet"] == "vegan"
    # Trimmed, blanks dropped, case-insensitive dedupe (first spelling wins).
    assert body["liked_ingredients"] == ["Tofu", "Spinach"]
    assert body["disliked_ingredients"] == ["Cilantro"]

    # Persisted across reads.
    assert client.get("/api/v1/settings").json()["diet"] == "vegan"


def test_update_preferences_rejects_unknown_diet(client: TestClient) -> None:
    response = client.put("/api/v1/settings/preferences", json={"diet": "carnivore"})
    assert response.status_code == 422
    assert client.get("/api/v1/settings").json()["diet"] == "none"


def test_preferences_influence_suggested_recipe(client: TestClient) -> None:
    client.put(
        "/api/v1/settings/preferences",
        json={"servings": 6, "diet": "vegan"},
    )

    draft = client.post(
        "/api/v1/recipes/suggest",
        json={"prompt": "something quick"},
    ).json()

    # The stub reflects the standing preferences deterministically.
    assert draft["servings"] == 6
    assert "vegan" in draft["tags"]


def test_preferences_do_not_regenerate_todays_recipe(client: TestClient) -> None:
    first = client.get("/api/v1/recipe-of-the-day").json()

    client.put("/api/v1/settings/preferences", json={"servings": 8, "diet": "vegetarian"})

    # Today's existing recipe is left untouched by a preference change.
    second = client.get("/api/v1/recipe-of-the-day").json()
    assert second["id"] == first["id"]
    assert second["servings"] == first["servings"]
