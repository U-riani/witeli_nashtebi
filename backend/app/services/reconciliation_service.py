# backend/app/services/reconciliation_service.py

import pandas as pd
from io import BytesIO

from app.utils.column_normalizer import normalize_columns
from app.utils.dataframe_helpers import force_string, force_numeric


def safe_get(row, col):
    if col in row:
        return row[col]
    return ""


async def process_inventory(witeli_file, cnobari_file, live_file):

    # --------------------------------------------------
    # Read uploaded files
    # --------------------------------------------------

    witeli_bytes = await witeli_file.read()
    cnobari_bytes = await cnobari_file.read()
    live_bytes = await live_file.read()

    witeli_df = pd.read_excel(BytesIO(witeli_bytes))
    cnobari_df = pd.read_excel(BytesIO(cnobari_bytes))
    live_df = pd.read_excel(BytesIO(live_bytes))

    # --------------------------------------------------
    # Normalize column names
    # --------------------------------------------------

    witeli_df = normalize_columns(witeli_df)
    cnobari_df = normalize_columns(cnobari_df)
    live_df = normalize_columns(live_df)

    # --------------------------------------------------
    # Force types
    # --------------------------------------------------

    live_df = force_string(live_df, ["შტრიხკოდი", "შიდა კოდი"])
    witeli_df = force_string(witeli_df, ["შტრიხკოდი"])
    cnobari_df = force_string(cnobari_df, ["შტრიხკოდი", "შიდა კოდი"])

    live_df = force_numeric(live_df, ["live ნაშთი"])
    witeli_df = force_numeric(witeli_df, ["რაოდენობა"])

    # extract reconciliation date


    recon_warehouse = witeli_df["საწყობის დასახელება"].iloc[0][10:] if "საწყობის დასახელება" in witeli_df.columns else ""

    # --------------------------------------------------
    # Aggregate red stock (IMPORTANT FIX)
    # --------------------------------------------------

    witeli_df = (
        witeli_df
        .groupby("შტრიხკოდი", as_index=False)
        .agg({
            "რაოდენობა": "sum",
            "თარიღი": "first"
        })
    )

    # --------------------------------------------------
    # Lookup tables
    # --------------------------------------------------

    cnobari_barcode_lookup = (
        cnobari_df
        .drop_duplicates("შტრიხკოდი")
        .set_index("შტრიხკოდი")
    )

    live_barcode_lookup = (
        live_df
        .drop_duplicates("შტრიხკოდი")
        .set_index("შტრიხკოდი")
    )

    rows = []
    processed_articles = set()

    # --------------------------------------------------
    # Main Logic
    # --------------------------------------------------

    for _, witeli_row in witeli_df.iterrows():
        # date for this barcode
        row_date = ""

        if "თარიღი" in witeli_df.columns and pd.notna(witeli_row.get("თარიღი")):
            d = pd.to_datetime(witeli_row["თარიღი"])
            row_date = f"{d.day}/{d.month}/{d.year}"

        witeli_barcode = witeli_row["შტრიხკოდი"]

        if witeli_barcode not in cnobari_barcode_lookup.index:
            continue

        # --------------------------------------------------
        # Get article code
        # --------------------------------------------------

        cn_row = cnobari_barcode_lookup.loc[witeli_barcode]
        article = str(cn_row["შიდა კოდი"]).strip()

        # --------------------------------------------------
        # Prevent duplicate article generation
        # --------------------------------------------------

        if article in processed_articles:
            continue

        processed_articles.add(article)

        # --------------------------------------------------
        # Get ALL rows of this article
        # --------------------------------------------------

        article_rows = cnobari_df[
            cnobari_df["შიდა კოდი"] == article
        ].copy()

        article_rows = article_rows.sort_values(["ფერი", "ზომა"])

        # --------------------------------------------------
        # Move red barcode to the top
        # --------------------------------------------------

        if witeli_barcode in article_rows["შტრიხკოდი"].values:

            witeli_part = article_rows[
                article_rows["შტრიხკოდი"] == witeli_barcode
            ]

            other_part = article_rows[
                article_rows["შტრიხკოდი"] != witeli_barcode
            ]

            article_rows = pd.concat([witeli_part, other_part])

        # --------------------------------------------------
        # Generate rows
        # --------------------------------------------------

        for _, row in article_rows.iterrows():

            bc = row["შტრიხკოდი"]

            if bc in live_barcode_lookup.index:
                live_stock = live_barcode_lookup.loc[bc].get("live ნაშთი", "")
            else:
                live_stock = ""

            result_row = {
                "თარიღი": row_date,
                "საწყობი": recon_warehouse,
                "შტრიხკოდი": bc,
                "შიდა კოდი": article,

                "საქონელი": safe_get(row, "დასახელება"),
                "კატეგორია": safe_get(row, "კატეგორია"),

                "ტიპი": safe_get(row, "ტიპი"),
                "ზომა": safe_get(row, "ზომა"),
                "ფერი": safe_get(row, "ფერი"),

                "სქესი": safe_get(row, "სქესი"),
                "საცალო ფასი": safe_get(row, "ფასი"),

                "ნაშთი-APEX": live_stock,

                "წითელი ნაშთი":
                    witeli_row["რაოდენობა"]
                    if bc == witeli_barcode else "",

                "რეალური ნაშთი": "",
                "DIFF": "",
            }

            rows.append(result_row)

        # --------------------------------------------------
        # Separator row
        # --------------------------------------------------

        rows.append({
            "შტრიხკოდი": "",
            "შიდა კოდი": "",
            "საქონელი": "",
            "კატეგორია": "",
            "ტიპი": "",
            "ზომა": "",
            "ფერი": "",
            "სქესი": "",
            "საცალო ფასი": "",
            "ნაშთი-APEX": "",
            "წითელი ნაშთი": "",
            "რეალური ნაშთი": "",
            "DIFF": "",
        })

    result_df = pd.DataFrame(rows)

    # --------------------------------------------------
    # Generate Excel
    # --------------------------------------------------

    output = BytesIO()

    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        result_df.to_excel(writer, index=False)

    output.seek(0)

    return output