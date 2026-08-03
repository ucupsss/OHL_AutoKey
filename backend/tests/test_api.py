from fastapi.testclient import TestClient

from app.main import WORD_PATTERN, app


client = TestClient(app)


def test_health_reports_dictionary_status():
    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["ok"] is True
    assert "dictionary_loaded" in payload
    assert "word_count" in payload


def test_cors_allows_frontend_development_origin():
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


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


def test_spell_suggestions_endpoint_returns_candidates():
    response = client.get("/spell-suggestions", params={"word": "prgram", "limit": 5})

    assert response.status_code == 200
    payload = response.json()
    assert "suggestions" in payload
    assert len(payload["suggestions"]) <= 5


def test_check_all_reports_invalid_words():
    response = client.post("/check-all", json={"text": "program qqqtidakvalid"})

    assert response.status_code == 200
    payload = response.json()
    invalid_words = payload["invalid_words"]
    assert any(item["word"] == "qqqtidakvalid" for item in invalid_words)


def test_word_pattern_matches_unicode_letters_as_one_token():
    text = "caf\u00e9tes"

    matches = [match.group(0) for match in WORD_PATTERN.finditer(text)]

    assert matches == [text]


def test_dictionary_add_makes_word_valid_runtime():
    response = client.post("/dictionary/add", json={"word": "katabarutes"})

    assert response.status_code == 200
    assert response.json()["valid"] is True

    validate_response = client.get("/validate", params={"word": "katabarutes"})
    assert validate_response.json()["valid"] is True


def test_segment_endpoint_returns_dp_and_traceback():
    response = client.post("/segment", json={"text": "programdinamis"})

    assert response.status_code == 200
    payload = response.json()
    assert "success" in payload
    assert "dp" in payload
    assert "traceback" in payload
    assert isinstance(payload["dp"], list)


def test_smart_trim_endpoint_returns_knapsack_traceback():
    response = client.post(
        "/smart-trim",
        json={
            "text": "program dinamis algoritma",
            "max_characters": 15,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert "trimmed_text" in payload
    assert "kept_words" in payload
    assert "dp" in payload
    assert "traceback" in payload
    assert payload["total_characters"] <= 15
