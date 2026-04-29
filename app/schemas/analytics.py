from pydantic import BaseModel
from uuid import UUID
from typing import Any

class AnalyticsResponse(BaseModel):
    id: UUID
    dataset_id: UUID
    numeric_summary: dict[str, Any]
    correlation_matrix: dict[str, Any]
    skewness: dict[str, Any]
    high_cardinality_cols: list[str]
    model_config = {"from_attributes": True}
