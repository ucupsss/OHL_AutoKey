from app.smart_trim import smart_trim_text


def test_smart_trim_keeps_highest_value_words_under_character_limit():
    frequencies = {
        "umum": 100,
        "langka": 1,
        "sedang": 10,
    }

    result = smart_trim_text(
        "umum langka sedang",
        frequencies,
        total_frequency=111,
        max_characters=12,
    )

    assert result.success is True
    assert result.trimmed_text == "langka sedang"
    assert [word.word for word in result.kept_words] == ["langka", "sedang"]
    assert result.total_characters == 12
    assert len(result.dp) == 4
    assert len(result.dp[0]) == 13
    assert result.traceback[0].word == "sedang"


def test_smart_trim_reports_empty_result_when_limit_is_too_small():
    result = smart_trim_text(
        "program",
        {"program": 50},
        total_frequency=50,
        max_characters=3,
    )

    assert result.success is False
    assert result.trimmed_text == ""
    assert result.kept_words == []
    assert result.message == "Tidak ada kata yang muat dalam batas karakter."
