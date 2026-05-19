from datetime import date
from typing import Optional
import pandas as pd

from crop_stage import get_current_stage, recommended_products
from models import SituationBrief, DigitalSignals, InventoryItem, GrowerScanFlag


def _dominant_crop(tehsil_growers: pd.DataFrame) -> str:
    if tehsil_growers.empty:
        return "unknown"
    crops = tehsil_growers["grower_crop_calendar"].apply(
        lambda c: c.get("crop", "unknown") if isinstance(c, dict) else "unknown"
    )
    return crops.value_counts().idxmax()


def _current_stage_for_crop(
    tehsil_growers: pd.DataFrame,
    crop: str,
    visit_date: date,
) -> str:
    crop_growers = tehsil_growers[
        tehsil_growers["grower_crop_calendar"].apply(
            lambda c: isinstance(c, dict) and c.get("crop", "") == crop
        )
    ]
    if crop_growers.empty:
        return "unknown"
    calendar = crop_growers.iloc[0]["grower_crop_calendar"]
    return get_current_stage(calendar, visit_date)
