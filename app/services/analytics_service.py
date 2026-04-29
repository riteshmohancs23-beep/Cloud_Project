from uuid import UUID, uuid4
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.dataset import Dataset, DataSetStatus
from app.models.cleaning import CleaningResult
from app.models.analytics import AnalyticsResult
from app.models.user import User
from app.schemas.analytics import AnalyticsResponse
from app.engines.analytics_engine import run_analytics
from app.utils.file_handler import load_dataframe

def analyze_dataset(db: Session, dataset_id: UUID, current_user: User) -> AnalyticsResponse:
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.owner_id == current_user.id).first()
    if not dataset:
        raise HTTPException(404, "Dataset not found")
    if dataset.status not in [DataSetStatus.CLEANED, DataSetStatus.ANALYZED, DataSetStatus.TRAINED]:
        raise HTTPException(400, "Dataset must be at least CLEANED before analyzing")
    cleaning = db.query(CleaningResult).filter(CleaningResult.dataset_id == dataset_id).first()
    df = load_dataframe(cleaning.cleaned_file_path)
    result = run_analytics(df)
    try:
        record = AnalyticsResult(id=uuid4(), dataset_id=dataset_id, **result)
        db.add(record)
        dataset.status = DataSetStatus.ANALYZED
        db.commit()
        db.refresh(record)
        return AnalyticsResponse.model_validate(record)
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Failed to save analytics result: {e}")
