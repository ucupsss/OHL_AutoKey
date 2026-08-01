from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_reports_dictionary_status():
    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["ok"] is True
    assert "dictionary_loaded" in payload
    assert "word_count" in payload


def test_stats_returns_trie_statistics():
    response = client.get("/stats")

    assert response.status_code == 200
    payload = response.json()
    assert payload["word_count"] > 0
    assert payload["node_count"] > 0
    assert payload["average_depth"] > 0
    assert payload["estimated_memory_bytes"] > 0


def test_autocomplete_returns_top_suggestions():
    response = client.get("/autocomplete", params={"prefix": "prog", "limit": 5})

    assert response.status_code == 200
    payload = response.json()
    assert "suggestions" in payload
    assert len(payload["suggestions"]) <= 5
    assert all(item["word"].startswith("prog") for item in payload["suggestions"])


def test_autocomplete_empty_prefix_returns_empty_list():
    response = client.get("/autocomplete", params={"prefix": "", "limit": 5})

    assert response.status_code == 200
    assert response.json()["suggestions"] == []


def test_validate_reports_known_word():
    response = client.get("/validate", params={"word": "program"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["word"] == "program"
    assert isinstance(payload["valid"], bool)
