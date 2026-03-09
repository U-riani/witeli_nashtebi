# backend/app/utils/dataframe_helpers.py

import pandas as pd


def force_string(df, cols):

    for c in cols:
        if c in df.columns:

            def convert(val):

                if pd.isna(val):
                    return ""

                # remove .0 from floats like 1973398.0
                if isinstance(val, float) and val.is_integer():
                    return str(int(val))

                return str(val).strip()

            df[c] = df[c].apply(convert)

    return df


def force_numeric(df, cols):

    for c in cols:
        if c in df.columns:
            df[c] = pd.to_numeric(
                df[c].astype(str).str.replace(",", ".").str.strip(),
                errors="coerce"
            )

    return df