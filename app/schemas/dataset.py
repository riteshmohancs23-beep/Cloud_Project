from pydantic import BaseModel
from uuid import UUID
from app.models.dataset import DataSetStatus, FileType

class DatasetResponse(BaseModel):
    id: UUID
    filename: str
    file_type: FileType
    status: DataSetStatus
    model_config = {"from_attributes": True}

class DatasetListResponse(BaseModel):
    datasets: list[DatasetResponse]
