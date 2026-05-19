from datetime import date
from brief_builder import _dominant_crop, _current_stage_for_crop


def test_dominant_crop_returns_most_common(mock_growers):
    assert _dominant_crop(mock_growers) == "wheat"


def test_dominant_crop_empty_dataframe():
    import pandas as pd
    assert _dominant_crop(pd.DataFrame()) == "unknown"


def test_current_stage_for_crop_tillering(mock_growers):
    stage = _current_stage_for_crop(mock_growers, "wheat", date(2026, 1, 20))
    assert stage == "tillering"


def test_current_stage_for_crop_flowering(mock_growers):
    stage = _current_stage_for_crop(mock_growers, "wheat", date(2026, 2, 25))
    assert stage == "flowering"


def test_current_stage_for_unknown_crop(mock_growers):
    stage = _current_stage_for_crop(mock_growers, "mango", date(2026, 1, 20))
    assert stage == "unknown"
