# backend/app/utils/dataframe_helpers.py

import pandas as pd


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