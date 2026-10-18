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


def test_recipe_of_the_day_exposes_ai_tags(client: TestClient) -> None:
    body = client.get("/api/v1/recipe-of-the-day").json()
    # The stub agent assigns tags; they surface on the read model.
    assert body["tags"]


def test_update_tags_normalizes_and_persists(client: TestClient) -> None:
    client.get("/api/v1/recipe-of-the-day")

    response = client.patch(
        "/api/v1/recipe-of-the-day/tags",
        json={"tags": ["  Vegan ", "", "vegan", "quick"]},
    )
    assert response.status_code == 200
    # Blanks dropped, trimmed, case-insensitive dedupe (first spelling wins).
    assert response.json()["tags"] == ["Vegan", "quick"]

    # Persisted across reads.
    assert client.get("/api/v1/recipe-of-the-day").json()["tags"] == ["Vegan", "quick"]


def test_edited_tags_sync_to_saved_copy(client: TestClient) -> None:
    client.get("/api/v1/recipe-of-the-day")
    saved = client.post("/api/v1/recipe-of-the-day/like").json()

    client.patch("/api/v1/recipe-of-the-day/tags", json={"tags": ["weeknight"]})

    library = client.get("/api/v1/recipes").json()
    assert len(library) == 1
    assert library[0]["id"] == saved["id"]
    assert library[0]["tags"] == ["weeknight"]


PASTED_RECIPE = (
    "Grandma's Tomato Soup\n"
    "Ingredients:\n"
    "2 ripe tomatoes\n"
    "1 onion\n"
    "Steps:\n"
    "Chop everything.\n"
    "Simmer for 20 minutes."
)


def test_parse_recipe_returns_structured_draft_without_saving(client: TestClient) -> None:
    response = client.post("/api/v1/recipes/parse", json={"text": PASTED_RECIPE})
    assert response.status_code == 200
    draft = response.json()

    assert draft["title"] == "Grandma's Tomato Soup"
    assert draft["ingredients"] == ["2 ripe tomatoes", "1 onion"]
    assert draft["steps"] == ["Chop everything.", "Simmer for 20 minutes."]
    assert draft["generated_by"]  # provenance carried for the save step

    # Parsing does not persist anything.
    assert client.get("/api/v1/recipes").json() == []


def test_parse_requires_non_empty_text(client: TestClient) -> None:
    response = client.post("/api/v1/recipes/parse", json={"text": ""})
    assert response.status_code == 422


def test_create_recipe_saves_reviewed_draft_to_library(client: TestClient) -> None:
    draft = client.post("/api/v1/recipes/parse", json={"text": PASTED_RECIPE}).json()

    # The user reviews/edits the draft, then saves it.
    payload = {
        **draft,
        "title": "Tomato Soup",  # edited during review
        "tags": ["  Soup ", "soup", "comfort"],  # normalized on save
        "source": "ai_parsed",
    }
    response = client.post("/api/v1/recipes", json=payload)
    assert response.status_code == 201
    saved = response.json()

    assert saved["title"] == "Tomato Soup"
    assert saved["source"] == "ai_parsed"
    assert saved["ingredients"] == ["2 ripe tomatoes", "1 onion"]
    assert saved["tags"] == ["Soup", "comfort"]

    library = client.get("/api/v1/recipes").json()
    assert [r["id"] for r in library] == [saved["id"]]


def test_create_recipe_rejects_unknown_source(client: TestClient) -> None:
    response = client.post(
        "/api/v1/recipes",
        json={"title": "X", "ingredients": [], "steps": [], "source": "bogus"},
    )
    assert response.status_code == 422


def test_suggest_generates_recipe_from_prompt_without_saving(client: TestClient) -> None:
    response = client.post(
        "/api/v1/recipes/suggest",
        json={"prompt": "Ich habe Paprika und Brokkoli, gib mir ein vegetarisches Rezept"},
    )
    assert response.status_code == 200
    draft = response.json()

    assert draft["title"]
    assert draft["ingredients"]
    assert draft["steps"]
    assert draft["generated_by"]

    # Suggesting does not persist anything.
    assert client.get("/api/v1/recipes").json() == []


def test_suggest_requires_non_empty_prompt(client: TestClient) -> None:
    response = client.post("/api/v1/recipes/suggest", json={"prompt": ""})
    assert response.status_code == 422


def test_suggested_recipe_can_be_saved_as_ai_generated(client: TestClient) -> None:
    draft = client.post(
        "/api/v1/recipes/suggest",
        json={"prompt": "something vegetarian"},
    ).json()

    response = client.post("/api/v1/recipes", json={**draft, "source": "ai_generated"})
    assert response.status_code == 201
    saved = response.json()
    assert saved["source"] == "ai_generated"

    library = client.get("/api/v1/recipes").json()
    assert [r["id"] for r in library] == [saved["id"]]
