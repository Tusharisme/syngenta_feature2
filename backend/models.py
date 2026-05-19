from typing import Optional
from pydantic import BaseModel


class CheckInRequest(BaseModel):
    rep_id: str
    retailer_id: str
    visit_date: Optional[str] = None  # ISO date string; defaults to today if omitted


class InventoryItem(BaseModel):
    sku_id: str
    sku_name: str
    qty: int
    status: str  # "well_stocked" | "low_stock" | "zero_movement"


class DigitalSignals(BaseModel):
    campaign_product: str
    campaign_crop: str
    total_sent: int
    open_count: int
    open_rate: float   # 0.0 – 1.0
    click_count: int


class GrowerScanFlag(BaseModel):
    grower_id: str
    product_scanned: str
    scan_date: str


class SituationBrief(BaseModel):
    retailer_id: str
    tehsil: str
    dominant_crop: str
    current_stage: str
    recommended_products: list[str]
    digital_signals: Optional[DigitalSignals] = None
    inventory: list[InventoryItem]
    grower_scan_flags: list[GrowerScanFlag]
    conversation_opener: str
