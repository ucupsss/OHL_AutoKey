from pydantic import BaseModel


class SuggestionResponse(BaseModel):
    word: str
    frequency: int


class AutocompleteResponse(BaseModel):
    suggestions: list[SuggestionResponse]


class ValidateResponse(BaseModel):
    word: str
    valid: bool
