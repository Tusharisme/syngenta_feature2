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


from brief_builder import _inventory_status
from tests.conftest import RETAILER_ID


def test_inventory_well_stocked(mock_inventory, mock_pos):
    items = _inventory_status(RETAILER_ID, mock_inventory, mock_pos, date(2026, 1, 20))
    tilt = next(i for i in items if i.sku_id == "SY_TILT_250EC")
    assert tilt.status == "well_stocked"
    assert tilt.qty == 94


def test_inventory_low_stock(mock_inventory, mock_pos):
    items = _inventory_status(RETAILER_ID, mock_inventory, mock_pos, date(2026, 1, 20))
    score = next(i for i in items if i.sku_id == "SY_SCO_250EC")
    assert score.status == "low_stock"


def test_inventory_zero_movement(mock_inventory, mock_pos):
    items = _inventory_status(RETAILER_ID, mock_inventory, mock_pos, date(2026, 1, 20))
    axial = next(i for i in items if i.sku_id == "SY_AXI_50EC")
    assert axial.status == "zero_movement"


def test_inventory_unknown_retailer_returns_empty(mock_inventory, mock_pos):
    items = _inventory_status("RTL_UNKNOWN", mock_inventory, mock_pos, date(2026, 1, 20))
    assert items == []
