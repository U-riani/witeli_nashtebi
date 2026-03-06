# backend/app/services/reconcile_returned_files.py

import pandas as pd
from pathlib import Path

# ======================
# PATHS
# ======================
BASE_DIR = Path(__file__).parent
RETURNED_DIR = BASE_DIR / "returned"
OUTPUT_DIR = BASE_DIR / "reconciled"

OUTPUT_DIR.mkdir(exist_ok=True)

MASTER_ROWS = []
REQUIRED_COLS = {"ნაშთი- APEX", "რეალური ნაშთი"}

# ======================
# PROCESS EACH RETURNED FILE
# ======================
for file_path in RETURNED_DIR.glob("*_inventory.xlsx"):
    print(f"Processing: {file_path.name}")

    df = pd.read_excel(file_path)

    # Normalize headers
    df.columns = (
        df.columns.astype(str)
        .str.strip()
        .str.replace(r"\s+", " ", regex=True)
    )

    # 🔒 Validate required columns
    missing = REQUIRED_COLS - set(df.columns)
    if missing:
        raise Exception(
            f"{file_path.name} missing required columns: {missing}"
        )

    # Extract warehouse code from filename
    warehouse_code = file_path.stem.replace("_inventory", "")

    # Force numeric columns
    for col in REQUIRED_COLS:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # Recalculate DIFF = APEX - REAL
    df["DIFF"] = df["ნაშთი- APEX"] - df["რეალური ნაშთი"]

    # Add warehouse column explicitly
    df["საწყობი"] = warehouse_code

    # Keep for master file
    MASTER_ROWS.append(df)

    # Save corrected per-warehouse file
    output_file = OUTPUT_DIR / file_path.name
    df.to_excel(output_file, index=False)

    print(f"✔ Recalculated DIFF → {output_file}")

# ======================
# CREATE MASTER FILE
# ======================
if MASTER_ROWS:
    master_df = pd.concat(MASTER_ROWS, ignore_index=True)

    master_file = OUTPUT_DIR / "reconciliation_master.xlsx"
    master_df.to_excel(master_file, index=False)

    print(f"\n✔ Master reconciliation file created: {master_file}")
else:
    print("No returned files found.")
