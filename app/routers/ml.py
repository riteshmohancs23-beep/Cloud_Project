from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.dataset import Dataset
from app.models.ml_model import MLModel, ModelResult
from app.models.cleaning import CleaningResult
from app.utils.deps import get_current_user
from app.utils.file_handler import load_dataframe
from app.schemas.ml_model import MLTrainRequest, MLTrainResponse
from app.services.ml_service import train_model
import joblib
import pandas as pd
from sklearn.preprocessing import LabelEncoder

router = APIRouter(tags=["ml"])


@router.post("/{dataset_id}/ml/train", response_model=MLTrainResponse)
def train(dataset_id: UUID, req: MLTrainRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return train_model(db, dataset_id, req, current_user)


@router.get("/{dataset_id}/ml/model")
def get_model_info(dataset_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.owner_id == current_user.id).first()
    if not dataset:
        raise HTTPException(404, "Dataset not found")
    ml_model = db.query(MLModel).filter(MLModel.dataset_id == dataset_id).order_by(MLModel.id.desc()).first()
    if not ml_model:
        raise HTTPException(404, "No trained model found for this dataset")
    result = db.query(ModelResult).filter(ModelResult.model_id == ml_model.id).first()
    return {
        "model_id": str(ml_model.id),
        "target_column": ml_model.target_column,
        "task_type": ml_model.task_type,
        "model_type": ml_model.model_type,
        "metrics": {
            "accuracy": result.accuracy, "precision": result.precision,
            "recall": result.recall, "f1": result.f1,
            "mae": result.mae, "mse": result.mse, "r2": result.r2,
        } if result else {},
        "selected_features": ml_model.selected_features,
    }


@router.post("/{dataset_id}/ml/predict")
def predict(dataset_id: UUID, inputs: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.owner_id == current_user.id).first()
    if not dataset:
        raise HTTPException(404, "Dataset not found")
    ml_model = db.query(MLModel).filter(MLModel.dataset_id == dataset_id).order_by(MLModel.id.desc()).first()
    if not ml_model:
        raise HTTPException(404, "No trained model found")

    cleaning = db.query(CleaningResult).filter(CleaningResult.dataset_id == dataset_id).first()
    df = load_dataframe(cleaning.cleaned_file_path)

    # Build encoders from full training data (same as ml_engine does)
    encoders = {}
    for col in df.select_dtypes(include="object").columns:
        le = LabelEncoder()
        le.fit(df[col].astype(str))
        encoders[col] = le
    
    # Also encode target if classification (matches new ml_engine logic)
    if ml_model.task_type == "classification" and ml_model.target_column not in encoders:
        le = LabelEncoder()
        le.fit(df[ml_model.target_column].astype(str))
        encoders[ml_model.target_column] = le

    # Apply encoding to full df to get the exact feature columns used during training
    df_encoded = df.copy()
    for col, le in encoders.items():
        df_encoded[col] = le.transform(df_encoded[col].astype(str))

    # Feature columns = the ones selected during training (default to all if not present)
    feature_cols = ml_model.selected_features
    
    if not feature_cols:
        # Fallback to older behavior if selected_features is missing
        feature_cols = df_encoded.drop(columns=[ml_model.target_column]).columns.tolist()

    if not feature_cols:
        raise HTTPException(400, "No feature columns found in training data")

    # Encode the user's input row using the same encoders
    row = {}
    for col in feature_cols:
        val = inputs.get(col, "")
        if col in encoders:
            try:
                row[col] = int(encoders[col].transform([str(val)])[0])
            except ValueError:
                row[col] = 0  # unseen label — default to 0
        else:
            try:
                row[col] = float(val)
            except (ValueError, TypeError):
                row[col] = 0

    input_df = pd.DataFrame([row])[feature_cols]

    model = joblib.load(ml_model.model_file_path)
    print(f"DEBUG: input_df columns={input_df.columns.tolist()}")
    prediction = model.predict(input_df)[0]

    # Decode prediction back to original label if target was categorical
    if ml_model.target_column in encoders:
        try:
            prediction = encoders[ml_model.target_column].inverse_transform([int(prediction)])[0]
        except Exception:
            pass

    return {"prediction": str(prediction)}
