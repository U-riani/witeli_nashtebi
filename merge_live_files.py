# backend/merge_live_files.py

import pandas as pd
from pathlib import Path

# ======================
# PATHS
# ======================
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
LIVE_DIR = DATA_DIR / "live"
OUTPUT_FILE = DATA_DIR / "allLiveNashtebi.xlsx"

LIVE_DIR.mkdir(exist_ok=True)

# ======================
# HELPERS
# ======================
def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = (
        df.columns
        .astype(str)
        .str.strip()
        .str.replace(r"\s+", " ", regex=True)
    )
    return df


def force_barcode_string(df: pd.DataFrame) -> pd.DataFrame:
    if "შტრიხკოდი" in df.columns:
        df["შტრიხკოდი"] = df["შტრიხკოდი"].astype(str).str.strip()
    return df


# ======================
# MERGE LOGIC
# ======================
all_frames = []

files = list(LIVE_DIR.glob("*.xlsx"))

if not files:
    raise Exception("❌ No Excel files found in data/live/")

for file in files:
    print(f"📥 Reading: {file.name}")

    df = pd.read_excel(file)
    df = normalize_columns(df)
    df = force_barcode_string(df)

    # Optional: track source file (debug-friendly)
    df["_source_file"] = file.name

    all_frames.append(df)

# ======================
# CONCAT & SAVE
# ======================
merged_df = pd.concat(all_frames, ignore_index=True)

merged_df.to_excel(OUTPUT_FILE, index=False)

print(f"\n✅ Unified live stock file created:")
print(f"   {OUTPUT_FILE}")
print(f"   Rows: {len(merged_df)}")
print(f"   Warehouses: {merged_df['საწყობ'].nunique() if 'საწყობ' in merged_df.columns else 'unknown'}")
