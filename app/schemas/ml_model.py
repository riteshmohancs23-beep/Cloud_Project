from pydantic import BaseModel
from uuid import UUID
from typing import Any, Optional
from app.models.ml_model import TaskType, ModelType

class MLTrainRequest(BaseModel):
    target_column: str
    task_type: TaskType
    model_type: ModelType
    use_pca: bool = False
    n_components: Optional[int] = 2

class MLTrainResponse(BaseModel):
    model_id: UUID
    dataset_id: UUID
    task_type: TaskType
    model_type: ModelType
    target_column: str
    metrics: dict[str, Any]
