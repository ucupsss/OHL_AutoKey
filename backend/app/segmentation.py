from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass(frozen=True)
class TracebackStep:
    start: int
    end: int
    word: str
    cost: float


@dataclass(frozen=True)
class SegmentationResult:
    success: bool
    segmented_text: str
    dp: list[float | None]
    traceback: list[TracebackStep]
    message: str


def segment_text(
    text: str,
    frequencies: dict[str, int],
    total_frequency: int,
) -> SegmentationResult:
    normalized = "".join(text.lower().split())
    length = len(normalized)
    infinity = math.inf
    dp = [infinity for _ in range(length + 1)]
    previous: list[tuple[int, str, float] | None] = [
        None for _ in range(length + 1)
    ]
    dp[0] = 0.0

    for end in range(1, length + 1):
        for start in range(0, end):
            word = normalized[start:end]
            frequency = frequencies.get(word)
            if frequency is None or dp[start] == infinity:
                continue

            cost = math.log(total_frequency / max(1, frequency))
            candidate = dp[start] + cost
            if candidate < dp[end]:
                dp[end] = candidate
                previous[end] = (start, word, cost)

    readable_dp: list[float | None] = [
        None if value == infinity else round(value, 6)
        for value in dp
    ]

    if dp[length] == infinity:
        return SegmentationResult(
            success=False,
            segmented_text="",
            dp=readable_dp,
            traceback=[],
            message="Tidak ada segmentasi valid untuk input ini.",
        )

    traceback: list[TracebackStep] = []
    cursor = length
    words: list[str] = []
    while cursor > 0:
        step = previous[cursor]
        if step is None:
            break

        start, word, cost = step
        traceback.append(
            TracebackStep(
                start=start,
                end=cursor,
                word=word,
                cost=round(cost, 6),
            )
        )
        words.append(word)
        cursor = start

    words.reverse()
    return SegmentationResult(
        success=True,
        segmented_text=" ".join(words),
        dp=readable_dp,
        traceback=traceback,
        message="Segmentasi berhasil.",
    )
