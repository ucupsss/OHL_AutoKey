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
