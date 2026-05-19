from datetime import date
import pytest
from crop_stage import get_current_stage, recommended_products

WHEAT_CALENDAR = {
    "season": "Rabi_2025-26",
    "crop": "wheat",
    "sowing":  {"start": "2025-11-01", "end": "2025-11-25"},
    "harvest": {"start": "2026-03-20", "end": "2026-04-15"},
    "stages": [
        {"stage": "tillering", "approx": "2026-01-15"},
        {"stage": "flowering", "approx": "2026-02-20"},
    ],
}


def test_pre_sowing():
    assert get_current_stage(WHEAT_CALENDAR, date(2025, 10, 15)) == "pre_sowing"


def test_sowing_window():
    assert get_current_stage(WHEAT_CALENDAR, date(2025, 11, 10)) == "sowing"


def test_early_growth_between_sowing_and_first_stage():
    assert get_current_stage(WHEAT_CALENDAR, date(2025, 12, 10)) == "early_growth"


def test_tillering():
    assert get_current_stage(WHEAT_CALENDAR, date(2026, 1, 20)) == "tillering"


def test_flowering():
    assert get_current_stage(WHEAT_CALENDAR, date(2026, 2, 25)) == "flowering"


def test_harvest_window():
    assert get_current_stage(WHEAT_CALENDAR, date(2026, 3, 25)) == "harvest"


def test_post_harvest():
    assert get_current_stage(WHEAT_CALENDAR, date(2026, 5, 1)) == "post_harvest"


def test_empty_calendar_returns_unknown():
    assert get_current_stage({}, date(2026, 1, 20)) == "unknown"


def test_recommended_products_wheat_tillering():
    products = recommended_products("wheat", "tillering")
    assert "Axial 50 EC" in products


def test_recommended_products_wheat_flowering():
    products = recommended_products("wheat", "flowering")
    assert "Tilt 250 EC" in products


def test_recommended_products_unknown_combo_returns_empty():
    assert recommended_products("unknown_crop", "unknown_stage") == []
