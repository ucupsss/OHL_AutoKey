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
