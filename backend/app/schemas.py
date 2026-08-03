from pydantic import BaseModel, Field


class SuggestionResponse(BaseModel):
    word: str
    frequency: int


class AutocompleteResponse(BaseModel):
    suggestions: list[SuggestionResponse]
    bigram_used: bool = False


class ValidateResponse(BaseModel):
    word: str
    valid: bool


class SpellSuggestionResponse(BaseModel):
    word: str
    frequency: int
    distance: int


class SpellSuggestionsResponse(BaseModel):
    suggestions: list[SpellSuggestionResponse]


class CheckAllRequest(BaseModel):
    text: str = Field(default="")


class InvalidWordResponse(BaseModel):
    word: str
    start: int
    end: int
    suggestions: list[SpellSuggestionResponse]


class CheckAllResponse(BaseModel):
    invalid_words: list[InvalidWordResponse]


class AddWordRequest(BaseModel):
    word: str = Field(min_length=1)


class AddWordResponse(BaseModel):
    word: str
    added: bool
    valid: bool


class SegmentRequest(BaseModel):
    text: str = Field(min_length=1)


class TracebackStepResponse(BaseModel):
    start: int
    end: int
    word: str
    cost: float


class SegmentResponse(BaseModel):
    success: bool
    segmented_text: str
    dp: list[float | None]
    traceback: list[TracebackStepResponse]
    message: str


class SmartTrimRequest(BaseModel):
    text: str = Field(min_length=1)
    max_characters: int = Field(ge=1, le=240)


class SmartTrimWordResponse(BaseModel):
    index: int
    word: str
    weight: int
    value: float


class SmartTrimTracebackStepResponse(BaseModel):
    index: int
    word: str
    remaining_capacity: int
    value: float


class SmartTrimResponse(BaseModel):
    success: bool
    trimmed_text: str
    kept_words: list[SmartTrimWordResponse]
    total_characters: int
    total_value: float
    dp: list[list[float]]
    traceback: list[SmartTrimTracebackStepResponse]
    message: str


class BigramObserveRequest(BaseModel):
    previous_word: str = Field(min_length=1)
    current_word: str = Field(min_length=1)


class BigramObserveResponse(BaseModel):
    previous_word: str
    current_word: str
    observed: bool
    pair_count: int


class BigramStatsResponse(BaseModel):
    pair_count: int
    context_count: int
