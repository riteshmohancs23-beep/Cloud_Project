import uuid
from sqlalchemy import Column, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

class AnalyticsResult(Base):
    __tablename__ = "analytics_results"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="CASCADE"), unique=True, nullable=False)
    numeric_summary = Column(JSON)
    correlation_matrix = Column(JSON)
    skewness = Column(JSON)
    high_cardinality_cols = Column(JSON)
