import uuid
from sqlalchemy import Column, Float, Integer, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

class ProfilingReport(Base):
    __tablename__ = "profiling_reports"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="CASCADE"), unique=True, nullable=False)
    row_count = Column(Integer)
    col_count = Column(Integer)
    missing_cells = Column(Integer)
    missing_cells_pct = Column(Float)
    duplicate_rows = Column(Integer)
    duplicate_rows_pct = Column(Float)
    numeric_cols = Column(Integer)
    categorical_cols = Column(Integer)
    datetime_cols = Column(Integer)
    column_details = Column(JSON)
