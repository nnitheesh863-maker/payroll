"""
Application configuration using pydantic-settings.
All values are loaded from environment variables / .env file.
"""

from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env", override=True)


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────
    PROJECT_NAME: str = "PeoplePay360"
    API_PREFIX: str = "/api"

    # ── Database ─────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/peoplepay360"


settings = Settings()
