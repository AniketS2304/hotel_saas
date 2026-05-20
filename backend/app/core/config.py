from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = Field(..., description="Async PostgreSQL connection string")
    SECRET_KEY: str = Field(..., description="JWT signing secret key")
    ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, description="Access token TTL in minutes")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, description="Refresh token TTL in days")

    # Cloudinary is optional for MVP — image upload endpoint returns 503 if not configured
    CLOUDINARY_CLOUD_NAME: Optional[str] = Field(default=None, description="Cloudinary cloud name")
    CLOUDINARY_API_KEY: Optional[str] = Field(default=None, description="Cloudinary API key")
    CLOUDINARY_API_SECRET: Optional[str] = Field(default=None, description="Cloudinary API secret")

    FRONTEND_URL: str = Field(default="http://localhost:5173", description="Frontend origin for CORS")
    BASE_URL: str = Field(default="http://localhost:5173", description="Base URL for QR links")

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
