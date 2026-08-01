from pydantic import BaseModel, Field


class SuggestionResponse(BaseModel):
    word: str
    frequency: int


class AutocompleteResponse(BaseModel):
    suggestions: list[SuggestionResponse]


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
