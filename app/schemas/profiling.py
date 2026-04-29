from pydantic import BaseModel
from uuid import UUID
from typing import Any

class ProfilingResponse(BaseModel):
    id: UUID
    dataset_id: UUID
    row_count: int
    col_count: int
    missing_cells: int
    missing_cells_pct: float
    duplicate_rows: int
    duplicate_rows_pct: float
    numeric_cols: int
    categorical_cols: int
    datetime_cols: int
    column_details: dict[str, Any]
    model_config = {"from_attributes": True}
