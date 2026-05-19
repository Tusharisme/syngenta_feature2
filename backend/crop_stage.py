from datetime import date
from typing import Optional

STAGE_PRODUCTS: dict[tuple[str, str], list[str]] = {
    ("wheat",    "sowing"):      ["Cruiser 350 FS", "Vibrance Integral"],
    ("wheat",    "early_growth"):["Axial 50 EC"],
    ("wheat",    "tillering"):   ["Axial 50 EC", "Topik 15 WP", "Tilt 250 EC"],
    ("wheat",    "flowering"):   ["Tilt 250 EC", "Score 250 EC", "Amistar 250 SC"],
    ("wheat",    "harvest"):     [],
    ("chickpea", "sowing"):      ["Cruiser 350 FS"],
    ("chickpea", "vegetative"):  ["Kavach 75 WP"],
    ("chickpea", "flowering"):   ["Amistar 250 SC", "Tilt 250 EC"],
    ("mustard",  "sowing"):      ["Cruiser 350 FS"],
    ("mustard",  "vegetative"):  ["Actara 25 WG"],
    ("mustard",  "flowering"):   ["Score 250 EC", "Tilt 250 EC"],
    ("barley",   "sowing"):      ["Cruiser 350 FS"],
    ("barley",   "tillering"):   ["Axial 50 EC", "Tilt 250 EC"],
    ("barley",   "flowering"):   ["Tilt 250 EC"],
    ("potato",   "sowing"):      ["Actara 25 WG"],
    ("potato",   "vegetative"):  ["Kavach 75 WP", "Amistar 250 SC"],
    ("potato",   "flowering"):   ["Amistar 250 SC"],
    ("lentil",   "sowing"):      ["Cruiser 350 FS"],
    ("lentil",   "flowering"):   ["Tilt 250 EC", "Kavach 75 WP"],
}


def get_current_stage(calendar: dict, today: Optional[date] = None) -> str:
    if not calendar:
        return "unknown"
    if today is None:
        today = date.today()

    try:
        sowing_start  = date.fromisoformat(calendar["sowing"]["start"])
        sowing_end    = date.fromisoformat(calendar["sowing"]["end"])
        harvest_start = date.fromisoformat(calendar["harvest"]["start"])
        harvest_end   = date.fromisoformat(calendar["harvest"]["end"])
    except (KeyError, ValueError):
        return "unknown"

    if today < sowing_start:
        return "pre_sowing"
    if today > harvest_end:
        return "post_harvest"
    if harvest_start <= today <= harvest_end:
        return "harvest"
    if sowing_start <= today <= sowing_end:
        return "sowing"

    stages = sorted(
        calendar.get("stages", []),
        key=lambda s: date.fromisoformat(s["approx"]),
    )
    current = "early_growth"
    for s in stages:
        if today >= date.fromisoformat(s["approx"]):
            current = s["stage"]
        else:
            break
    return current


def recommended_products(crop: str, stage: str) -> list[str]:
    return STAGE_PRODUCTS.get((crop.lower(), stage.lower()), [])
