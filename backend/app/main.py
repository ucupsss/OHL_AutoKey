import re
from pathlib import Path

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from app.bigram import BigramModel
from app.dictionary import DictionaryService
from app.levenshtein import find_spell_suggestions
from app.segmentation import segment_text
from app.smart_trim import smart_trim_text
from app.schemas import (
    AddWordRequest,
    AddWordResponse,
    AutocompleteResponse,
    BigramObserveRequest,
    BigramObserveResponse,
    BigramStatsResponse,
    CheckAllRequest,
    CheckAllResponse,
    InvalidWordResponse,
    SegmentRequest,
    SegmentResponse,
    SmartTrimRequest,
    SmartTrimResponse,
    SmartTrimTracebackStepResponse,
    SmartTrimWordResponse,
    SpellSuggestionResponse,
    SpellSuggestionsResponse,
    SuggestionResponse,
    TracebackStepResponse,
    ValidateResponse,
)


ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_PATH = ROOT_DIR / "data" / "kamus.json"

app = FastAPI(title="AutoKey API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
dictionary_service = DictionaryService.load(DATA_PATH)
bigram_model = BigramModel()
WORD_PATTERN = re.compile(r"[A-Za-zÀ-ÿ]+")


def _spell_suggestions(word: str, limit: int = 5) -> list[SpellSuggestionResponse]:
    suggestions = find_spell_suggestions(
        word,
        dictionary_service.words,
        max_distance=2,
        limit=limit,
    )
    return [
        SpellSuggestionResponse(
            word=item.word,
            frequency=item.frequency,
            distance=item.distance,
        )
        for item in suggestions
    ]


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
    previous_word: str | None = Query(default=None),
    bigram: bool = Query(default=False),
) -> AutocompleteResponse:
    candidate_limit = 20 if bigram and previous_word else limit
    candidates = dictionary_service.trie.get_suggestions(prefix, candidate_limit)
    bigram_used = False
    if bigram and previous_word:
        reranked = bigram_model.rerank(previous_word, candidates)
        bigram_used = reranked != candidates
        candidates = reranked
    suggestions = candidates[:limit]
    return AutocompleteResponse(
        suggestions=[
            SuggestionResponse(word=item.word, frequency=item.frequency)
            for item in suggestions
        ],
        bigram_used=bigram_used,
    )


@app.get("/validate", response_model=ValidateResponse)
def validate(word: str = Query(..., min_length=1)) -> ValidateResponse:
    normalized = word.strip().lower()
    return ValidateResponse(
        word=normalized,
        valid=dictionary_service.contains(normalized),
    )


@app.get("/spell-suggestions", response_model=SpellSuggestionsResponse)
def spell_suggestions(
    word: str = Query(..., min_length=1),
    limit: int = Query(default=5, ge=1, le=20),
) -> SpellSuggestionsResponse:
    return SpellSuggestionsResponse(suggestions=_spell_suggestions(word, limit))


@app.post("/check-all", response_model=CheckAllResponse)
def check_all(request: CheckAllRequest) -> CheckAllResponse:
    invalid_words: list[InvalidWordResponse] = []
    for match in WORD_PATTERN.finditer(request.text):
        word = match.group(0).lower()
        if not dictionary_service.contains(word):
            invalid_words.append(
                InvalidWordResponse(
                    word=word,
                    start=match.start(),
                    end=match.end(),
                    suggestions=_spell_suggestions(word, 5),
                )
            )
    return CheckAllResponse(invalid_words=invalid_words)


@app.post("/dictionary/add", response_model=AddWordResponse)
def add_word(request: AddWordRequest) -> AddWordResponse:
    normalized = request.word.strip().lower()
    dictionary_service.add_word(normalized, 1)
    return AddWordResponse(
        word=normalized,
        added=True,
        valid=dictionary_service.contains(normalized),
    )


@app.post("/segment", response_model=SegmentResponse)
def segment(request: SegmentRequest) -> SegmentResponse:
    result = segment_text(
        request.text,
        dictionary_service.words,
        dictionary_service.total_frequency,
    )
    return SegmentResponse(
        success=result.success,
        segmented_text=result.segmented_text,
        dp=result.dp,
        traceback=[
            TracebackStepResponse(
                start=step.start,
                end=step.end,
                word=step.word,
                cost=step.cost,
            )
            for step in result.traceback
        ],
        message=result.message,
    )


@app.post("/smart-trim", response_model=SmartTrimResponse)
def smart_trim(request: SmartTrimRequest) -> SmartTrimResponse:
    result = smart_trim_text(
        request.text,
        dictionary_service.words,
        dictionary_service.total_frequency,
        request.max_characters,
    )
    return SmartTrimResponse(
        success=result.success,
        trimmed_text=result.trimmed_text,
        kept_words=[
            SmartTrimWordResponse(
                index=item.index,
                word=item.word,
                weight=item.weight,
                value=item.value,
            )
            for item in result.kept_words
        ],
        total_characters=result.total_characters,
        total_value=result.total_value,
        dp=result.dp,
        traceback=[
            SmartTrimTracebackStepResponse(
                index=step.index,
                word=step.word,
                remaining_capacity=step.remaining_capacity,
                value=step.value,
            )
            for step in result.traceback
        ],
        message=result.message,
    )


@app.post("/bigram/observe", response_model=BigramObserveResponse)
def observe_bigram(request: BigramObserveRequest) -> BigramObserveResponse:
    previous = request.previous_word.strip().lower()
    current = request.current_word.strip().lower()
    observed = (
        dictionary_service.contains(previous)
        and dictionary_service.contains(current)
    )
    if observed:
        bigram_model.observe(previous, current)

    return BigramObserveResponse(
        previous_word=previous,
        current_word=current,
        observed=observed,
        pair_count=bigram_model.pair_count,
    )


@app.get("/bigram/stats", response_model=BigramStatsResponse)
def bigram_stats() -> BigramStatsResponse:
    stats_result = bigram_model.stats()
    return BigramStatsResponse(
        pair_count=stats_result.pair_count,
        context_count=stats_result.context_count,
    )
