from __future__ import annotations

import math
import re
from dataclasses import dataclass


WORD_PATTERN = re.compile(r"[^\W\d_]+", re.UNICODE)


@dataclass(frozen=True)
class SmartTrimWord:
    index: int
    word: str
    weight: int
    value: float


@dataclass(frozen=True)
class SmartTrimTracebackStep:
    index: int
    word: str
    remaining_capacity: int
    value: float


@dataclass(frozen=True)
class SmartTrimResult:
    success: bool
    trimmed_text: str
    kept_words: list[SmartTrimWord]
    total_characters: int
    total_value: float
    dp: list[list[float]]
    traceback: list[SmartTrimTracebackStep]
    message: str


def _word_value(word: str, frequencies: dict[str, int], total_frequency: int) -> float:
    frequency = max(1, frequencies.get(word, 1))
    safe_total = max(total_frequency, frequency, 1)
    return math.log(safe_total / frequency)


def smart_trim_text(
    text: str,
    frequencies: dict[str, int],
    total_frequency: int,
    max_characters: int,
) -> SmartTrimResult:
    capacity = max(0, int(max_characters))
    words = [match.group(0).lower() for match in WORD_PATTERN.finditer(text)]
    items = [
        SmartTrimWord(
            index=index,
            word=word,
            weight=len(word),
            value=_word_value(word, frequencies, total_frequency),
        )
        for index, word in enumerate(words)
    ]

    dp = [[0.0 for _ in range(capacity + 1)] for _ in range(len(items) + 1)]
    keep = [[False for _ in range(capacity + 1)] for _ in range(len(items) + 1)]

    for item_index, item in enumerate(items, start=1):
        for current_capacity in range(capacity + 1):
            best_without_item = dp[item_index - 1][current_capacity]
            best_with_item = -math.inf
            if item.weight <= current_capacity:
                best_with_item = (
                    dp[item_index - 1][current_capacity - item.weight] + item.value
                )

            if best_with_item > best_without_item:
                dp[item_index][current_capacity] = best_with_item
                keep[item_index][current_capacity] = True
            else:
                dp[item_index][current_capacity] = best_without_item

    traceback: list[SmartTrimTracebackStep] = []
    kept_words_reversed: list[SmartTrimWord] = []
    cursor_capacity = capacity
    for item_index in range(len(items), 0, -1):
        if not keep[item_index][cursor_capacity]:
            continue

        item = items[item_index - 1]
        traceback.append(
            SmartTrimTracebackStep(
                index=item.index,
                word=item.word,
                remaining_capacity=cursor_capacity,
                value=round(item.value, 6),
            )
        )
        kept_words_reversed.append(
            SmartTrimWord(
                index=item.index,
                word=item.word,
                weight=item.weight,
                value=round(item.value, 6),
            )
        )
        cursor_capacity -= item.weight

    kept_words = list(reversed(kept_words_reversed))
    readable_dp = [[round(value, 6) for value in row] for row in dp]
    total_characters = sum(item.weight for item in kept_words)
    total_value = round(sum(item.value for item in kept_words), 6)

    if not kept_words:
        return SmartTrimResult(
            success=False,
            trimmed_text="",
            kept_words=[],
            total_characters=0,
            total_value=0.0,
            dp=readable_dp,
            traceback=[],
            message="Tidak ada kata yang muat dalam batas karakter.",
        )

    return SmartTrimResult(
        success=True,
        trimmed_text=" ".join(item.word for item in kept_words),
        kept_words=kept_words,
        total_characters=total_characters,
        total_value=total_value,
        dp=readable_dp,
        traceback=traceback,
        message="Smart Trim berhasil.",
    )
