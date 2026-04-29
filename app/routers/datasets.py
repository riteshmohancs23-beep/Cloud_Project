from uuid import UUID
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.utils.deps import get_current_user
from app.schemas.dataset import DatasetResponse, DatasetListResponse
from app.services.dataset_service import upload_dataset, list_datasets, get_dataset_by_id

router = APIRouter(tags=["datasets"])

@router.post("/upload", response_model=DatasetResponse, status_code=201)
def upload(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return upload_dataset(db, file, current_user)

@router.get("/", response_model=DatasetListResponse)
def list_all(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return list_datasets(db, current_user)

@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_one(dataset_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return DatasetResponse.model_validate(get_dataset_by_id(db, dataset_id, current_user))

@router.get("/{dataset_id}/sample")
def get_sample(dataset_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.models.dataset import Dataset
    from app.models.cleaning import CleaningResult
    from app.utils.file_handler import load_dataframe
    from fastapi import HTTPException
    
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.owner_id == current_user.id).first()
    if not dataset:
        raise HTTPException(404, "Dataset not found")
    
    cleaning = db.query(CleaningResult).filter(CleaningResult.dataset_id == dataset_id).first()
    if not cleaning:
        raise HTTPException(400, "Dataset not cleaned yet")
        
    df = load_dataframe(cleaning.cleaned_file_path)
    sample = df.sample(min(10, len(df))).to_dict(orient="records")
    return sample
