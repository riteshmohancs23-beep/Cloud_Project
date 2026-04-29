from uuid import UUID, uuid4
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.dataset import Dataset, DataSetStatus
from app.models.cleaning import CleaningResult
from app.models.user import User
from app.engines.cleaning_engine import run_cleaning
from app.utils.file_handler import load_dataframe, save_cleaned_df

def clean_dataset(db: Session, dataset_id: UUID, current_user: User) -> dict:
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.owner_id == current_user.id).first()
    if not dataset:
        raise HTTPException(404, "Dataset not found")
    # Allow cleaning if profiled, cleaned, analyzed, or trained
    if dataset.status not in [DataSetStatus.PROFILED, DataSetStatus.CLEANED, DataSetStatus.ANALYZED, DataSetStatus.TRAINED]:
        raise HTTPException(400, f"Dataset must be at least PROFILED before cleaning. Current: {dataset.status}")
    df = load_dataframe(dataset.file_path)
    result = run_cleaning(df)
    cleaned_path = save_cleaned_df(result["cleaned_df"], dataset.file_path)
    try:
        record = CleaningResult(
            id=uuid4(),
            dataset_id=dataset_id,
            cleaned_file_path=cleaned_path,
            nulls_filled=result["nulls_filled"],
            duplicates_removed=result["duplicates_removed"],
            outliers_removed=result["outliers_removed"],
            cleaning_log=result["log"],
        )
        db.add(record)
        dataset.status = DataSetStatus.CLEANED
        db.commit()
        db.refresh(record)
        return {
            "id": str(record.id),
            "dataset_id": str(record.dataset_id),
            "nulls_filled": record.nulls_filled,
            "duplicates_removed": record.duplicates_removed,
            "outliers_removed": record.outliers_removed,
            "cleaning_log": record.cleaning_log,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Failed to save cleaning result: {e}")
