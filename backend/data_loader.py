import json
from pathlib import Path
from typing import Optional
import pandas as pd

SHEET_NAMES = {
    "growers":    "growers",
    "campaigns":  "whatsapp_campaign",
    "retailers":  "retailers",
    "inventory":  "retailer_inventory_weekly",
    "pos":        "retailer_pos",
    "visits":     "retailer_visit_log",
    "reps":       "reps_territory",
}

# retailers and reps_territory have an extra header row (row 0 = "Column1..."
# row 1 = actual column names), so header=1 skips the spurious first row.
DOUBLE_HEADER_SHEETS = {"retailers", "reps_territory"}

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

        def parse(key: str) -> pd.DataFrame:
            sheet = SHEET_NAMES[key]
            hdr = 1 if sheet in DOUBLE_HEADER_SHEETS else 0
            return xl.parse(sheet, header=hdr)

        self.growers   = parse("growers")
        self.campaigns = parse("campaigns")
        self.retailers = parse("retailers")
        self.inventory = parse("inventory")
        self.pos       = parse("pos")
        self.visits    = parse("visits")
        self.reps      = parse("reps")

        # Drop unnamed trailing columns introduced by extra pivot table in the sheet
        self.retailers = self.retailers.loc[:, ~self.retailers.columns.str.startswith("Unnamed")]

        # Strip whitespace from string ID columns to prevent lookup misses
        for df, col in [
            (self.retailers, "retailer_id"),
            (self.growers,   "tehsil"),
            (self.retailers, "tehsil"),
        ]:
            if col in df.columns:
                df[col] = df[col].astype(str).str.strip()

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
