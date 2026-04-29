import pandas as pd

def run_profiling(df: pd.DataFrame) -> dict:
    total_cells = df.shape[0] * df.shape[1]
    missing = int(df.isnull().sum().sum())
    dupes = int(df.duplicated().sum())
    numeric = df.select_dtypes(include="number")
    categorical = df.select_dtypes(include="object")
    datetime_cols = df.select_dtypes(include="datetime")

    column_details = {}
    for col in df.columns:
        details = {
            "dtype": str(df[col].dtype),
            "missing_count": int(df[col].isnull().sum()),
            "missing_pct": round(df[col].isnull().mean() * 100, 2),
            "unique_count": int(df[col].nunique()),
        }
        if col in numeric.columns:
            details.update({
                "mean": float(df[col].mean()),
                "std": float(df[col].std()),
                "min": float(df[col].min()),
                "max": float(df[col].max()),
            })
        column_details[col] = details

    return {
        "row_count": len(df),
        "col_count": len(df.columns),
        "missing_cells": missing,
        "missing_cells_pct": round(missing / total_cells * 100, 2) if total_cells else 0,
        "duplicate_rows": dupes,
        "duplicate_rows_pct": round(dupes / len(df) * 100, 2) if len(df) else 0,
        "numeric_cols": len(numeric.columns),
        "categorical_cols": len(categorical.columns),
        "datetime_cols": len(datetime_cols.columns),
        "column_details": column_details,
    }
