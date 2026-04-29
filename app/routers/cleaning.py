from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.utils.deps import get_current_user
from app.services.cleaning_service import clean_dataset

router = APIRouter(tags=["cleaning"])

@router.post("/{dataset_id}/clean")
def clean(dataset_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return clean_dataset(db, dataset_id, current_user)
