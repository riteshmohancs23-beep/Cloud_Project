import pandas as pd
from sklearn.ensemble import IsolationForest

def run_cleaning(df: pd.DataFrame) -> dict:
    log = []
    nulls_filled = dupes_removed = outliers_removed = 0
    df = df.copy()

    for col in df.select_dtypes(include="number").columns:
        n = int(df[col].isnull().sum())
        if n > 0:
            df[col] = df[col].fillna(df[col].median())
            nulls_filled += n
            log.append(f"Filled {n} nulls in {col} with median")

    for col in df.select_dtypes(include="object").columns:
        n = int(df[col].isnull().sum())
        if n > 0:
            df[col] = df[col].fillna("Unknown")
            nulls_filled += n
            log.append(f"Filled {n} nulls in {col} with Unknown")

    before = len(df)
    df = df.drop_duplicates()
    dupes_removed = before - len(df)
    if dupes_removed:
        log.append(f"Removed {dupes_removed} duplicate rows")

    numeric_df = df.select_dtypes(include="number")
    if not numeric_df.empty:
        iso = IsolationForest(contamination=0.05, random_state=42)
        mask = iso.fit_predict(numeric_df) == 1
        outliers_removed = int((~mask).sum())
        df = df[mask]
        if outliers_removed:
            log.append(f"Removed {outliers_removed} outliers via IsolationForest")

    return {
        "cleaned_df": df,
        "log": log,
        "nulls_filled": nulls_filled,
        "duplicates_removed": dupes_removed,
        "outliers_removed": outliers_removed,
    }
