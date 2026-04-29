import uuid
from sqlalchemy import Column, String, Float, Enum, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
import enum
from app.database import Base

class TaskType(str, enum.Enum):
    classification = "classification"
    regression = "regression"

class ModelType(str, enum.Enum):
    logistic_regression = "logistic_regression"
    linear_regression = "linear_regression"
    random_forest = "random_forest"

class MLModel(Base):
    __tablename__ = "ml_models"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    target_column = Column(String, nullable=False)
    task_type = Column(Enum(TaskType), nullable=False)
    model_type = Column(Enum(ModelType), nullable=False)
    model_file_path = Column(String)
    selected_features = Column(JSON, nullable=True)

class ModelResult(Base):
    __tablename__ = "model_results"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_id = Column(UUID(as_uuid=True), ForeignKey("ml_models.id", ondelete="CASCADE"), nullable=False)
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1 = Column(Float, nullable=True)
    mae = Column(Float, nullable=True)
    mse = Column(Float, nullable=True)
    r2 = Column(Float, nullable=True)
