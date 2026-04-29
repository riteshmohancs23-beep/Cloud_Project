import pandas as pd
from app.utils.json_helper import sanitize_json_data

def run_analytics(df: pd.DataFrame) -> dict:
    numeric = df.select_dtypes(include="number")
    categorical = df.select_dtypes(include="object")
    high_card = [c for c in categorical.columns if df[c].nunique() > 50]
    
    if numeric.empty:
        res = {
            "numeric_summary": {},
            "correlation_matrix": {},
            "skewness": {},
            "high_cardinality_cols": high_card,
        }
    else:
        res = {
            "numeric_summary": numeric.describe().to_dict(),
            "correlation_matrix": numeric.corr().to_dict(),
            "skewness": numeric.skew().to_dict(),
            "high_cardinality_cols": high_card,
        }
    
    return sanitize_json_data(res)
