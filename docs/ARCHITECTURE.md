# Syngenta Field Operations AI Co-Pilot — Architecture & Product Document

**Version:** 1.0  
**Date:** May 2026  
**System Name:** Situation Brief  
**Classification:** Internal Technical & Product Documentation  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [End-to-End Workflow](#3-end-to-end-workflow)
4. [The Situation Brief Explained](#4-the-situation-brief-explained)
5. [Data Pipeline](#5-data-pipeline)
6. [Agronomic Intelligence Layer](#6-agronomic-intelligence-layer)
7. [Business Value and Outcomes](#7-business-value-and-outcomes)
8. [Limitations and Next Steps](#8-limitations-and-next-steps)
9. [Deployment Architecture](#9-deployment-architecture)

---

## 1. Executive Summary

### What It Is

The Situation Brief tool is a web-based field intelligence co-pilot for Syngenta's field sales force. When a sales representative checks in at a retailer, the system generates a structured, 30-second briefing card that synthesises agronomic conditions, retailer inventory state, digital campaign engagement, and grower scan history into a single actionable view — including a scripted conversation opener.

The system is built as a React single-page application backed by a FastAPI REST service. All intelligence is computed deterministically from structured data at request time. There is no persistent session state, no database, and no model inference at runtime beyond rule-based logic encoded in Python.

### The Problem It Solves

Syngenta's field force operates on fixed territory rotation schedules that are blind to conditions on the ground. A rep visiting a retailer in a wheat-growing tehsil in January has no immediate way to know:

- That the crop is currently in the tillering stage, making weed control products the highest-priority conversation
- That Syngenta ran a WhatsApp awareness campaign last week and 40 farmers in that tehsil opened the message about Tilt 250 EC
- That the retailer has only 30 units of Score 250 EC left — a closure opportunity — while Axial 50 EC has 200 units with no sales movement in the last 28 days
- That one specific grower authenticated a Syngenta product QR code three days ago and is an active buyer worth engaging

Without this system, the rep improvises. The conversation is generic. Opportunities to close stock that is running low, reinforce digital campaigns with an in-person visit, or tailor agronomic advice to the exact growth stage are routinely missed.

### What It Delivers

At the moment of visit, the rep opens the tool, selects their ID and the retailer they are standing in front of, and receives a brief covering:

1. The dominant crop in the tehsil and its current growth stage
2. Which Syngenta products are agronomically relevant at that stage
3. WhatsApp campaign reach data — how many local growers received and opened digital messages
4. Retailer shelf status — which SKUs are low, well-stocked, or dead stock
5. Growers in the tehsil who recently scanned (authenticated) a Syngenta product — high-trust upsell candidates
6. A generated conversation opener that ties all of the above into a single scripted sentence the rep can say immediately upon entering the shop

This converts a routine sales call into a contextually grounded visit with a defined next best action.

---

## 2. System Architecture

### High-Level Design

The system follows a two-tier client-server architecture. The frontend is a React SPA that handles all user interaction. The backend is a stateless FastAPI service that performs all business logic and returns a fully assembled response. There is no intermediate caching layer, message queue, or database — the data source is a single Excel workbook loaded into memory at server startup.

```
  [Field Sales Rep — Mobile/Desktop Browser]
              |
              | HTTPS
              v
  +---------------------------+
  |   React SPA (Vercel CDN)  |
  |   CheckIn.jsx             |
  |   SituationBriefCard.jsx  |
  |   + 4 section components  |
  +---------------------------+
              |
              | POST /api/situation-brief
              | GET  /api/retailers
              | GET  /api/reps
              v
  +---------------------------+
  |   FastAPI Backend         |
  |   (Railway — Python 3.11) |
  |                           |
  |   main.py                 |
  |     |                     |
  |     +-- data_loader.py    |  <-- Syngenta.xlsx loaded at startup
  |     |    (DataStore)      |       into 7 pandas DataFrames
  |     |                     |
  |     +-- brief_builder.py  |  <-- Orchestrates 5 assembly functions
  |          |                |
  |          +-- crop_stage.py|  <-- Date-driven crop calendar resolver
  +---------------------------+
              |
              | (in-process, in-memory)
              v
  +---------------------------+
  |   DataStore (singleton)   |
  |   growers          DataFrame   |
  |   campaigns        DataFrame   |
  |   retailers        DataFrame   |
  |   inventory        DataFrame   |
  |   pos              DataFrame   |
  |   visits           DataFrame   |
  |   reps             DataFrame   |
  +---------------------------+
              ^
              |  Loaded once at startup
  +---------------------------+
  |   Syngenta.xlsx           |
  |   (7 worksheets)          |
  +---------------------------+
```

### Component Breakdown

**Frontend — React SPA**

Served from Vercel's global CDN. Built with Vite 5. All API communication is handled by two thin Axios client modules. The UI has a single page (`CheckIn.jsx`) that renders a form and, upon successful response, renders the `SituationBriefCard` component tree. The card is composed of five independent section components, each receiving only the slice of the brief it needs to render.

**Backend — FastAPI Service**

A synchronous FastAPI application running on Uvicorn. The application has four endpoints. The core endpoint (`POST /api/situation-brief`) delegates entirely to `build_brief()` in `brief_builder.py`, which assembles the five sections of the brief and returns a single Pydantic-validated response object. No business logic lives in `main.py`.

**Data Layer — In-Memory DataStore**

A singleton `DataStore` object is initialised at server startup by parsing `Syngenta.xlsx` using `pandas.ExcelFile`. Each worksheet becomes a typed DataFrame with parsed dates and normalised string IDs. The singleton is accessed via `get_store()` — a module-level lazy initialiser. There is no database, no ORM, and no disk I/O after startup.

**Agronomic Logic — crop_stage.py**

A pure-Python module with no external dependencies beyond the standard library. It receives a crop calendar dictionary (parsed from JSON stored per-grower in the Excel data) and a visit date, and resolves the current growth stage by walking a sorted list of stage milestone dates. It also maintains a static lookup table mapping `(crop, stage)` pairs to recommended Syngenta product SKUs.

### External Dependencies

| Dependency | Role |
|---|---|
| Vercel | Frontend hosting and CDN delivery |
| Railway | Backend hosting and process management |
| `Syngenta.xlsx` | Single source of truth for all operational data |

There are no third-party APIs, no cloud databases, no message brokers, and no LLM inference endpoints in the current production system.

---

## 3. End-to-End Workflow

### Step-by-Step Flow

```
Rep opens browser  -->  React SPA loads from Vercel CDN
       |
       v
App mounts (useEffect)
       |
       +-- GET /api/reps        --> backend returns [{rep_id, territory_id}, ...]
       +-- GET /api/retailers   --> backend returns [{retailer_id, territory_id,
                                                      state, district, tehsil}, ...]
       |
       v
Rep selects their Rep ID from dropdown
       |
       v
Retailer dropdown filters to only retailers in
the selected rep's territory_id
(client-side filter, no additional API call)
       |
       v
Rep selects the retailer they are standing in front of
       |
       v
Rep optionally sets a visit date
(defaults to server-side date.today() if omitted)
       |
       v
Rep clicks "Check In & Generate Brief"
       |
       v
POST /api/situation-brief
  body: { rep_id, retailer_id, visit_date? }
       |
       v
FastAPI receives request
  --> brief_builder.build_brief() called with all DataFrames
       |
       +-- 1. Resolve retailer row --> extract tehsil
       +-- 2. Filter growers by tehsil
       +-- 3. _dominant_crop()         --> most common crop in tehsil
       +-- 4. _current_stage_for_crop()--> resolve stage from calendar + date
       +-- 5. recommended_products()   --> static (crop, stage) product lookup
       +-- 6. _digital_signals()       --> aggregate campaign data for tehsil growers
       +-- 7. _inventory_status()      --> latest stock snapshot + 28-day POS sales
       +-- 8. _grower_scan_flags()     --> growers with product_scan == 1
       +-- 9. _conversation_opener()   --> template-filled string using outputs above
       |
       v
SituationBrief Pydantic model serialised to JSON
       |
       v
React receives response
       |
       v
SituationBriefCard rendered:
  [ConversationOpener]        -- displayed first, largest prominence
  [FieldSituationSection]     -- crop, stage, recommended products
  [DigitalSignalsSection]     -- campaign sent/opened/clicked counts
  [InventorySection]          -- SKU list sorted by urgency
  [GrowerScanFlags]           -- growers who authenticated product recently
```

### Territory-Based Retailer Filtering

The retailer dropdown is not a generic list. When a rep selects their ID, the frontend cross-references `rep.territory_id` against the full retailer list (already loaded in component state) and filters client-side. This means a rep only ever sees the retailers in their assigned territory — no additional backend call is required. This is a deliberate design choice that keeps the check-in flow fast and prevents reps from pulling briefs for retailers outside their territory.

### Visit Date Flexibility

The `visit_date` field is optional. When omitted, the backend defaults to `date.today()`. This design supports retrospective brief generation — a manager or trainer can replay what a brief would have looked like on a historical date by supplying a past date. This is also the mechanism used to demonstrate the tool with example dates (e.g., `2026-01-20` places wheat in the tillering stage; `2026-02-25` places it in the flowering stage).

---

## 4. The Situation Brief Explained

The `SituationBrief` object returned by the API has nine fields, assembled by five distinct functions in `brief_builder.py`. The frontend renders them in a fixed order optimised for the rep's reading flow at point of visit.

### Section 1 — Conversation Opener

**UI label:** "Suggested Conversation Opener"  
**Source field:** `conversation_opener` (string)  
**Rendered by:** `ConversationOpener.jsx`

This is displayed at the top of the card because it is the first thing the rep needs. It is a template-filled natural language sentence, not a generative AI output. The template logic in `_conversation_opener()` selects among three variants:

- **Full context (digital signals + inventory):** Leads with the agronomic pressure for the current crop stage, references the campaign product and how many local farmers opened the message, then anchors to the specific inventory item that needs action.

  > "Are your wheat farmers asking about leaf blight yet? We've been running awareness on Tilt 250 EC — 22 farmers in your tehsil opened the message. You have 30 units, running low — close today."

- **Inventory only (no campaign data):** Falls back to a crop-stage-led opener that names the inventory item and its status.

- **Generic fallback:** Used when neither campaign data nor inventory data is available for the retailer.

The disease/pest hint embedded in the opener is drawn from `_DISEASE_HINTS`, a static dictionary keyed on `(crop, stage)` tuples. For example, `("wheat", "flowering")` maps to `"leaf blight"` and `("mustard", "vegetative")` maps to `"aphid pressure"`. This is agronomic domain knowledge hardcoded into the system.

### Section 2 — Field Situation ("What's Happening Here Right Now")

**UI label:** "What's Happening Here Right Now"  
**Source fields:** `dominant_crop`, `current_stage`, `recommended_products`  
**Rendered by:** `FieldSituationSection.jsx`

This section answers the agronomic context question: what is growing, where is it in its lifecycle, and which products are relevant right now.

**Dominant crop** is determined by `_dominant_crop()`, which reads the `grower_crop_calendar` field (a parsed JSON dict) from every grower in the retailer's tehsil and takes a mode (most frequent crop value). This is a tehsil-level aggregation — it represents the agronomic reality of the sub-district, not just this one retailer's customers.

**Current stage** is resolved per-crop by `_current_stage_for_crop()`, which takes the first matching grower's calendar and passes it to `get_current_stage()` in `crop_stage.py`. Stage resolution logic is:

- If visit date precedes sowing start: `pre_sowing`
- If visit date is within the sowing window: `sowing`
- If visit date is within the harvest window: `harvest`
- If visit date follows harvest end: `post_harvest`
- Otherwise: walk the `stages` list (sorted by `approx` date) and return the last stage whose milestone date has passed; default to `early_growth` if none have passed yet

**Recommended products** are returned by `recommended_products()`, a direct dictionary lookup on `STAGE_PRODUCTS` keyed by `(crop.lower(), stage.lower())`. This table covers 18 crop-stage combinations across 6 crops (wheat, chickpea, mustard, barley, potato, lentil) and maps each to a list of Syngenta product names. Products are not ranked within the list beyond the ordering defined in the static table.

### Section 3 — Digital Signals ("What Syngenta Already Started Digitally")

**UI label:** "What Syngenta Already Started Digitally"  
**Source field:** `digital_signals` (nullable `DigitalSignals` object)  
**Rendered by:** `DigitalSignalsSection.jsx`

This section surfaces the WhatsApp campaign work that has already reached farmers in this tehsil, so the rep's physical visit can act as a follow-through on a digital touchpoint rather than a cold approach.

`_digital_signals()` filters the `whatsapp_campaign` DataFrame to rows where:
- `grower_id` is in the set of growers belonging to the retailer's tehsil
- `campaign_crop` matches the dominant crop (case-insensitive)

It then attempts to further filter to rows where `campaign_product` matches the first recommended product for the current stage. If that sub-filter yields no rows, it falls back to all tehsil campaigns for the crop. From the resulting rows it aggregates:

- `total_sent`: row count (one row per message-grower pair)
- `open_count`: sum of `opened_status` (binary flag column)
- `open_rate`: `open_count / total_sent`
- `click_count`: sum of `clicked_status`

The section renders as three stat tiles — Sent, Opened (with percentage), Clicked (with percentage). If no matching campaign rows exist, `digital_signals` is `None` and the section is hidden entirely in the UI.

### Section 4 — Inventory ("What the Shelf Looks Like")

**UI label:** "What the Shelf Looks Like"  
**Source field:** `inventory` (list of `InventoryItem`)  
**Rendered by:** `InventorySection.jsx`

`_inventory_status()` produces a ranked list of the retailer's SKUs with a stock health classification for each.

The function takes the most recent week snapshot from `retailer_inventory_weekly` (identified by `max(week_end_date)` for this retailer) as the current quantity. It then joins to `retailer_pos` to sum `sku_qty` sold in the 28 days prior to the visit date.

Classification logic:

| Condition | Status | Display |
|---|---|---|
| No sales in last 28 days (sold = 0) | `zero_movement` | Red — dead stock |
| Sales exist AND quantity < 50 units | `low_stock` | Amber — close today |
| Sales exist AND quantity >= 50 units | `well_stocked` | Green — healthy |

Items are sorted with `low_stock` first, `well_stocked` second, `zero_movement` last. This ordering surfaces the most urgent inventory actions at the top of the list. The 50-unit threshold is hardcoded in `brief_builder.py` and is the primary tuning knob for stock alert sensitivity.

> **Assumption:** The 50-unit threshold was set based on the data in `Syngenta.xlsx`. It is not parameterised and would need a code change to adjust per-SKU or per-season.

### Section 5 — Grower Scan Flags ("Loyal Growers — Scan History")

**UI label:** "Loyal Growers — Scan History"  
**Source field:** `grower_scan_flags` (list of `GrowerScanFlag`)  
**Rendered by:** `GrowerScanFlags.jsx`

`_grower_scan_flags()` iterates over growers in the tehsil and returns a flag for each grower where `product_scan == 1` (truthy). Each flag includes the grower ID, the product name they scanned, and the scan date.

The rationale is that product QR scan/authentication is a strong purchase-intent signal. A grower who scanned a Syngenta product recently has already demonstrated they bought an authentic Syngenta product — they are a confirmed active customer and a qualified upsell candidate. The UI labels them "High trust — good upsell candidate."

If no growers in the tehsil have scan records, this section renders nothing (`GrowerScanFlags` returns `null` when `flags.length === 0`).

---

## 5. Data Pipeline

### Source: Syngenta.xlsx

The entire operational data foundation is a single Excel workbook with seven named worksheets. It is loaded once at server startup into a `DataStore` singleton. There is no ETL pipeline, no scheduled refresh, and no incremental update mechanism. Updating the data requires replacing the file and restarting the backend process.

### Sheet Loading and Normalisation

```
Syngenta.xlsx
  |
  +-- growers                   (header=0)  --> DataStore.growers
  +-- whatsapp_campaign         (header=0)  --> DataStore.campaigns
  +-- retailers                 (header=1)  --> DataStore.retailers   [double-header]
  +-- retailer_inventory_weekly (header=0)  --> DataStore.inventory
  +-- retailer_pos              (header=0)  --> DataStore.pos
  +-- retailer_visit_log        (header=0)  --> DataStore.visits
  +-- reps_territory            (header=1)  --> DataStore.reps        [double-header]
```

Two sheets (`retailers` and `reps_territory`) have a spurious first header row (an artifact of how the Excel was structured), so they are parsed with `header=1` to skip it. Unnamed trailing columns produced by pivot table artifacts in the `retailers` sheet are dropped after load.

### Data Cleaning Applied at Load Time

- `retailer_id` and `tehsil` string columns are stripped of leading/trailing whitespace to prevent silent lookup failures
- `grower_crop_calendar` is parsed from a JSON string into a Python dict per row
- Four date columns are parsed from string to `pd.Timestamp`:
  - `campaigns.message_sent_date`
  - `inventory.week_end_date`
  - `pos.transaction_date`
  - `visits.visit_date`

### Data Flow Through the Brief Builder

```
DataStore.retailers
  --> resolve tehsil for retailer_id

DataStore.growers
  --> filter by tehsil
  --> compute dominant_crop (mode of crop field)
  --> resolve crop_stage (calendar JSON + visit_date)
  --> extract scan flags (product_scan == 1)

DataStore.campaigns
  --> filter by grower_id IN tehsil growers
  --> filter by campaign_crop == dominant_crop
  --> aggregate: total_sent, opens, clicks

DataStore.inventory
  --> filter by retailer_id
  --> take max(week_end_date) snapshot
  --> join to POS for 28-day velocity

DataStore.pos
  --> filter by retailer_id AND transaction_date >= (visit_date - 28 days)
  --> group by sku_id, sum sku_qty
```

### Schema Definitions

**growers**

| Column | Type | Description |
|---|---|---|
| `grower_id` | string | Primary grower identifier |
| `state` | string | State name |
| `district` | string | District name |
| `tehsil` | string | Sub-district; join key to retailers |
| `grower_crop_calendar` | dict (parsed JSON) | Per-grower crop calendar with sowing/harvest/stage dates |
| `product_scan` | int (0/1) | Whether the grower has authenticated a product via QR |
| `product_name` | string | Name of product scanned |
| `product_scan_datetime` | string/timestamp | Date of most recent scan |

**retailers**

| Column | Type | Description |
|---|---|---|
| `retailer_id` | string | Primary retailer identifier |
| `territory_id` | string | Territory assignment; used to filter by rep |
| `state` | string | State |
| `district` | string | District |
| `tehsil` | string | Sub-district; join key to growers |

**retailer_inventory_weekly**

| Column | Type | Description |
|---|---|---|
| `retailer_id` | string | Foreign key to retailers |
| `sku_id` | string | Syngenta product SKU code |
| `sku_name` | string | Human-readable product name |
| `sku_qty` | int | Units on hand at week end |
| `week_end_date` | timestamp | Week-ending date of snapshot |

**retailer_pos**

| Column | Type | Description |
|---|---|---|
| `retailer_id` | string | Foreign key to retailers |
| `transaction_id` | string | Transaction identifier |
| `sku_id` | string | Product sold |
| `sku_name` | string | Product name |
| `sku_qty` | int | Units sold in transaction |
| `sku_price` | float | Unit price |
| `transaction_date` | timestamp | Date of sale |

**whatsapp_campaign**

| Column | Type | Description |
|---|---|---|
| `id` | string | Campaign message identifier |
| `campaign_product` | string | Syngenta product the message promoted |
| `campaign_crop` | string | Crop type targeted by campaign |
| `grower_id` | string | Recipient grower |
| `message_sent_date` | timestamp | Date message was sent |
| `delivered_status` | int (0/1) | Delivery confirmation |
| `opened_status` | int (0/1) | Open confirmation |
| `clicked_status` | int (0/1) | Click-through confirmation |

**reps_territory**

| Column | Type | Description |
|---|---|---|
| `rep_id` | string | Rep identifier |
| `territory_id` | string | Territory assigned to rep |

---

## 6. Agronomic Intelligence Layer

### Design Philosophy

The agronomic layer does not use a machine learning model or external agronomic API. It encodes domain knowledge as structured rules: a date-driven crop calendar resolver and a static product recommendation table. This was a deliberate design choice — deterministic, auditable, and requires no inference infrastructure.

### Crop Calendar Structure

Each grower record contains a `grower_crop_calendar` field stored as a JSON string in the Excel and parsed to a Python dict at load time. The structure is:

```json
{
  "season": "Rabi_2025-26",
  "crop": "wheat",
  "sowing":  { "start": "2025-11-01", "end": "2025-11-25" },
  "harvest": { "start": "2026-03-20", "end": "2026-04-15" },
  "stages": [
    { "stage": "tillering", "approx": "2026-01-15" },
    { "stage": "flowering", "approx": "2026-02-20" }
  ]
}
```

The calendar encodes the full lifecycle with two fixed anchor windows (sowing, harvest) and a variable-length list of intermediate growth stages, each with an approximate milestone date.

### Stage Resolution Algorithm

`get_current_stage(calendar, today)` in `crop_stage.py`:

```
1. If today < sowing.start                 --> "pre_sowing"
2. If today > harvest.end                  --> "post_harvest"
3. If harvest.start <= today <= harvest.end --> "harvest"
4. If sowing.start <= today <= sowing.end   --> "sowing"
5. Sort stages list by approx date ascending
6. Walk forward: for each stage, if today >= approx, set current = stage.stage
7. Return current (defaults to "early_growth" if no stages passed yet)
```

This correctly handles gaps between sowing end and the first named stage (returned as `early_growth`) and between the last named stage and harvest start (returned as whatever the last named stage was).

### Product Recommendation Table

`STAGE_PRODUCTS` in `crop_stage.py` maps `(crop, stage)` tuples to ordered lists of Syngenta product names:

| Crop | Stage | Products |
|---|---|---|
| wheat | sowing | Cruiser 350 FS, Vibrance Integral |
| wheat | early_growth | Axial 50 EC |
| wheat | tillering | Axial 50 EC, Topik 15 WP, Tilt 250 EC |
| wheat | flowering | Tilt 250 EC, Score 250 EC, Amistar 250 SC |
| wheat | harvest | (none) |
| chickpea | sowing | Cruiser 350 FS |
| chickpea | vegetative | Kavach 75 WP |
| chickpea | flowering | Amistar 250 SC, Tilt 250 EC |
| mustard | sowing | Cruiser 350 FS |
| mustard | vegetative | Actara 25 WG |
| mustard | flowering | Score 250 EC, Tilt 250 EC |
| barley | sowing | Cruiser 350 FS |
| barley | tillering | Axial 50 EC, Tilt 250 EC |
| barley | flowering | Tilt 250 EC |
| potato | sowing | Actara 25 WG |
| potato | vegetative | Kavach 75 WP, Amistar 250 SC |
| potato | flowering | Amistar 250 SC |
| lentil | sowing | Cruiser 350 FS |
| lentil | flowering | Tilt 250 EC, Kavach 75 WP |

The first product in each list is treated as the "primary recommendation" — it is used when filtering digital campaign data to find the most relevant matching campaign. Unknown `(crop, stage)` pairs return an empty list.

### Pest and Disease Hint Table

`_DISEASE_HINTS` in `brief_builder.py` maps `(crop, stage)` tuples to the agronomic threat that should frame the conversation opener:

| Crop | Stage | Threat |
|---|---|---|
| wheat | early_growth | weed pressure |
| wheat | tillering | weed pressure |
| wheat | flowering | leaf blight |
| wheat | harvest | grain quality |
| chickpea | flowering | botrytis blight |
| mustard | flowering | white rust |
| mustard | vegetative | aphid pressure |
| barley | tillering | net blotch |
| potato | vegetative | early blight |
| lentil | flowering | powdery mildew |

If the `(crop, stage)` pair is not in the table, the hint defaults to `"{stage} protection"`, a generic fallback.

### Coverage Gaps in Current Agronomic Rules

> **Production Risk:** The crop coverage is limited to six Rabi season crops. Kharif crops (soybean, cotton, maize, rice, sorghum) are absent from both the stage product table and the disease hint table. A tehsil with a dominant Kharif crop will return empty product recommendations and a generic disease hint.

> **Production Risk:** Stage calendar coverage only extends to `flowering` for most crops. Post-flowering stages between flowering and harvest (grain fill, dough stage, maturity) are not modelled. The algorithm will return the last named stage (`flowering`) for this period, which may extend the flowering recommendation window by 4–8 weeks depending on the crop.

---

## 7. Business Value and Outcomes

### The Core Transformation

The system translates the question "what should this rep talk about at this retailer today?" from an improvised decision made by the rep in the car to a data-grounded answer computed from multiple contextual signals.

The answer is structured as the "next best action" framework with three dimensions:

1. **Agronomic timing:** What the crop needs right now based on its growth stage — not what the rep remembers from training, not the generic seasonal playbook, but the specific window for this tehsil on this date.

2. **Inventory urgency:** Which SKUs need to move, which are healthy, and which are dead stock that indicate a problem. The sort order in the inventory section (low stock first) operationalises a "close first" selling discipline.

3. **Digital-physical continuity:** WhatsApp campaigns prime farmers digitally. The Situation Brief closes the loop by telling the rep exactly how many farmers in this tehsil received and engaged with that message. The rep can walk into the retailer and say "we've been running awareness with your farmers" — and mean it with a specific number.

### How It Answers the Original Business Problem

| Original Problem | System Response |
|---|---|
| Pest outbreak in a district means insecticide should be prioritised now | Disease hints in `_DISEASE_HINTS` and product recommendations in `STAGE_PRODUCTS` surface the relevant product class at the right stage. The conversation opener names the threat. |
| Rainfall deviation shifts crop calendar | Crop calendars are per-grower and date-driven. An agronomist updating the calendar dates in `Syngenta.xlsx` immediately changes the stage resolved for every rep visiting that tehsil. |
| Competitor promotional push requires defensive response | Not directly addressed in v1. Campaign engagement data does show Syngenta's own push. A future version can ingest competitor intelligence. |
| Retailer inventory levels influence next best action | The inventory section with its urgency sort and 28-day sales velocity directly drives the "close today" vs "well stocked" vs "dead stock" action framing. |
| Farmer purchase history affects recommendation | Grower scan flags surface confirmed authentic buyers. POS sales history drives inventory velocity calculations. |

### Operational Impact

A rep without this tool spends the first 5–10 minutes of a visit establishing context — asking the retailer what is selling, what farmers are asking about, what stock needs attention. The Situation Brief compresses this to 30 seconds of reading before entering the shop. The rep enters with a structured agenda instead of a blank slate.

The conversation opener removes the most common point of failure in a field sales visit: a generic, non-specific opening that signals to the retailer that the rep has done no preparation.

---

## 8. Limitations and Next Steps

### Current Limitations

**Static data source.** `Syngenta.xlsx` is loaded once at startup. There is no mechanism for incremental updates. Inventory data, campaign data, and grower profiles are as current as the last Excel refresh. In practice this likely means the data is days to weeks stale at any given moment.

> **Production Risk:** A rep seeing "30 units of Score 250 EC" may act on a figure that is already 7 days old. If another rep visited two days ago and moved that stock, the signal is wrong. Without a live POS feed, inventory alerts carry an implied staleness caveat.

**No authentication or authorisation.** The API has no authentication layer. Any client with the backend URL can call `POST /api/situation-brief` with any `rep_id` and `retailer_id`. There is no enforcement of the rep-territory mapping beyond the client-side UI filter. A rep can trivially construct a request for a retailer outside their territory.

> **Production Risk:** In production, every API endpoint must be gated behind authentication. The `rep_id` should be derived from the authenticated session, not accepted as a request parameter.

**CORS is fully open.** `main.py` configures `allow_origins=["*"]`. This is acceptable only for a demo. In production, origins must be restricted to the Vercel deployment domain.

> **Production Risk:** Open CORS allows any website to make credentialed requests to the backend.

**Single-threaded in-memory data.** The DataStore is a module-level singleton holding all data in RAM. Under concurrent load this is safe only because pandas operations release the GIL and FastAPI is I/O-bound. However, if data volume grows significantly or the Excel parse time increases, startup latency (noted as ~40 seconds in the README) will degrade further.

**No mobile-native experience.** The UI is a responsive web page, but there is no Progressive Web App manifest, no offline capability, and no camera integration. Field reps in areas with poor connectivity cannot use the tool without a data connection.

**Retailer list is capped at 200.** `GET /api/retailers` returns `store.retailers.head(200)`. If the territory has more than 200 retailers, the remaining ones are silently absent from the dropdown.

> **Production Risk:** This cap will cause silent data loss for large territories. The cap should be replaced with territory-scoped filtering that returns all retailers for the selected rep's territory, not a global head limit.

**No LLM integration.** The conversation opener is generated by a template function with three variants. It is deterministic and reads as scripted. It does not adapt to nuance (e.g., a retailer with a history of resistance to a specific product, seasonal credit terms, relationship history). An LLM-generated opener would produce more natural, contextually rich suggestions.

**No visit logging.** The `retailer_visit_log` sheet is loaded but never written to. The system does not record that a brief was generated or that a visit occurred. There is no audit trail, no feedback loop, and no data for measuring whether the brief influenced rep behaviour or sales outcomes.

**No offline mode.** If the Railway backend is down or unreachable, the app shows an error. There is no cached-brief fallback, no service worker, and no local storage of recent briefs.

### Recommended Next Steps

**Priority 1 — Authentication and security hardening**
- Implement JWT-based authentication (Auth0 or Syngenta SSO)
- Derive `rep_id` from the authenticated token; remove it from the request body
- Restrict CORS to the production Vercel domain
- Move the Excel file or its database equivalent behind a private network boundary

**Priority 2 — Live data integration**
- Replace the Excel inventory source with a direct feed from the distributor/ERP system
- Replace WhatsApp campaign data with a live pull from the campaign platform API
- Use `retailer_visit_log` as a writable record — log every check-in to track rep activity

**Priority 3 — Remove the 200-retailer cap**
- Replace `head(200)` with territory-scoped filtering on the backend
- Return only retailers for the requesting rep's territory

**Priority 4 — Mobile-first and offline capability**
- Convert to a Progressive Web App with a service worker
- Cache the last brief per retailer in IndexedDB for offline use in low-connectivity field conditions
- Add a "sync when online" mechanism to upload visit records

**Priority 5 — LLM-powered conversation opener**
- Replace the template function with a structured prompt to Claude or GPT-4o
- Pass crop stage, inventory status, campaign engagement, and scan flags as context
- Enable personalisation using visit history (e.g., "last time you were here, they asked about X")

**Priority 6 — Expand agronomic coverage**
- Add Kharif season crops to `STAGE_PRODUCTS` and `_DISEASE_HINTS`
- Add post-flowering stages (grain fill, maturity) to the stage model
- Consider parameterising the 50-unit low-stock threshold per SKU or per season

**Priority 7 — Feedback loop and outcome measurement**
- Add a post-visit feedback form: did you use the opener? was the inventory data accurate? did you close the highlighted SKU?
- Instrument the API with response time logging and brief generation success/failure rates
- Build a management dashboard showing brief generation frequency by rep and territory

---

## 9. Deployment Architecture

### Overview

The system uses a two-platform deployment: the frontend is served from Vercel and the backend runs on Railway. The data source (`Syngenta.xlsx`) is stored in the Railway filesystem alongside the backend process.

```
[User's Browser]
     |
     | HTTPS (443)
     v
[Vercel CDN — Global Edge Network]
     |  Serves pre-built static files from frontend/dist/
     |  Build command: cd frontend && npm install && npm run build
     |  Output directory: frontend/dist
     |
     | HTTPS — POST /api/*, GET /api/*
     | (configured via VITE_API_BASE_URL environment variable)
     v
[Railway — Backend Service]
     |  Python 3.11 runtime
     |  Uvicorn serving FastAPI on Railway-assigned port
     |  Syngenta.xlsx present in working directory
     |
     | In-process, in-memory
     v
[DataStore Singleton — pandas DataFrames]
```

### Frontend Deployment (Vercel)

**Build process:** Vercel executes `cd frontend && npm install && npm run build` on every push to the connected Git branch. Vite produces an optimised static bundle in `frontend/dist/`, which Vercel deploys to its edge network.

**Configuration:** `vercel.json` at the repository root sets:
- `buildCommand`: `cd frontend && npm install && npm run build`
- `outputDirectory`: `frontend/dist`
- `framework`: `null` (disables Vercel's auto-detection, since the project root is not the frontend root)

**Environment variable:** `VITE_API_BASE_URL` must be set in the Vercel project settings to the Railway backend's public URL (e.g., `https://syngenta-api.up.railway.app`). If this variable is absent, the Axios clients fall back to an empty base URL, causing all API calls to target the same origin as the frontend — which fails in production.

**Routing:** There is no `vercel.json` rewrite rule for SPA routing. Since the application has only one page (`CheckIn`) and uses no client-side router, this is not currently a problem. Adding React Router in a future version will require a catch-all rewrite rule.

### Backend Deployment (Railway)

**Runtime:** Python 3.11 on Railway's managed container infrastructure.

**Process:** Uvicorn serves the FastAPI application. Railway detects the start command from the project configuration (typically `uvicorn main:app --host 0.0.0.0 --port $PORT`).

**Data file:** `Syngenta.xlsx` must be present in the working directory at `../Syngenta.xlsx` relative to the `backend/` directory (i.e., at the repository root). The path is resolved in `data_loader.py` as `Path(__file__).parent.parent / "Syngenta.xlsx"`. In Railway, this means the Excel file must be committed to the repository or uploaded to the Railway volume.

> **Production Risk:** Committing `Syngenta.xlsx` to the Git repository exposes potentially sensitive grower and retailer data in version control. In production, this file should be stored in a private object store (S3, GCS) and downloaded at container startup, or replaced entirely by a database.

**Startup latency:** The README notes approximately 40 seconds for the Excel load on first startup. Railway's health check timeout must be configured to exceed this window to prevent Railway from killing the process before it is ready.

**CORS:** Currently configured with `allow_origins=["*"]`. This must be updated to `allow_origins=["https://<vercel-domain>"]` before any production use with real data.

### Local Development

In local development, the Vite dev server proxies all `/api/*` requests to `http://localhost:8000` (configured in `vite.config.js`). This means `VITE_API_BASE_URL` does not need to be set locally — the proxy handles routing. The backend runs independently on port 8000 via `uvicorn main:app --reload --port 8000` from the `backend/` directory.

```
[Browser: localhost:5173]
     |
     | /api/* (proxied by Vite)
     v
[uvicorn: localhost:8000]
     |
     v
[../Syngenta.xlsx]
```

### Environment Variables

| Variable | Location | Required | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | Vercel project settings | Yes (production) | Full URL of Railway backend, e.g. `https://syngenta-api.up.railway.app` |
| `PORT` | Railway (auto-injected) | Yes | Port for Uvicorn to bind; Railway injects this automatically |

No secrets, API keys, or credentials are currently required by the application. This will change when authentication is added.

### CI/CD

There is no explicit CI/CD pipeline configuration (no GitHub Actions, no Railway deploy hooks defined in the repository). Deployment is triggered by:
- **Vercel:** Automatic deploy on push to the connected Git branch
- **Railway:** Automatic redeploy on push to the connected Git branch

Both platforms rebuild and redeploy from source on every push. There is no staging environment, no automated test gate before deployment, and no rollback mechanism beyond reverting a commit and pushing again.

> **Production Risk:** Without a test gate in CI, a breaking change to `brief_builder.py` can be deployed to production. The 30-test suite in `backend/tests/` should be run in a GitHub Actions workflow that blocks deployment on failure.

### Testing

The backend has 30 unit tests across two test files, run with pytest:

```bash
cd backend
.venv\Scripts\activate      # Windows
pytest tests/ -v
```

**`test_crop_stage.py`** — 11 tests covering:
- Each stage transition in the wheat crop calendar (pre-sowing through post-harvest)
- Empty calendar edge case
- Product recommendation lookups for known and unknown `(crop, stage)` pairs

**`test_brief_builder.py`** — 19 tests covering:
- `_dominant_crop()` with populated and empty DataFrames
- `_current_stage_for_crop()` for known crop, unknown crop, and multiple dates
- `_digital_signals()` for open rate calculation, None returns, and campaign matching
- `_inventory_status()` for all three status classifications and unknown retailer
- `_grower_scan_flags()` for scanner detection and empty scan case
- `_conversation_opener()` for full-context and fallback variants
- `build_brief()` end-to-end with mock fixtures and error case for unknown retailer

All test fixtures are defined in `conftest.py` using synthetic data that matches the real schema — the tests do not touch `Syngenta.xlsx`. This means the test suite runs in any environment without the data file.

The frontend has no automated tests. There is no Jest configuration, no React Testing Library setup, and no Playwright or Cypress configuration in the repository.

> **Production Risk:** All UI behaviour — territory filtering logic in `CheckIn.jsx`, conditional rendering of `DigitalSignalsSection` and `GrowerScanFlags`, the status-colour mapping in `InventorySection` — is untested. A regression in client-side filtering could silently show a rep retailers outside their territory.

---

*This document was produced from direct analysis of the production codebase at commit `f99f3f7`. All architectural descriptions, data schemas, algorithm explanations, and risk assessments are grounded in the actual source code. No features or behaviours have been inferred beyond what is implemented.*
