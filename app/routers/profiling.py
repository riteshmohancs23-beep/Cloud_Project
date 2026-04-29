from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.utils.deps import get_current_user
from app.schemas.profiling import ProfilingResponse
from app.services.profiling_service import profile_dataset

router = APIRouter(tags=["profiling"])

@router.post("/{dataset_id}/profile", response_model=ProfilingResponse)
def profile(dataset_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return profile_dataset(db, dataset_id, current_user)
