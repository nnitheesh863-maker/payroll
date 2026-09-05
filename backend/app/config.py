"""
Application configuration using pydantic-settings.
All values are loaded from environment variables / .env file.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    # ── Application ──────────────────────────────────────────────
    PROJECT_NAME: str = "PeoplePay360"
    API_PREFIX: str = "/api"

    # ── Database ─────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/peoplepay360"


settings = Settings()
