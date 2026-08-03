from __future__ import annotations

from dataclasses import dataclass, field

from app.trie import Suggestion


@dataclass(frozen=True)
class BigramStats:
    pair_count: int
    context_count: int


@dataclass
class BigramModel:
    counts: dict[tuple[str, str], int] = field(default_factory=dict)
    totals: dict[str, int] = field(default_factory=dict)
    pair_count: int = 0

    def observe(self, previous_word: str, current_word: str) -> None:
        previous = previous_word.strip().lower()
        current = current_word.strip().lower()
        if not previous or not current:
            return

        key = (previous, current)
        self.counts[key] = self.counts.get(key, 0) + 1
        self.totals[previous] = self.totals.get(previous, 0) + 1
        self.pair_count += 1

    def probability(self, previous_word: str, current_word: str) -> float:
        previous = previous_word.strip().lower()
        current = current_word.strip().lower()
        total = self.totals.get(previous, 0)
        if total == 0:
            return 0.0
        return self.counts.get((previous, current), 0) / total

    def rerank(
        self,
        previous_word: str,
        candidates: list[Suggestion],
    ) -> list[Suggestion]:
        previous = previous_word.strip().lower()
        if not previous or previous not in self.totals:
            return candidates

        scored = [
            (
                self.probability(previous, candidate.word) * candidate.frequency,
                candidate,
            )
            for candidate in candidates
        ]
        if not any(score > 0 for score, _candidate in scored):
            return candidates

        scored.sort(key=lambda item: (-item[0], -item[1].frequency, item[1].word))
        return [candidate for _score, candidate in scored]

    def stats(self) -> BigramStats:
        return BigramStats(
            pair_count=self.pair_count,
            context_count=len(self.totals),
        )
