"""Application configuration using pydantic-settings."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ─── Database ──────────────────────────────────────────────────────────
    DATABASE_URL: str = (
        "postgresql+psycopg://hce_user:changeme@localhost:5432/historical_coverage"
    )

    # ─── Server ────────────────────────────────────────────────────────────
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    LOG_LEVEL: str = "INFO"

    # ─── CORS ──────────────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    # ─── App metadata ──────────────────────────────────────────────────────
    APP_NAME: str = "Historical Coverage Explorer"
    APP_VERSION: str = "0.1.0"


settings = Settings()
