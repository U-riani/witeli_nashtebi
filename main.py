# backend/main.py
import pandas as pd
import re
from pathlib import Path

# ======================
# PATHS
# ======================
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
OUTPUT_DIR = BASE_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

LIVE_FILE = DATA_DIR / "allLiveNashtebi.xlsx"
MISSING_FILE = DATA_DIR / "witeli_nashtebi.xlsx"
CNOBARI_FILE = DATA_DIR / "cnobari.xlsx"
TEMPLATE_FILE = DATA_DIR / "template.xlsx"

# ======================
# HELPERS
# ======================
def normalize_columns(df):
    df.columns = (
        df.columns.astype(str)
        .str.strip()
        .str.replace(r"\s+", " ", regex=True)
    )
    return df


def force_string(df, cols):
    for c in cols:
        if c in df.columns:
            df[c] = df[c].astype(str).str.strip()
    return df


def force_numeric(df, cols):
    for c in cols:
        if c in df.columns:
            df[c] = pd.to_numeric(
                df[c].astype(str).str.replace(",", ".").str.strip(),
                errors="coerce"
            )
    return df


def normalize_warehouse(val):
    if not isinstance(val, str):
        return ""
    return re.sub(r"^\d+\s*-\s*", "", val).strip()

# ======================
# LOAD FILES
# ======================
live_df = normalize_columns(pd.read_excel(LIVE_FILE))
missing_df = normalize_columns(pd.read_excel(MISSING_FILE))
cnobari_df = normalize_columns(pd.read_excel(CNOBARI_FILE))
template_df = normalize_columns(pd.read_excel(TEMPLATE_FILE))

# ---- FORCE STRING IDS
live_df = force_string(live_df, ["შტრიხკოდი", "შიდა კოდი", "საწყობი"])
missing_df = force_string(missing_df, ["შტრიხკოდი", "საწყობის დასახელება"])
cnobari_df = force_string(cnobari_df, ["შტრიხკოდი", "შიდა კოდი"])

# ---- NUMERIC
live_df = force_numeric(live_df, ["live ნაშთი", "საბითუმო ფასი"])
missing_df = force_numeric(missing_df, ["რაოდენობა"])
cnobari_df = force_numeric(cnobari_df, ["ფასი"])

# ---- NORMALIZE WAREHOUSE
live_df["warehouse_norm"] = live_df["საწყობი"].apply(normalize_warehouse)
missing_df["warehouse_norm"] = missing_df["საწყობის დასახელება"].apply(normalize_warehouse)

template_columns = template_df.columns.tolist()

# ======================
# LOOKUPS
# ======================
cnobari_by_barcode = cnobari_df.set_index("შტრიხკოდი")

# ======================
# CORE LOGIC
# ======================
for warehouse in missing_df["warehouse_norm"].dropna().unique():

    rows = []
    missing_wh = missing_df[missing_df["warehouse_norm"] == warehouse]

    for _, witeli_row in missing_wh.iterrows():

        barcode = witeli_row["შტრიხკოდი"]

        # cnobari is mandatory
        if barcode not in cnobari_by_barcode.index:
            continue

        cn = cnobari_by_barcode.loc[barcode]
        article = str(cn["შიდა კოდი"]).strip()

        # all live rows with same article + warehouse
        live_matches = live_df[
            (live_df["warehouse_norm"] == warehouse) &
            (live_df["შიდა კოდი"] == article)
        ]

        # ensure witeli barcode first
        all_barcodes = (
            [barcode] +
            [b for b in live_matches["შტრიხკოდი"] if b != barcode]
        )

        for bc in all_barcodes:

            live_row = live_matches[live_matches["შტრიხკოდი"] == bc]

            base = {
                "თარიღი": witeli_row.get("თარიღი", "") if bc == barcode else "",
                "საწყობის დასახელება": warehouse,
                "შტრიხკოდი": bc,
                "შიდა კოდი": article,

                # ---- FROM CNOBARI
                "საქონელი": cn.get("დასახელება", ""),
                "კატეგორია": cn.get("კატეგორია", ""),
                "ტიპი": cn.get("ტიპი", ""),
                "ზომა": cn.get("ზომა", ""),
                "ფერი": cn.get("ფერი", ""),
                "სქესი": cn.get("სქესი", ""),
                "საცალო ფასი": cn.get("ფასი", ""),

                # ---- STOCK
                "ნაშთი- APEX": "",
                "წითელი ნაშთი": witeli_row.get("რაოდენობა", "") if bc == barcode else "",

                # ---- MANUAL
                "რეალური ნაშთი": "",
                "DIFF": "",
                "ფერის არტიკული": ""
            }

            if not live_row.empty:
                base["ნაშთი- APEX"] = live_row.iloc[0].get("live ნაშთი", "")

            rows.append(base)

    df = pd.DataFrame(rows)

    # ======================
    # ALIGN TO TEMPLATE
    # ======================
    final_df = pd.DataFrame(columns=template_columns)
    for c in template_columns:
        final_df[c] = df[c] if c in df.columns else ""

    out_file = OUTPUT_DIR / f"{warehouse.replace(' ', '_')}_inventory.xlsx"
    final_df.to_excel(out_file, index=False)

    print(f"✔ Generated: {out_file}")
