from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    UPLOAD_DIR: str = "storage/uploads"
    CLEANED_DIR: str = "storage/cleaned"
    MODELS_DIR: str = "storage/models"
    PROJECT_NAME: str = "DataFlow"

    @property
    def sqlalchemy_database_url(self) -> str:
        if self.DATABASE_URL.startswith("postgres://"):
            return self.DATABASE_URL.replace("postgres://", "postgresql://", 1)
        return self.DATABASE_URL

    class Config:
        env_file = ".env"

settings = Settings()
