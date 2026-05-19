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


from brief_builder import _digital_signals


def test_digital_signals_returns_correct_open_count(mock_growers, mock_campaigns):
    signals = _digital_signals(mock_growers, mock_campaigns, "wheat", ["Tilt 250 EC"])
    assert signals is not None
    assert signals.open_count == 1
    assert signals.total_sent == 2
    assert signals.campaign_product == "Tilt 250 EC"


def test_digital_signals_open_rate(mock_growers, mock_campaigns):
    signals = _digital_signals(mock_growers, mock_campaigns, "wheat", ["Tilt 250 EC"])
    assert signals.open_rate == 0.5


def test_digital_signals_returns_none_when_no_campaigns(mock_growers, mock_campaigns):
    signals = _digital_signals(mock_growers, mock_campaigns, "mango", ["Tilt 250 EC"])
    assert signals is None


def test_digital_signals_returns_none_when_no_products():
    import pandas as pd
    signals = _digital_signals(pd.DataFrame(), pd.DataFrame(), "wheat", [])
    assert signals is None
