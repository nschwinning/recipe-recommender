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
