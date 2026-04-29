import uuid
from pathlib import Path
import pandas as pd
from fastapi import UploadFile
from app.config import settings

def save_upload_file(file: UploadFile) -> tuple[str, str]:
    ext = Path(file.filename).suffix.lstrip(".").lower()
    safe_name = f"{uuid.uuid4()}_{file.filename}"
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    dest = upload_dir / safe_name
    content = file.file.read()
    print(f"DEBUG: Saving upload to {dest} (Size: {len(content)} bytes)")
    dest.write_bytes(content)
    return str(dest), ext

def load_dataframe(path: str) -> pd.DataFrame:
    p = Path(path)
    ext = p.suffix.lstrip(".")
    if ext == "csv":
        return pd.read_csv(p)
    elif ext == "xlsx":
        return pd.read_excel(p)
    elif ext == "parquet":
        return pd.read_parquet(p)
    raise ValueError(f"Unsupported file type: {ext}")

def save_cleaned_df(df: pd.DataFrame, original_path: str) -> str:
    name = Path(original_path).stem + "_cleaned.csv"
    dest = Path(settings.CLEANED_DIR) / name
    df.to_csv(dest, index=False)
    return str(dest)
