# backend/app/api/auto_align_routes.py

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import pandas as pd
import io
import requests

router = APIRouter()


@router.post("/auto-align")
async def auto_align(data: dict):

    file_url = data["fileUrl"]

    response = requests.get(file_url)

    if response.status_code != 200:
        raise Exception("Failed to download file")

    df = pd.read_excel(io.BytesIO(response.content))

    # normalize numeric columns
    df["რეალური ნაშთი"] = pd.to_numeric(df["რეალური ნაშთი"], errors="coerce")
    df["ნაშთი-APEX"] = pd.to_numeric(df["ნაშთი-APEX"], errors="coerce")
    df["წითელი ნაშთი"] = pd.to_numeric(df["წითელი ნაშთი"], errors="coerce")

    # remove separator rows
    df = df[df["შიდა კოდი"].notna()]

    result_rows = []

    print("TOTAL ROWS:", len(df))

    # ----------------------------------------
    # Process per article
    # ----------------------------------------

    for article, group in df.groupby("შიდა კოდი"):

        print("ARTICLE:", article)

        # --------------------------------
        # find priority barcode (red row)
        # --------------------------------

        red_rows = group[group["წითელი ნაშთი"].notna()]

        if red_rows.empty:
            continue

        red_row = red_rows.iloc[0]

        priority_barcode = red_row["შტრიხკოდი"]
        red_qty = int(red_row["წითელი ნაშთი"])

        print("PRIORITY BARCODE:", priority_barcode)
        print("RED QTY:", red_qty)

        remaining = red_qty

        # --------------------------------
        # find rows with surplus stock
        # --------------------------------

        for _, row in group.iterrows():

            if remaining <= 0:
                break

            real = row["რეალური ნაშთი"]
            apex = row["ნაშთი-APEX"]

            if pd.isna(real) or pd.isna(apex):
                continue

            diff = apex - real

            # APEX bigger than real → stock available
            if diff > 0:

                take = min(int(diff), remaining)

                result_rows.append({
                    "ჩამოსაწერი შტრიხკოდი": row["შტრიხკოდი"],
                    "ჩამოსაწერი რაოდენობა": take,
                    "მისაღები შტრიხკოდი": priority_barcode,
                    "მისაღები რაოდენობა": take
                })

                remaining -= take

    result_df = pd.DataFrame(result_rows)

    if result_df.empty:
        result_df = pd.DataFrame(columns=[
            "ჩამოსაწერი შტრიხკოდი",
            "ჩამოსაწერი რაოდენობა",
            "მისაღები შტრიხკოდი",
            "მისაღები რაოდენობა",
        ])

    output = io.BytesIO()

    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        result_df.to_excel(writer, index=False)

    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": "attachment; filename=auto_align.xlsx"
        },
    )