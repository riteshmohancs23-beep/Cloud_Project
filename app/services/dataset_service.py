from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from app.models.dataset import Dataset, DataSetStatus, FileType
from app.models.user import User
from app.schemas.dataset import DatasetResponse, DatasetListResponse
from app.utils.file_handler import save_upload_file

ALLOWED_EXTENSIONS = {"csv", "xlsx", "parquet"}

def upload_dataset(db: Session, file: UploadFile, current_user: User) -> DatasetResponse:
    file_path, ext = save_upload_file(file)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(422, f"Unsupported file type: {ext}")
    dataset = Dataset(
        owner_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        file_type=FileType(ext),
        status=DataSetStatus.UPLOADED,
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    return DatasetResponse.model_validate(dataset)

def list_datasets(db: Session, current_user: User) -> DatasetListResponse:
    datasets = db.query(Dataset).filter(Dataset.owner_id == current_user.id).all()
    return DatasetListResponse(datasets=[DatasetResponse.model_validate(d) for d in datasets])

def get_dataset_by_id(db: Session, dataset_id: UUID, current_user: User) -> Dataset:
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.owner_id == current_user.id).first()
    if not dataset:
        raise HTTPException(404, "Dataset not found")
    return dataset
