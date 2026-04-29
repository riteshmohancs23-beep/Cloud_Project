from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.dataset import Dataset
from app.models.profiling import ProfilingReport
from app.models.cleaning import CleaningResult
from app.models.analytics import AnalyticsResult
from app.utils.deps import get_current_user
from app.utils.file_handler import load_dataframe
from app.schemas.analytics import AnalyticsResponse
from app.services.analytics_service import analyze_dataset
from sklearn.ensemble import IsolationForest
import pandas as pd

router = APIRouter(tags=["analytics"])


@router.post("/{dataset_id}/analyze", response_model=AnalyticsResponse)
def analyze(dataset_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return analyze_dataset(db, dataset_id, current_user)


@router.get("/{dataset_id}/analytics")
def get_analytics(dataset_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.owner_id == current_user.id).first()
    if not dataset:
        raise HTTPException(404, "Dataset not found")

    profiling = db.query(ProfilingReport).filter(ProfilingReport.dataset_id == dataset_id).first()
    cleaning  = db.query(CleaningResult).filter(CleaningResult.dataset_id == dataset_id).first()
    analytics = db.query(AnalyticsResult).filter(AnalyticsResult.dataset_id == dataset_id).first()

    # --- Raw dataset stats (from profiling report) ---
    raw_stats = None
    if profiling:
        raw_stats = {
            "row_count":        profiling.row_count,
            "col_count":        profiling.col_count,
            "missing_cells":    profiling.missing_cells,
            "missing_cells_pct": profiling.missing_cells_pct,
            "duplicate_rows":   profiling.duplicate_rows,
            "duplicate_rows_pct": profiling.duplicate_rows_pct,
            "numeric_cols":     profiling.numeric_cols,
            "categorical_cols": profiling.categorical_cols,
            "datetime_cols":    profiling.datetime_cols,
            "column_details":   profiling.column_details,
        }

    # --- Cleaned dataset stats (computed live from cleaned file) ---
    cleaned_stats = None
    outlier_details = None
    value_counts = {}

    if cleaning:
        df_raw  = load_dataframe(dataset.file_path)
        df_clean = load_dataframe(cleaning.cleaned_file_path)

        # Per-column missing comparison
        missing_comparison = {}
        for col in df_raw.columns:
            missing_comparison[col] = {
                "raw_missing":     int(df_raw[col].isnull().sum()),
                "raw_missing_pct": round(df_raw[col].isnull().mean() * 100, 2),
                "clean_missing":   int(df_clean[col].isnull().sum()) if col in df_clean.columns else 0,
            }

        # Outlier detection on raw numeric columns
        numeric_raw = df_raw.select_dtypes(include="number")
        outlier_counts = {}
        if not numeric_raw.empty:
            iso = IsolationForest(contamination=0.05, random_state=42)
            mask = iso.fit_predict(numeric_raw.fillna(numeric_raw.median())) == -1
            for col in numeric_raw.columns:
                outlier_counts[col] = int(mask.sum())

        outlier_details = {
            "total_outliers_removed": cleaning.outliers_removed,
            "per_column_estimate":    outlier_counts,
        }

        cleaned_stats = {
            "row_count":           len(df_clean),
            "col_count":           len(df_clean.columns),
            "missing_cells":       int(df_clean.isnull().sum().sum()),
            "nulls_filled":        cleaning.nulls_filled,
            "duplicates_removed":  cleaning.duplicates_removed,
            "outliers_removed":    cleaning.outliers_removed,
            "cleaning_log":        cleaning.cleaning_log,
            "missing_comparison":  missing_comparison,
        }

        # Value counts for categorical columns (top 10 per col)
        for col in df_clean.select_dtypes(include="object").columns:
            vc = df_clean[col].value_counts().head(10)
            value_counts[col] = {"labels": vc.index.tolist(), "values": vc.values.tolist()}

        # Numeric distributions for cleaned data (histogram bins)
        numeric_distributions = {}
        for col in df_clean.select_dtypes(include="number").columns:
            counts, bin_edges = pd.cut(df_clean[col].dropna(), bins=10, retbins=True)
            freq = counts.value_counts(sort=False)
            numeric_distributions[col] = {
                "bins":   [round(float(b), 3) for b in bin_edges[:-1]],
                "counts": [int(v) for v in freq.values],
            }

        cleaned_stats["numeric_distributions"] = numeric_distributions

    return {
        "raw_stats":      raw_stats,
        "cleaned_stats":  cleaned_stats,
        "outlier_details": outlier_details,
        "value_counts":   value_counts,
        "analytics": {
            "numeric_summary":    analytics.numeric_summary,
            "correlation_matrix": analytics.correlation_matrix,
            "skewness":           analytics.skewness,
            "high_cardinality_cols": analytics.high_cardinality_cols,
        } if analytics else None,
    }
