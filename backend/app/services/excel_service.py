# backend/app/services/excel_service.py

import pandas as pd

def read_excel(file_bytes):
    return pd.read_excel(file_bytes)