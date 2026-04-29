import uuid
from sqlalchemy import Column, String, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import enum
from app.database import Base

class DataSetStatus(str, enum.Enum):
    UPLOADED = "UPLOADED"
    PROFILED = "PROFILED"
    CLEANED = "CLEANED"
    ANALYZED = "ANALYZED"
    TRAINED = "TRAINED"

class FileType(str, enum.Enum):
    csv = "csv"
    xlsx = "xlsx"
    parquet = "parquet"

class Dataset(Base):
    __tablename__ = "datasets"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, unique=True, nullable=False)
    file_type = Column(Enum(FileType), nullable=False)
    status = Column(Enum(DataSetStatus), default=DataSetStatus.UPLOADED, nullable=False)
