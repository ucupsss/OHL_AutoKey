from pathlib import Path

from fastapi import FastAPI, Query

from app.dictionary import DictionaryService
from app.schemas import AutocompleteResponse, SuggestionResponse, ValidateResponse


ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_PATH = ROOT_DIR / "data" / "kamus.json"

app = FastAPI(title="AutoKey API")
dictionary_service = DictionaryService.load(DATA_PATH)


@app.get("/health")
def health() -> dict[str, bool | int]:
    return {
        "ok": True,
        "dictionary_loaded": dictionary_service.word_count > 0,
        "word_count": dictionary_service.word_count,
    }


@app.get("/stats")
def stats() -> dict[str, int | float]:
    trie_stats = dictionary_service.trie.stats()
    return {
        "word_count": trie_stats.word_count,
        "node_count": trie_stats.node_count,
        "average_depth": trie_stats.average_depth,
        "estimated_memory_bytes": trie_stats.estimated_memory_bytes,
    }


@app.get("/autocomplete", response_model=AutocompleteResponse)
def autocomplete(
    prefix: str = Query(default=""),
    limit: int = Query(default=5, ge=1, le=20),
) -> AutocompleteResponse:
    suggestions = dictionary_service.trie.get_suggestions(prefix, limit)
    return AutocompleteResponse(
        suggestions=[
            SuggestionResponse(word=item.word, frequency=item.frequency)
            for item in suggestions
        ]
    )


@app.get("/validate", response_model=ValidateResponse)
def validate(word: str = Query(..., min_length=1)) -> ValidateResponse:
    normalized = word.strip().lower()
    return ValidateResponse(
        word=normalized,
        valid=dictionary_service.contains(normalized),
    )
