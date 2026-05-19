import pytest
import pandas as pd

TEHSIL = "Agra_T001"
RETAILER_ID = "RTL_00001"

@pytest.fixture
def mock_growers():
    return pd.DataFrame([
        {
            "grower_id": "GRW_00001",
            "state": "UP", "district": "Agra", "tehsil": TEHSIL,
            "grower_crop_calendar": {
                "season": "Rabi_2025-26", "crop": "wheat",
                "sowing": {"start": "2025-11-01", "end": "2025-11-25"},
                "harvest": {"start": "2026-03-20", "end": "2026-04-15"},
                "stages": [
                    {"stage": "tillering", "approx": "2026-01-15"},
                    {"stage": "flowering", "approx": "2026-02-20"},
                ],
            },
            "product_scan": 1,
            "product_name": "Tilt 250 EC",
            "product_scan_datetime": "2026-01-10",
        },
        {
            "grower_id": "GRW_00002",
            "state": "UP", "district": "Agra", "tehsil": TEHSIL,
            "grower_crop_calendar": {
                "season": "Rabi_2025-26", "crop": "wheat",
                "sowing": {"start": "2025-11-01", "end": "2025-11-25"},
                "harvest": {"start": "2026-03-20", "end": "2026-04-15"},
                "stages": [
                    {"stage": "tillering", "approx": "2026-01-15"},
                    {"stage": "flowering", "approx": "2026-02-20"},
                ],
            },
            "product_scan": 0,
            "product_name": None,
            "product_scan_datetime": None,
        },
    ])

@pytest.fixture
def mock_retailers():
    return pd.DataFrame([
        {"retailer_id": RETAILER_ID, "territory_id": "TER_0001",
         "state": "UP", "district": "Agra", "tehsil": TEHSIL},
    ])

@pytest.fixture
def mock_campaigns():
    return pd.DataFrame([
        {
            "id": "WAM_001", "campaign_product": "Tilt 250 EC",
            "campaign_crop": "wheat", "grower_id": "GRW_00001",
            "message_sent_date": pd.Timestamp("2026-01-10"),
            "delivered_status": 1, "opened_status": 1, "clicked_status": 1,
        },
        {
            "id": "WAM_002", "campaign_product": "Tilt 250 EC",
            "campaign_crop": "wheat", "grower_id": "GRW_00002",
            "message_sent_date": pd.Timestamp("2026-01-10"),
            "delivered_status": 1, "opened_status": 0, "clicked_status": 0,
        },
    ])

@pytest.fixture
def mock_inventory():
    return pd.DataFrame([
        {"retailer_id": RETAILER_ID, "sku_id": "SY_TILT_250EC",
         "sku_name": "Tilt 250 EC", "sku_qty": 94,
         "week_end_date": pd.Timestamp("2026-01-14")},
        {"retailer_id": RETAILER_ID, "sku_id": "SY_SCO_250EC",
         "sku_name": "Score 250 EC", "sku_qty": 30,
         "week_end_date": pd.Timestamp("2026-01-14")},
        {"retailer_id": RETAILER_ID, "sku_id": "SY_AXI_50EC",
         "sku_name": "Axial 50 EC", "sku_qty": 200,
         "week_end_date": pd.Timestamp("2026-01-14")},
    ])

@pytest.fixture
def mock_pos():
    return pd.DataFrame([
        {"retailer_id": RETAILER_ID, "transaction_id": "POS_001",
         "sku_id": "SY_TILT_250EC", "sku_name": "Tilt 250 EC",
         "sku_qty": 20, "sku_price": 500.0,
         "transaction_date": pd.Timestamp("2026-01-05")},
        {"retailer_id": RETAILER_ID, "transaction_id": "POS_002",
         "sku_id": "SY_SCO_250EC", "sku_name": "Score 250 EC",
         "sku_qty": 5, "sku_price": 600.0,
         "transaction_date": pd.Timestamp("2026-01-10")},
        # SY_AXI_50EC has no sales → zero_movement
    ])
