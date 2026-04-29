from pydantic import BaseModel, ConfigDict
from uuid import UUID
from typing import Any, Optional
from app.models.ml_model import TaskType, ModelType

class MLTrainRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    target_column: str
    task_type: TaskType
    model_type: ModelType
    use_pca: bool = False
    n_components: Optional[int] = 2

class MLTrainResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    model_id: UUID
    dataset_id: UUID
    task_type: TaskType
    model_type: ModelType
    target_column: str
    metrics: dict[str, Any]
