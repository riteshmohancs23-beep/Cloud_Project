import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

class CleaningResult(Base):
    __tablename__ = "cleaning_results"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="CASCADE"), unique=True, nullable=False)
    cleaned_file_path = Column(String, nullable=False)
    nulls_filled = Column(Integer)
    duplicates_removed = Column(Integer)
    outliers_removed = Column(Integer)
    cleaning_log = Column(JSON)
