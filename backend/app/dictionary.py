from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

from app.trie import Trie


@dataclass
class DictionaryService:
    words: dict[str, int] = field(default_factory=dict)
    total_frequency: int = 0
    trie: Trie = field(default_factory=Trie)

    @property
    def word_count(self) -> int:
        return len(self.words)

    @classmethod
    def load(cls, path: str | Path) -> "DictionaryService":
        dictionary_path = Path(path)
        with dictionary_path.open("r", encoding="utf-8") as file:
            raw_words = json.load(file)

        normalized = {
            str(word).lower(): max(1, int(frequency))
            for word, frequency in raw_words.items()
        }
        service = cls(
            words=normalized,
            total_frequency=sum(normalized.values()),
        )
        for word, frequency in normalized.items():
            service.trie.insert(word, frequency)
        return service

    def contains(self, word: str) -> bool:
        return word.lower() in self.words

    def add_word(self, word: str, frequency: int = 1) -> None:
        normalized = word.strip().lower()
        if not normalized:
            raise ValueError("word must not be empty")

        safe_frequency = max(1, int(frequency))
        previous_frequency = self.words.get(normalized)
        self.words[normalized] = safe_frequency
        if previous_frequency is None:
            self.total_frequency += safe_frequency
        else:
            self.total_frequency += safe_frequency - previous_frequency

        self.trie.insert(normalized, safe_frequency)
