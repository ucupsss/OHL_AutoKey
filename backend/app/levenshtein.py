from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class SpellSuggestion:
    word: str
    frequency: int
    distance: int


def levenshtein_table(source: str, target: str) -> list[list[int]]:
    source_text = source.lower()
    target_text = target.lower()
    rows = len(source_text) + 1
    columns = len(target_text) + 1
    dp = [[0 for _ in range(columns)] for _ in range(rows)]

    for i in range(rows):
        dp[i][0] = i
    for j in range(columns):
        dp[0][j] = j

    for i in range(1, rows):
        for j in range(1, columns):
            cost = 0 if source_text[i - 1] == target_text[j - 1] else 1
            dp[i][j] = min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost,
            )

    return dp


def levenshtein_distance(source: str, target: str) -> int:
    return levenshtein_table(source, target)[-1][-1]


def find_spell_suggestions(
    word: str,
    words: dict[str, int],
    max_distance: int = 2,
    limit: int = 5,
) -> list[SpellSuggestion]:
    normalized = word.strip().lower()
    candidates: list[SpellSuggestion] = []

    for candidate, frequency in words.items():
        if abs(len(candidate) - len(normalized)) > max_distance:
            continue

        distance = levenshtein_distance(normalized, candidate)
        if distance <= max_distance:
            candidates.append(
                SpellSuggestion(
                    word=candidate,
                    frequency=frequency,
                    distance=distance,
                )
            )

    candidates.sort(key=lambda item: (item.distance, -item.frequency, item.word))
    return candidates[:limit]
