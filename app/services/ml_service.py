from uuid import UUID, uuid4
from pathlib import Path
import joblib
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.dataset import Dataset, DataSetStatus
from app.models.cleaning import CleaningResult
from app.models.ml_model import MLModel, ModelResult
from app.models.user import User
from app.schemas.ml_model import MLTrainRequest, MLTrainResponse
from app.engines.ml_engine import run_ml
from app.utils.file_handler import load_dataframe
from app.config import settings

def train_model(db: Session, dataset_id: UUID, req: MLTrainRequest, current_user: User) -> MLTrainResponse:
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.owner_id == current_user.id).first()
    if not dataset:
        raise HTTPException(404, "Dataset not found")
    if dataset.status not in [DataSetStatus.ANALYZED, DataSetStatus.TRAINED]:
        raise HTTPException(400, "Dataset must be at least ANALYZED before training")
    cleaning = db.query(CleaningResult).filter(CleaningResult.dataset_id == dataset_id).first()
    df = load_dataframe(cleaning.cleaned_file_path)
    result = run_ml(
        df, 
        req.target_column, 
        req.task_type.value, 
        req.model_type.value,
        use_pca=req.use_pca,
        n_components=req.n_components or 2
    )
    print(f"DEBUG: selected_features={result.get('selected_features')}")
    model_id = uuid4()
    model_path = str(Path(settings.MODELS_DIR) / f"{model_id}.pkl")
    joblib.dump(result["model"], model_path)
    try:
        ml_model = MLModel(
            id=model_id,
            dataset_id=dataset_id,
            target_column=req.target_column,
            task_type=req.task_type,
            model_type=req.model_type,
            model_file_path=model_path,
            selected_features=result["selected_features"],
        )
        db.add(ml_model)
        metrics = result["metrics"]
        model_result = ModelResult(
            id=uuid4(),
            model_id=model_id,
            accuracy=metrics.get("accuracy"),
            precision=metrics.get("precision"),
            recall=metrics.get("recall"),
            f1=metrics.get("f1"),
            mae=metrics.get("mae"),
            mse=metrics.get("mse"),
            r2=metrics.get("r2"),
        )
        db.add(model_result)
        dataset.status = DataSetStatus.TRAINED
        db.commit()
        return MLTrainResponse(
            model_id=model_id,
            dataset_id=dataset_id,
            task_type=req.task_type,
            model_type=req.model_type,
            target_column=req.target_column,
            metrics=metrics,
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Failed to save ML model: {e}")
