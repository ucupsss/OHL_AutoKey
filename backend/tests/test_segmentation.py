from app.segmentation import segment_text


def test_segment_text_returns_result_dp_and_traceback():
    frequencies = {
        "program": 100,
        "dinamis": 50,
        "programdinamis": 1,
    }

    result = segment_text("programdinamis", frequencies, total_frequency=151)

    assert result.success is True
    assert result.segmented_text == "program dinamis"
    assert len(result.dp) == len("programdinamis") + 1
    assert [step.word for step in result.traceback] == ["dinamis", "program"]


def test_segment_text_reports_failure_when_no_valid_path():
    result = segment_text("zzzz", {"program": 1}, total_frequency=1)

    assert result.success is False
    assert result.segmented_text == ""
    assert len(result.dp) == 5
    assert result.traceback == []
