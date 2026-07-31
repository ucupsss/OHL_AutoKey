from pathlib import Path

from fastapi import FastAPI

from app.dictionary import DictionaryService


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
