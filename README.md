# Syngenta Field Intelligence

A sales-rep tool that generates a **30-second situation brief** when a rep checks in at a retailer.
It synthesises grower crop data, WhatsApp campaign engagement, retailer inventory, and grower scan history into one actionable card with a scripted conversation opener.

---

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Backend  | Python 3.11 · FastAPI · pandas    |
| Frontend | React 18 · Vite 5 · Tailwind CSS 3 |
| Data     | `Syngenta.xlsx` (loaded at startup into memory — no database) |

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- `Syngenta.xlsx` placed in the **project root** (`d:/Syngenta/Syngenta.xlsx`)

---

## Running the Backend

```bash
cd backend

# Create virtual environment (first time only)
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

> The Excel file is loaded into memory on startup — expect **~40 seconds** for the first boot.
> The server runs at **http://localhost:8000**.

---

## Running the Frontend

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start the dev server
npm run dev
```

> Opens at **http://localhost:5173**. API calls are proxied to `localhost:8000` via Vite.

---

## Running Backend Tests

```bash
cd backend
.venv\Scripts\activate
pytest tests/ -v
```

30 tests cover crop stage logic and all brief-builder sections.

---

## API Endpoints

| Method | Path                    | Description                              |
|--------|-------------------------|------------------------------------------|
| POST   | `/api/situation-brief`  | Generate a situation brief for a retailer |
| GET    | `/api/retailers`        | List retailers (first 200)               |
| GET    | `/api/reps`             | List sales reps                          |
| GET    | `/api/health`           | Health check                             |

### POST `/api/situation-brief`

```json
{
  "rep_id": "REP_0001",
  "retailer_id": "RTL_00001",
  "visit_date": "2026-01-20"
}
```

`visit_date` is optional — omit to use today's date.

---

## Demo Values

| Field        | Value        | Notes                                    |
|--------------|--------------|------------------------------------------|
| Rep ID       | `REP_0001`   | Select from dropdown                     |
| Retailer ID  | `RTL_00001`  | Select from dropdown after choosing rep  |
| Visit Date   | `2026-01-20` | Wheat tillering stage — shows full brief |
| Visit Date   | `2026-02-25` | Wheat flowering stage                    |
| Visit Date   | *(blank)*    | Today — likely `post_harvest` for Rabi   |

---

## Project Structure

```
Syngenta/
├── backend/
│   ├── main.py              # FastAPI app + endpoints
│   ├── data_loader.py       # Excel → pandas DataFrames
│   ├── models.py            # Pydantic request/response models
│   ├── crop_stage.py        # Crop stage calculator
│   ├── brief_builder.py     # Section builders + orchestrator
│   ├── requirements.txt
│   └── tests/
│       ├── conftest.py
│       ├── test_crop_stage.py
│       └── test_brief_builder.py
├── frontend/
│   └── src/
│       ├── api/             # Axios API clients
│       ├── pages/           # CheckIn page
│       └── components/      # Situation Brief Card + sections
├── Syngenta.xlsx            # Source data (gitignored)
└── README.md
```
