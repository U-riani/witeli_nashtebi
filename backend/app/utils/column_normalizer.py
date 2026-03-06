# backend/app/utils/column_normalizer.py

def normalize_columns(df):

    df.columns = (
        df.columns.astype(str)
        .str.strip()
        .str.replace(r"\s+", " ", regex=True)
    )

    return df