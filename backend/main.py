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
    get_store()


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
