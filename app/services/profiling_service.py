from uuid import UUID, uuid4
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.dataset import Dataset, DataSetStatus
from app.models.profiling import ProfilingReport
from app.models.user import User
from app.schemas.profiling import ProfilingResponse
from app.engines.profiling_engine import run_profiling
from app.utils.file_handler import load_dataframe

def profile_dataset(db: Session, dataset_id: UUID, current_user: User) -> ProfilingResponse:
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.owner_id == current_user.id).first()
    if not dataset:
        raise HTTPException(404, "Dataset not found")
    if dataset.status != DataSetStatus.UPLOADED:
        raise HTTPException(400, f"Dataset must be UPLOADED to profile. Current: {dataset.status}")
    df = load_dataframe(dataset.file_path)
    result = run_profiling(df)
    try:
        report = ProfilingReport(id=uuid4(), dataset_id=dataset_id, **result)
        db.add(report)
        dataset.status = DataSetStatus.PROFILED
        db.commit()
        db.refresh(report)
        return ProfilingResponse.model_validate(report)
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Failed to save profiling report: {e}")
