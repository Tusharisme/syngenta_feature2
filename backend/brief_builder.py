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


def _digital_signals(
    tehsil_growers: pd.DataFrame,
    campaigns: pd.DataFrame,
    crop: str,
    rec_products: list[str],
) -> Optional[DigitalSignals]:
    if tehsil_growers.empty or not rec_products or campaigns.empty:
        return None

    grower_ids = set(tehsil_growers["grower_id"].tolist())
    tehsil_camps = campaigns[
        campaigns["grower_id"].isin(grower_ids)
        & (campaigns["campaign_crop"].str.lower() == crop.lower())
    ]
    if tehsil_camps.empty:
        return None

    best_product = rec_products[0]
    product_camps = tehsil_camps[
        tehsil_camps["campaign_product"].str.lower() == best_product.lower()
    ]
    if product_camps.empty:
        product_camps = tehsil_camps

    total  = len(product_camps)
    opens  = int(product_camps["opened_status"].sum())
    clicks = int(product_camps["clicked_status"].sum())

    return DigitalSignals(
        campaign_product=str(product_camps.iloc[0]["campaign_product"]),
        campaign_crop=crop,
        total_sent=total,
        open_count=opens,
        open_rate=round(opens / total, 3) if total > 0 else 0.0,
        click_count=clicks,
    )


def _inventory_status(
    retailer_id: str,
    inventory: pd.DataFrame,
    pos: pd.DataFrame,
    visit_date: date,
) -> list[InventoryItem]:
    ret_inv = inventory[inventory["retailer_id"] == retailer_id]
    if ret_inv.empty:
        return []

    latest_week = ret_inv["week_end_date"].max()
    current = ret_inv[ret_inv["week_end_date"] == latest_week][
        ["sku_id", "sku_name", "sku_qty"]
    ].copy()

    cutoff = pd.Timestamp(visit_date) - pd.Timedelta(days=28)
    recent_pos = pos[
        (pos["retailer_id"] == retailer_id) & (pos["transaction_date"] >= cutoff)
    ]
    sales = recent_pos.groupby("sku_id")["sku_qty"].sum().reset_index()
    sales.columns = ["sku_id", "units_sold_28d"]

    merged = current.merge(sales, on="sku_id", how="left")
    merged["units_sold_28d"] = merged["units_sold_28d"].fillna(0).astype(int)

    items: list[InventoryItem] = []
    for _, row in merged.iterrows():
        qty  = int(row["sku_qty"])
        sold = int(row["units_sold_28d"])
        if sold == 0:
            status = "zero_movement"
        elif qty < 50:
            status = "low_stock"
        else:
            status = "well_stocked"
        items.append(InventoryItem(
            sku_id=str(row["sku_id"]),
            sku_name=str(row["sku_name"]),
            qty=qty,
            status=status,
        ))

    order = {"low_stock": 0, "well_stocked": 1, "zero_movement": 2}
    return sorted(items, key=lambda i: order[i.status])
