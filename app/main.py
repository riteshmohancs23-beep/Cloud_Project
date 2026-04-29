from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine
from app.models import *  # noqa: F401,F403 — registers all models with Base
from app.database import Base
from app.routers import auth, datasets, profiling, cleaning, analytics, ml

@asynccontextmanager
async def lifespan(app: FastAPI):
    for d in [settings.UPLOAD_DIR, settings.CLEANED_DIR, settings.MODELS_DIR]:
        Path(d).mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://cloud-project-3d6.pages.dev", # Placeholder: replace with your actual Cloudflare Pages URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(auth.router, prefix="/auth")
app.include_router(datasets.router, prefix="/datasets")
app.include_router(profiling.router, prefix="/datasets")
app.include_router(cleaning.router, prefix="/datasets")
app.include_router(analytics.router, prefix="/datasets")
app.include_router(ml.router, prefix="/datasets")
