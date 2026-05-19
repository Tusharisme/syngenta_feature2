
# Situation Brief Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a "Situation Brief Card" — when a sales rep checks into a retailer, synthesize grower crop data, WhatsApp campaign engagement, retailer inventory, and grower scan history into a 30-second actionable card with a scripted conversation opener.

**Architecture:** Python FastAPI backend reads `Syngenta.xlsx` at startup via pandas (no DB needed for demo), exposes `/api/situation-brief` POST endpoint and helper GET endpoints. React + Vite + Tailwind frontend renders the card with four sections. All data relationships handled via tehsil-based geographic joining.

**Tech Stack:** Python 3.11+, FastAPI 0.115, pandas 2.2, openpyxl 3.1, pytest 8.3, httpx; React 18, Vite 5, Tailwind CSS 3, axios

---

## Data Model (from Syngenta.xlsx — 9 sheets)

Key sheets and their role in this feature:

| Sheet | Role |
|-------|------|
| `GROWERS` | Crop calendar (JSON), product scan history, tehsil geography |
| `WHATSAPP_CAMPAIGN` | Campaign engagement per grower (opened/clicked) |
| `RETAILERS` | Retailer → tehsil mapping |
| `RETAILER_INVENTORY_WEEKLY` | Weekly stock snapshots per SKU |
| `RETAILER_POS` | Actual sales transactions (movement signal) |
| `REPS_TERRITORY` | Rep → territory → tehsil mapping |

Geographic join key: `tehsil` — links growers to retailers to campaigns.

---

## File Map

### Backend (`backend/`)
| File | Responsibility |
|------|----------------|
| `requirements.txt` | Python dependencies |
| `main.py` | FastAPI app, CORS, `/api/situation-brief`, `/api/retailers`, `/api/reps` |
| `data_loader.py` | Load all 7 Excel sheets into pandas DataFrames, warm cache at startup |
| `models.py` | Pydantic request/response types |
| `crop_stage.py` | Parse crop calendar JSON → current stage; crop×stage → product recommendations |
| `brief_builder.py` | Five private functions (field, digital, inventory, scan flags, opener) + `build_brief` orchestrator |
| `tests/__init__.py` | Empty |
| `tests/conftest.py` | Minimal mock DataFrames for all fixtures |
| `tests/test_crop_stage.py` | Unit tests for stage calculator and product map |
| `tests/test_brief_builder.py` | Unit tests for each section builder function |

### Frontend (`frontend/`)
| File | Responsibility |
|------|----------------|
| `package.json` | Node dependencies |
| `vite.config.js` | Vite dev server with `/api` proxy to `localhost:8000` |
| `tailwind.config.js` | Tailwind content paths |
| `index.html` | HTML entry point |
| `src/main.jsx` | React root mount |
| `src/App.jsx` | Single route: `/` → CheckIn page |
| `src/index.css` | Tailwind base imports |
| `src/api/situationBrief.js` | `fetchSituationBrief(repId, retailerId, visitDate?)` axios call |
| `src/pages/CheckIn.jsx` | Rep ID + Retailer ID inputs + check-in button + brief display |
| `src/components/SituationBriefCard.jsx` | Card container, arranges all sections |
| `src/components/FieldSituationSection.jsx` | Section 1: dominant crop, stage, recommended products |
| `src/components/DigitalSignalsSection.jsx` | Section 2: WhatsApp stats grid |
| `src/components/InventorySection.jsx` | Section 3: shelf status rows |
| `src/components/ConversationOpener.jsx` | Scripted opener callout |
| `src/components/GrowerScanFlags.jsx` | Loyal grower scan history flags |

---

## Task 1: Backend scaffold + data verification

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/verify_data.py` (one-off script, delete after)

- [ ] **Step 1: Create backend/requirements.txt**

```
fastapi==0.115.0
uvicorn[standard]==0.30.6
pandas==2.2.3
openpyxl==3.1.5
pytest==8.3.3
httpx==0.27.2
python-multipart==0.0.9
```

- [ ] **Step 2: Create virtualenv and install**

```bash
cd d:/Syngenta/backend
python -m venv .venv
.venv/Scripts/activate   # Windows
pip install -r requirements.txt
```

Expected: all packages install without error.

- [ ] **Step 3: Create verify_data.py to confirm sheet names and columns**

```python
# backend/verify_data.py  — run once, then delete
import pandas as pd
xl = pd.ExcelFile("../Syngenta.xlsx")
print("Sheets:", xl.sheet_names)
for sheet in xl.sheet_names:
    df = xl.parse(sheet, nrows=2)
    print(f"\n--- {sheet} ---")
    print(list(df.columns))
```

- [ ] **Step 4: Run verify_data.py and note exact sheet names**

```bash
cd d:/Syngenta/backend
python verify_data.py
```

> **IMPORTANT:** The exact sheet names returned here are what you use in `data_loader.py`.
> Common variations: `"GROWERS"` vs `"Growers"`, `"WHATSAPP_CAMPAIGN"` vs `"WhatsApp_Campaign"`.
> Update the sheet name constants in Task 2 to match the printed output.

- [ ] **Step 5: Delete verify_data.py**

```bash
rm backend/verify_data.py
```

- [ ] **Step 6: Commit**

```bash
git init d:/Syngenta
cd d:/Syngenta
git add backend/requirements.txt
git commit -m "feat: add backend requirements for situation brief card"
```

---

## Task 2: Data loader

**Files:**
- Create: `backend/data_loader.py`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`

- [ ] **Step 1: Write conftest.py with minimal mock DataFrames**

```python
# backend/tests/conftest.py
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
```

- [ ] **Step 2: Create backend/tests/__init__.py (empty)**

```bash
touch backend/tests/__init__.py
```

- [ ] **Step 3: Write data_loader.py**

```python
# backend/data_loader.py
import json
from pathlib import Path
from typing import Optional
import pandas as pd

# Update these names if verify_data.py printed different casing
SHEET_NAMES = {
    "growers":    "GROWERS",
    "campaigns":  "WHATSAPP_CAMPAIGN",
    "retailers":  "RETAILERS",
    "inventory":  "RETAILER_INVENTORY_WEEKLY",
    "pos":        "RETAILER_POS",
    "visits":     "RETAILER_VISIT_LOG",
    "reps":       "REPS_TERRITORY",
}

EXCEL_PATH = Path(__file__).parent.parent / "Syngenta.xlsx"


class DataStore:
    growers: pd.DataFrame
    campaigns: pd.DataFrame
    retailers: pd.DataFrame
    inventory: pd.DataFrame
    pos: pd.DataFrame
    visits: pd.DataFrame
    reps: pd.DataFrame

    def load(self, excel_path: Path = EXCEL_PATH) -> "DataStore":
        xl = pd.ExcelFile(excel_path)
        self.growers   = xl.parse(SHEET_NAMES["growers"])
        self.campaigns = xl.parse(SHEET_NAMES["campaigns"])
        self.retailers = xl.parse(SHEET_NAMES["retailers"])
        self.inventory = xl.parse(SHEET_NAMES["inventory"])
        self.pos       = xl.parse(SHEET_NAMES["pos"])
        self.visits    = xl.parse(SHEET_NAMES["visits"])
        self.reps      = xl.parse(SHEET_NAMES["reps"])

        self.growers["grower_crop_calendar"] = self.growers["grower_crop_calendar"].apply(
            lambda x: json.loads(x) if isinstance(x, str) else (x if isinstance(x, dict) else {})
        )

        self.campaigns["message_sent_date"] = pd.to_datetime(self.campaigns["message_sent_date"])
        self.inventory["week_end_date"]     = pd.to_datetime(self.inventory["week_end_date"])
        self.pos["transaction_date"]        = pd.to_datetime(self.pos["transaction_date"])
        self.visits["visit_date"]           = pd.to_datetime(self.visits["visit_date"])
        return self


_store: Optional[DataStore] = None


def get_store() -> DataStore:
    global _store
    if _store is None:
        _store = DataStore().load()
    return _store
```

- [ ] **Step 4: Smoke-test data loader manually**

```bash
cd d:/Syngenta/backend
python -c "from data_loader import get_store; s = get_store(); print(len(s.growers), 'growers loaded')"
```

Expected: `6000 growers loaded` (adjust if count differs).

- [ ] **Step 5: Commit**

```bash
git add backend/data_loader.py backend/tests/__init__.py backend/tests/conftest.py
git commit -m "feat: data loader reads Syngenta.xlsx into pandas DataFrames"
```

---

## Task 3: Pydantic models

**Files:**
- Create: `backend/models.py`

- [ ] **Step 1: Write models.py**

```python
# backend/models.py
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
```

- [ ] **Step 2: Verify models import cleanly**

```bash
cd d:/Syngenta/backend
python -c "from models import SituationBrief; print('models OK')"
```

Expected: `models OK`

- [ ] **Step 3: Commit**

```bash
git add backend/models.py
git commit -m "feat: add Pydantic models for situation brief card API"
```

---

## Task 4: Crop stage calculator (TDD)

**Files:**
- Create: `backend/tests/test_crop_stage.py`
- Create: `backend/crop_stage.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_crop_stage.py
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
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd d:/Syngenta/backend
pytest tests/test_crop_stage.py -v
```

Expected: `ModuleNotFoundError: No module named 'crop_stage'` or similar — confirms tests are driving implementation.

- [ ] **Step 3: Write crop_stage.py**

```python
# backend/crop_stage.py
from datetime import date
from typing import Optional

STAGE_PRODUCTS: dict[tuple[str, str], list[str]] = {
    ("wheat",    "sowing"):     ["Cruiser 350 FS", "Vibrance Integral"],
    ("wheat",    "early_growth"):["Axial 50 EC"],
    ("wheat",    "tillering"):  ["Axial 50 EC", "Topik 15 WP", "Tilt 250 EC"],
    ("wheat",    "flowering"):  ["Tilt 250 EC", "Score 250 EC", "Amistar 250 SC"],
    ("wheat",    "harvest"):    [],
    ("chickpea", "sowing"):     ["Cruiser 350 FS"],
    ("chickpea", "vegetative"): ["Kavach 75 WP"],
    ("chickpea", "flowering"):  ["Amistar 250 SC", "Tilt 250 EC"],
    ("mustard",  "sowing"):     ["Cruiser 350 FS"],
    ("mustard",  "vegetative"): ["Actara 25 WG"],
    ("mustard",  "flowering"):  ["Score 250 EC", "Tilt 250 EC"],
    ("barley",   "sowing"):     ["Cruiser 350 FS"],
    ("barley",   "tillering"):  ["Axial 50 EC", "Tilt 250 EC"],
    ("barley",   "flowering"):  ["Tilt 250 EC"],
    ("potato",   "sowing"):     ["Actara 25 WG"],
    ("potato",   "vegetative"): ["Kavach 75 WP", "Amistar 250 SC"],
    ("potato",   "flowering"):  ["Amistar 250 SC"],
    ("lentil",   "sowing"):     ["Cruiser 350 FS"],
    ("lentil",   "flowering"):  ["Tilt 250 EC", "Kavach 75 WP"],
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
```

- [ ] **Step 4: Run tests — verify they all pass**

```bash
cd d:/Syngenta/backend
pytest tests/test_crop_stage.py -v
```

Expected: `11 passed`

- [ ] **Step 5: Commit**

```bash
git add backend/crop_stage.py backend/tests/test_crop_stage.py
git commit -m "feat: crop stage calculator with product recommendations (TDD)"
```

---

## Task 5: Brief builder — field situation section (TDD)

**Files:**
- Create: `backend/tests/test_brief_builder.py` (first batch of tests)
- Create: `backend/brief_builder.py` (field situation functions only)

- [ ] **Step 1: Write failing tests for field situation**

```python
# backend/tests/test_brief_builder.py
from datetime import date
from brief_builder import _dominant_crop, _current_stage_for_crop


def test_dominant_crop_returns_most_common(mock_growers):
    # Both growers grow wheat
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
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd d:/Syngenta/backend
pytest tests/test_brief_builder.py -v
```

Expected: `ModuleNotFoundError: No module named 'brief_builder'`

- [ ] **Step 3: Write field situation functions in brief_builder.py**

```python
# backend/brief_builder.py
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
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd d:/Syngenta/backend
pytest tests/test_brief_builder.py -v
```

Expected: `5 passed`

- [ ] **Step 5: Commit**

```bash
git add backend/brief_builder.py backend/tests/test_brief_builder.py
git commit -m "feat: field situation section — dominant crop and stage detection"
```

---

## Task 6: Brief builder — digital signals section (TDD)

**Files:**
- Modify: `backend/tests/test_brief_builder.py` (append tests)
- Modify: `backend/brief_builder.py` (append function)

- [ ] **Step 1: Append failing tests to test_brief_builder.py**

```python
# Append to backend/tests/test_brief_builder.py
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
    # Wrong crop → no matching campaigns
    signals = _digital_signals(mock_growers, mock_campaigns, "mango", ["Tilt 250 EC"])
    assert signals is None


def test_digital_signals_returns_none_when_no_products():
    import pandas as pd
    signals = _digital_signals(pd.DataFrame(), pd.DataFrame(), "wheat", [])
    assert signals is None
```

- [ ] **Step 2: Run new tests — confirm they fail**

```bash
cd d:/Syngenta/backend
pytest tests/test_brief_builder.py::test_digital_signals_returns_correct_open_count -v
```

Expected: `ImportError` or `AttributeError` — `_digital_signals` not yet defined.

- [ ] **Step 3: Append _digital_signals to brief_builder.py**

```python
# Append to backend/brief_builder.py

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

    # Prefer first recommended product; fall back to any matching crop campaign
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
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
cd d:/Syngenta/backend
pytest tests/test_brief_builder.py -v
```

Expected: `9 passed`

- [ ] **Step 5: Commit**

```bash
git add backend/brief_builder.py backend/tests/test_brief_builder.py
git commit -m "feat: digital signals section — WhatsApp campaign aggregation by tehsil"
```

---

## Task 7: Brief builder — inventory section (TDD)

**Files:**
- Modify: `backend/tests/test_brief_builder.py`
- Modify: `backend/brief_builder.py`

- [ ] **Step 1: Append failing tests**

```python
# Append to backend/tests/test_brief_builder.py
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
    assert score.status == "low_stock"  # qty=30 < 50 and has sales


def test_inventory_zero_movement(mock_inventory, mock_pos):
    items = _inventory_status(RETAILER_ID, mock_inventory, mock_pos, date(2026, 1, 20))
    axial = next(i for i in items if i.sku_id == "SY_AXI_50EC")
    assert axial.status == "zero_movement"  # no POS records


def test_inventory_unknown_retailer_returns_empty(mock_inventory, mock_pos):
    items = _inventory_status("RTL_UNKNOWN", mock_inventory, mock_pos, date(2026, 1, 20))
    assert items == []
```

- [ ] **Step 2: Run new tests — confirm they fail**

```bash
cd d:/Syngenta/backend
pytest tests/test_brief_builder.py::test_inventory_well_stocked -v
```

- [ ] **Step 3: Append _inventory_status to brief_builder.py**

```python
# Append to backend/brief_builder.py

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

    # Order: low_stock first (urgent), well_stocked next, zero_movement last
    order = {"low_stock": 0, "well_stocked": 1, "zero_movement": 2}
    return sorted(items, key=lambda i: order[i.status])
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
cd d:/Syngenta/backend
pytest tests/test_brief_builder.py -v
```

Expected: `13 passed`

- [ ] **Step 5: Commit**

```bash
git add backend/brief_builder.py backend/tests/test_brief_builder.py
git commit -m "feat: inventory section — shelf status bucketing (well_stocked/low_stock/zero_movement)"
```

---

## Task 8: Brief builder — grower scan flags + conversation opener (TDD)

**Files:**
- Modify: `backend/tests/test_brief_builder.py`
- Modify: `backend/brief_builder.py`

- [ ] **Step 1: Append failing tests**

```python
# Append to backend/tests/test_brief_builder.py
from brief_builder import _grower_scan_flags, _conversation_opener
from models import DigitalSignals, InventoryItem


def test_grower_scan_flags_returns_only_scanners(mock_growers):
    flags = _grower_scan_flags(mock_growers)
    assert len(flags) == 1
    assert flags[0].grower_id == "GRW_00001"
    assert flags[0].product_scanned == "Tilt 250 EC"


def test_grower_scan_flags_empty_when_none_scanned():
    import pandas as pd
    no_scans = pd.DataFrame([
        {"grower_id": "GRW_X", "product_scan": 0, "product_name": None, "product_scan_datetime": None}
    ])
    assert _grower_scan_flags(no_scans) == []


def test_conversation_opener_with_digital_and_inventory():
    digital = DigitalSignals(
        campaign_product="Tilt 250 EC", campaign_crop="wheat",
        total_sent=10, open_count=3, open_rate=0.3, click_count=1,
    )
    inventory = [
        InventoryItem(sku_id="SY_TILT_250EC", sku_name="Tilt 250 EC", qty=94, status="well_stocked"),
    ]
    opener = _conversation_opener("wheat", "flowering", digital, inventory, "Agra_T001")
    assert "wheat" in opener.lower()
    assert "Tilt 250 EC" in opener
    assert "3" in opener  # open count


def test_conversation_opener_fallback_no_digital():
    inventory = [
        InventoryItem(sku_id="SY_TILT_250EC", sku_name="Tilt 250 EC", qty=94, status="well_stocked"),
    ]
    opener = _conversation_opener("wheat", "tillering", None, inventory, "Agra_T001")
    assert "wheat" in opener.lower()
    assert len(opener) > 20
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd d:/Syngenta/backend
pytest tests/test_brief_builder.py::test_grower_scan_flags_returns_only_scanners -v
```

- [ ] **Step 3: Append scan flags and opener to brief_builder.py**

```python
# Append to backend/brief_builder.py

def _grower_scan_flags(tehsil_growers: pd.DataFrame) -> list[GrowerScanFlag]:
    flags: list[GrowerScanFlag] = []
    for _, row in tehsil_growers.iterrows():
        scan_val = row.get("product_scan", 0)
        product  = row.get("product_name")
        scan_dt  = row.get("product_scan_datetime")
        if scan_val and product and not pd.isna(product):
            scan_date = str(scan_dt)[:10] if scan_dt and not pd.isna(scan_dt) else "unknown"
            flags.append(GrowerScanFlag(
                grower_id=str(row["grower_id"]),
                product_scanned=str(product),
                scan_date=scan_date,
            ))
    return flags


_DISEASE_HINTS: dict[tuple[str, str], str] = {
    ("wheat",    "early_growth"): "weed pressure",
    ("wheat",    "tillering"):    "weed pressure",
    ("wheat",    "flowering"):    "leaf blight",
    ("wheat",    "harvest"):      "grain quality",
    ("chickpea", "flowering"):    "botrytis blight",
    ("mustard",  "flowering"):    "white rust",
    ("mustard",  "vegetative"):   "aphid pressure",
    ("barley",   "tillering"):    "net blotch",
    ("potato",   "vegetative"):   "early blight",
    ("lentil",   "flowering"):    "powdery mildew",
}


def _conversation_opener(
    crop: str,
    stage: str,
    digital: Optional[DigitalSignals],
    inventory: list[InventoryItem],
    tehsil: str,
) -> str:
    push_item = next(
        (i for i in inventory if i.status == "low_stock"), None
    ) or next(
        (i for i in inventory if i.status == "well_stocked"), None
    )

    disease_hint = _DISEASE_HINTS.get((crop.lower(), stage.lower()), f"{stage} protection")

    if digital and push_item:
        qty_note = "good position" if push_item.status == "well_stocked" else "running low — close today"
        return (
            f"Are your {crop} farmers asking about {disease_hint} yet? "
            f"We've been running awareness on {digital.campaign_product} — "
            f"{digital.open_count} farmers in your tehsil opened the message. "
            f"You have {push_item.qty} units, {qty_note}. Worth pushing this week."
        )
    elif push_item:
        return (
            f"Your {crop} farmers are in the {stage.replace('_', ' ')} stage right now. "
            f"{push_item.sku_name} is {'well stocked' if push_item.status == 'well_stocked' else 'running low'} "
            f"at {push_item.qty} units — good time to move it."
        )
    else:
        return (
            f"Let's talk about your {crop} inventory for the "
            f"{stage.replace('_', ' ')} season. Some products need attention."
        )
```

- [ ] **Step 4: Run all tests**

```bash
cd d:/Syngenta/backend
pytest tests/ -v
```

Expected: `21 passed`

- [ ] **Step 5: Commit**

```bash
git add backend/brief_builder.py backend/tests/test_brief_builder.py
git commit -m "feat: grower scan flags and conversation opener generator"
```

---

## Task 9: Brief builder orchestrator + FastAPI endpoint

**Files:**
- Modify: `backend/brief_builder.py` (add `build_brief`)
- Create: `backend/main.py`

- [ ] **Step 1: Append build_brief orchestrator to brief_builder.py**

```python
# Append to backend/brief_builder.py

def build_brief(
    retailer_id: str,
    growers: pd.DataFrame,
    campaigns: pd.DataFrame,
    retailers: pd.DataFrame,
    inventory: pd.DataFrame,
    pos: pd.DataFrame,
    visit_date: Optional[date] = None,
) -> SituationBrief:
    if visit_date is None:
        visit_date = date.today()

    retailer_row = retailers[retailers["retailer_id"] == retailer_id]
    if retailer_row.empty:
        raise ValueError(f"Retailer '{retailer_id}' not found")

    tehsil = str(retailer_row.iloc[0]["tehsil"])
    tehsil_growers = growers[growers["tehsil"] == tehsil]

    dominant_crop = _dominant_crop(tehsil_growers)
    current_stage = _current_stage_for_crop(tehsil_growers, dominant_crop, visit_date)
    rec_products  = recommended_products(dominant_crop, current_stage)
    digital       = _digital_signals(tehsil_growers, campaigns, dominant_crop, rec_products)
    inv_items     = _inventory_status(retailer_id, inventory, pos, visit_date)
    scan_flags    = _grower_scan_flags(tehsil_growers)
    opener        = _conversation_opener(dominant_crop, current_stage, digital, inv_items, tehsil)

    return SituationBrief(
        retailer_id=retailer_id,
        tehsil=tehsil,
        dominant_crop=dominant_crop,
        current_stage=current_stage,
        recommended_products=rec_products,
        digital_signals=digital,
        inventory=inv_items,
        grower_scan_flags=scan_flags,
        conversation_opener=opener,
    )
```

- [ ] **Step 2: Create main.py**

```python
# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import date

from models import CheckInRequest, SituationBrief
from data_loader import get_store
from brief_builder import build_brief

app = FastAPI(title="Syngenta Situation Brief API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    get_store()  # warm cache on first request


@app.post("/api/situation-brief", response_model=SituationBrief)
def situation_brief(req: CheckInRequest):
    store = get_store()
    visit_date = date.fromisoformat(req.visit_date) if req.visit_date else date.today()
    try:
        return build_brief(
            retailer_id=req.retailer_id,
            growers=store.growers,
            campaigns=store.campaigns,
            retailers=store.retailers,
            inventory=store.inventory,
            pos=store.pos,
            visit_date=visit_date,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@app.get("/api/retailers")
def list_retailers():
    store = get_store()
    cols = ["retailer_id", "territory_id", "state", "district", "tehsil"]
    return store.retailers[cols].head(200).to_dict(orient="records")


@app.get("/api/reps")
def list_reps():
    store = get_store()
    return store.reps[["rep_id", "territory_id"]].to_dict(orient="records")


@app.get("/api/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 3: Start the backend and confirm it starts**

```bash
cd d:/Syngenta/backend
uvicorn main:app --reload --port 8000
```

Expected output contains: `Application startup complete.`
Excel load takes ~5-10 seconds on first run.

- [ ] **Step 4: Test the endpoint manually**

```bash
curl -X POST http://localhost:8000/api/situation-brief \
  -H "Content-Type: application/json" \
  -d '{"rep_id": "REP_0001", "retailer_id": "RTL_00001", "visit_date": "2026-01-20"}'
```

Expected: JSON response with all five fields populated.

- [ ] **Step 5: Write integration test**

```python
# Append to backend/tests/test_brief_builder.py
from datetime import date
from brief_builder import build_brief


def test_build_brief_end_to_end(mock_growers, mock_retailers, mock_campaigns, mock_inventory, mock_pos):
    brief = build_brief(
        retailer_id="RTL_00001",
        growers=mock_growers,
        campaigns=mock_campaigns,
        retailers=mock_retailers,
        inventory=mock_inventory,
        pos=mock_pos,
        visit_date=date(2026, 1, 20),
    )
    assert brief.retailer_id == "RTL_00001"
    assert brief.dominant_crop == "wheat"
    assert brief.current_stage == "tillering"
    assert len(brief.inventory) == 3
    assert brief.digital_signals is not None
    assert len(brief.grower_scan_flags) == 1
    assert len(brief.conversation_opener) > 30


def test_build_brief_raises_for_unknown_retailer(mock_growers, mock_retailers, mock_campaigns, mock_inventory, mock_pos):
    import pytest
    with pytest.raises(ValueError, match="not found"):
        build_brief(
            retailer_id="RTL_UNKNOWN",
            growers=mock_growers,
            campaigns=mock_campaigns,
            retailers=mock_retailers,
            inventory=mock_inventory,
            pos=mock_pos,
            visit_date=date(2026, 1, 20),
        )
```

- [ ] **Step 6: Run all tests**

```bash
cd d:/Syngenta/backend
pytest tests/ -v
```

Expected: `23 passed`

- [ ] **Step 7: Commit**

```bash
git add backend/main.py backend/brief_builder.py backend/tests/test_brief_builder.py
git commit -m "feat: FastAPI endpoint POST /api/situation-brief with full orchestration"
```

---

## Task 10: Frontend scaffolding

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.jsx`
- Create: `frontend/src/App.jsx`
- Create: `frontend/src/index.css`

- [ ] **Step 1: Create frontend/package.json**

```json
{
  "name": "syngenta-situation-brief",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.7.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.40",
    "tailwindcss": "^3.4.9",
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create frontend/vite.config.js**

```js
// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
```

- [ ] **Step 3: Create frontend/tailwind.config.js**

```js
// frontend/tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 4: Create frontend/postcss.config.js**

```js
// frontend/postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 5: Create frontend/index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Syngenta — Point of Visit</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create frontend/src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 7: Create frontend/src/main.jsx**

```jsx
// frontend/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 8: Create frontend/src/App.jsx**

```jsx
// frontend/src/App.jsx
import CheckIn from './pages/CheckIn'

export default function App() {
  return <CheckIn />
}
```

- [ ] **Step 9: Install dependencies and verify dev server starts**

```bash
cd d:/Syngenta/frontend
npm install
npm run dev
```

Expected: `Local: http://localhost:5173/` — blank white page is fine at this stage.

- [ ] **Step 10: Commit**

```bash
git add frontend/
git commit -m "feat: React + Vite + Tailwind frontend scaffold"
```

---

## Task 11: API client + CheckIn page

**Files:**
- Create: `frontend/src/api/situationBrief.js`
- Create: `frontend/src/pages/CheckIn.jsx`

- [ ] **Step 1: Create src/api/situationBrief.js**

```js
// frontend/src/api/situationBrief.js
import axios from 'axios'

export async function fetchSituationBrief(repId, retailerId, visitDate) {
  const payload = { rep_id: repId, retailer_id: retailerId }
  if (visitDate) payload.visit_date = visitDate

  const { data } = await axios.post('/api/situation-brief', payload)
  return data
}
```

- [ ] **Step 2: Create src/pages/CheckIn.jsx**

```jsx
// frontend/src/pages/CheckIn.jsx
import { useState } from 'react'
import { fetchSituationBrief } from '../api/situationBrief'
import SituationBriefCard from '../components/SituationBriefCard'

export default function CheckIn() {
  const [repId, setRepId] = useState('')
  const [retailerId, setRetailerId] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [brief, setBrief] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleCheckIn() {
    setLoading(true)
    setError(null)
    setBrief(null)
    try {
      const data = await fetchSituationBrief(repId, retailerId, visitDate || undefined)
      setBrief(data)
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-green-400">Point of Visit</h1>
          <p className="text-gray-500 text-sm mt-1">
            Enter rep and retailer to generate a 30-second situation brief.
          </p>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 mb-6 space-y-4 border border-gray-800">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Rep ID
            </label>
            <input
              className="w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-green-600"
              placeholder="e.g. REP_0001"
              value={repId}
              onChange={e => setRepId(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Retailer ID
            </label>
            <input
              className="w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-green-600"
              placeholder="e.g. RTL_00001"
              value={retailerId}
              onChange={e => setRetailerId(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Visit Date{' '}
              <span className="text-gray-600 font-normal normal-case">(optional — leave blank for today)</span>
            </label>
            <input
              type="date"
              className="w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-600"
              value={visitDate}
              onChange={e => setVisitDate(e.target.value)}
            />
          </div>
          <button
            onClick={handleCheckIn}
            disabled={!repId || !retailerId || loading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-800 disabled:text-gray-600 rounded-lg py-3 font-semibold transition-colors mt-2"
          >
            {loading ? 'Generating Brief…' : 'Check In & Generate Brief'}
          </button>
          {error && (
            <p className="text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg p-3">
              {error}
            </p>
          )}
        </div>

        {brief && <SituationBriefCard brief={brief} />}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create a stub SituationBriefCard so the page renders (full version in Task 12)**

```jsx
// frontend/src/components/SituationBriefCard.jsx  — temporary stub
export default function SituationBriefCard({ brief }) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <pre className="text-xs text-gray-400 overflow-auto">
        {JSON.stringify(brief, null, 2)}
      </pre>
    </div>
  )
}
```

- [ ] **Step 4: Verify end-to-end with backend running**

With `uvicorn main:app --reload` running in backend dir and `npm run dev` in frontend dir:
- Open `http://localhost:5173`
- Enter `REP_0001`, `RTL_00001`, date `2026-01-20`
- Click Check In
- Verify raw JSON appears in the stub card

- [ ] **Step 5: Commit**

```bash
git add frontend/src/api/ frontend/src/pages/ frontend/src/components/SituationBriefCard.jsx
git commit -m "feat: check-in page with API client and stub brief card"
```

---

## Task 12: Situation Brief Card — all UI components

**Files:**
- Modify: `frontend/src/components/SituationBriefCard.jsx` (replace stub)
- Create: `frontend/src/components/FieldSituationSection.jsx`
- Create: `frontend/src/components/DigitalSignalsSection.jsx`
- Create: `frontend/src/components/InventorySection.jsx`
- Create: `frontend/src/components/ConversationOpener.jsx`
- Create: `frontend/src/components/GrowerScanFlags.jsx`

- [ ] **Step 1: Create FieldSituationSection.jsx**

```jsx
// frontend/src/components/FieldSituationSection.jsx
export default function FieldSituationSection({ crop, stage, products }) {
  const stageLabel = stage.replace(/_/g, ' ')
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-green-400 mb-3">
        What's Happening Here Right Now
      </h2>
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="bg-green-900/60 text-green-300 px-3 py-1 rounded-full text-sm font-medium capitalize">
          {crop}
        </span>
        <span className="bg-blue-900/60 text-blue-300 px-3 py-1 rounded-full text-sm font-medium capitalize">
          {stageLabel} stage
        </span>
      </div>
      {products.length > 0 ? (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
            Recommended this stage
          </p>
          <div className="flex flex-wrap gap-2">
            {products.map(p => (
              <span
                key={p}
                className="bg-gray-800 border border-gray-700 text-white px-3 py-1 rounded-lg text-sm"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-600 italic">No active product recommendations for this stage.</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create DigitalSignalsSection.jsx**

```jsx
// frontend/src/components/DigitalSignalsSection.jsx
export default function DigitalSignalsSection({ signals }) {
  const openPct = Math.round(signals.open_rate * 100)
  const clickPct = signals.total_sent > 0
    ? Math.round((signals.click_count / signals.total_sent) * 100)
    : 0

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">
        What Syngenta Already Started Digitally
      </h2>
      <p className="text-sm text-gray-400 mb-4">
        WhatsApp campaign:{' '}
        <span className="text-white font-medium">{signals.campaign_product}</span>
        {' '}for{' '}
        <span className="text-white font-medium capitalize">{signals.campaign_crop}</span>
      </p>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">{signals.total_sent}</div>
          <div className="text-xs text-gray-500 mt-1">Sent</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{signals.open_count}</div>
          <div className="text-xs text-gray-500 mt-1">Opened ({openPct}%)</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">{signals.click_count}</div>
          <div className="text-xs text-gray-500 mt-1">Clicked ({clickPct}%)</div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create InventorySection.jsx**

```jsx
// frontend/src/components/InventorySection.jsx
const STATUS = {
  well_stocked:  { label: 'Well Stocked',           dot: 'bg-green-400',  text: 'text-green-400',  bg: 'bg-green-900/20' },
  low_stock:     { label: 'Low Stock — Close Today', dot: 'bg-yellow-400', text: 'text-yellow-400', bg: 'bg-yellow-900/20' },
  zero_movement: { label: 'Zero Movement',           dot: 'bg-red-400',    text: 'text-red-400',    bg: 'bg-red-900/20' },
}

export default function InventorySection({ items }) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-yellow-400 mb-3">
        What the Shelf Looks Like
      </h2>
      <div className="space-y-2">
        {items.map(item => {
          const cfg = STATUS[item.status] ?? STATUS.well_stocked
          return (
            <div
              key={item.sku_id}
              className={`flex items-center justify-between rounded-lg px-3 py-2 ${cfg.bg}`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                <span className="text-sm text-white">{item.sku_name}</span>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className="text-sm font-bold text-white tabular-nums">
                  {item.qty} units
                </span>
                <span className={`text-xs ${cfg.text} hidden sm:block`}>{cfg.label}</span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex gap-4 mt-4">
        {Object.entries(STATUS).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <span className="text-xs text-gray-500">{cfg.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create ConversationOpener.jsx**

```jsx
// frontend/src/components/ConversationOpener.jsx
export default function ConversationOpener({ text }) {
  return (
    <div className="bg-gradient-to-br from-green-950/80 to-gray-900 rounded-xl p-5 border border-green-800/60">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-xs font-semibold uppercase tracking-widest text-green-400">
          Suggested Conversation Opener
        </span>
      </div>
      <blockquote className="text-white text-sm leading-relaxed border-l-2 border-green-500 pl-4 italic">
        "{text}"
      </blockquote>
    </div>
  )
}
```

- [ ] **Step 5: Create GrowerScanFlags.jsx**

```jsx
// frontend/src/components/GrowerScanFlags.jsx
export default function GrowerScanFlags({ flags }) {
  if (!flags.length) return null
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-3">
        Loyal Growers — Scan History
      </h2>
      <div className="space-y-2">
        {flags.map(flag => (
          <div
            key={flag.grower_id}
            className="flex items-start gap-3 bg-gray-800 rounded-lg px-3 py-3"
          >
            <div className="w-8 h-8 bg-purple-900/60 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <span className="text-sm font-medium text-white">{flag.grower_id}</span>
              <p className="text-xs text-gray-400 mt-0.5">
                Authenticated{' '}
                <span className="text-purple-300">{flag.product_scanned}</span>
                {' '}on {flag.scan_date}
              </p>
              <span className="text-xs text-green-400">
                High trust — good upsell candidate
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Replace stub SituationBriefCard.jsx with full version**

```jsx
// frontend/src/components/SituationBriefCard.jsx
import ConversationOpener from './ConversationOpener'
import DigitalSignalsSection from './DigitalSignalsSection'
import FieldSituationSection from './FieldSituationSection'
import GrowerScanFlags from './GrowerScanFlags'
import InventorySection from './InventorySection'

export default function SituationBriefCard({ brief }) {
  return (
    <div className="space-y-4">
      <div className="text-xs text-gray-600 uppercase tracking-widest">
        30-Second Situation Brief — {brief.tehsil}
      </div>

      <ConversationOpener text={brief.conversation_opener} />

      <FieldSituationSection
        crop={brief.dominant_crop}
        stage={brief.current_stage}
        products={brief.recommended_products}
      />

      {brief.digital_signals && (
        <DigitalSignalsSection signals={brief.digital_signals} />
      )}

      <InventorySection items={brief.inventory} />

      <GrowerScanFlags flags={brief.grower_scan_flags} />
    </div>
  )
}
```

- [ ] **Step 7: Verify full UI in browser**

With both backend and frontend running:
1. Open `http://localhost:5173`
2. Enter `REP_0001`, `RTL_00001`, date `2026-01-20`
3. Click Check In
4. Verify all four sections render: field situation, digital signals, inventory shelf, conversation opener
5. Try a retailer in a different state (e.g. `RTL_00500`) with a different date — verify results change

- [ ] **Step 8: Commit**

```bash
git add frontend/src/components/
git commit -m "feat: Situation Brief Card UI — all four sections + conversation opener"
```

---

## Task 13: Smoke test + final wiring check

- [ ] **Step 1: Run full backend test suite**

```bash
cd d:/Syngenta/backend
pytest tests/ -v --tb=short
```

Expected: all 23 tests pass, 0 failures.

- [ ] **Step 2: Test edge cases via curl**

```bash
# Unknown retailer → 404
curl -X POST http://localhost:8000/api/situation-brief \
  -H "Content-Type: application/json" \
  -d '{"rep_id": "REP_0001", "retailer_id": "RTL_INVALID"}'

# Post-harvest date (May 2026) — should return post_harvest stage
curl -X POST http://localhost:8000/api/situation-brief \
  -H "Content-Type: application/json" \
  -d '{"rep_id": "REP_0001", "retailer_id": "RTL_00001", "visit_date": "2026-05-20"}'
```

Expected: first returns `{"detail": "Retailer 'RTL_INVALID' not found"}`, second returns valid brief with `current_stage: "post_harvest"`.

- [ ] **Step 3: Test a retailer with zero inventory movement**

Pick any retailer ID from `GET /api/retailers`. Check that zero-movement SKUs show red in the UI.

- [ ] **Step 4: Verify conversation opener changes by date**

Use the same retailer with:
- `2025-12-01` → sowing stage opener
- `2026-01-20` → tillering opener
- `2026-02-25` → flowering opener

Each should produce a different opener text.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: Situation Brief Card feature complete — all tests pass"
```

---

## Spec Coverage Check

| Spec Requirement | Covered By |
|------------------|------------|
| Dominant crop in tehsil from grower profiles | Task 5 `_dominant_crop` |
| Current crop stage from calendar | Task 4 `get_current_stage` |
| Product relevant at this stage | Task 4 `recommended_products` + Task 5 `_current_stage_for_crop` |
| WhatsApp campaign for crop/product in tehsil | Task 6 `_digital_signals` |
| Who opened it, response rate | Task 6 `DigitalSignals.open_count`, `open_rate` |
| Shelf: well-stocked, low stock, zero movement | Task 7 `_inventory_status` status bucketing |
| Conversation opener synthesized from all signals | Task 8 `_conversation_opener` |
| Grower scan history flag (loyal customer) | Task 8 `_grower_scan_flags` |
| Check-in trigger (button press) | Task 11 CheckIn page |
| 30-second brief card UI | Task 12 SituationBriefCard |

All spec requirements covered.
