from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.db_url import normalize_database_url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env", "../../.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ─── Database ──────────────────────────────────────────────────────────
    # DATABASE_URL must be provided via environment variable or .env file.
    DATABASE_URL: str
    DATABASE_URL_UNPOOLED: str | None = None

    @field_validator("DATABASE_URL", mode="after")
    @classmethod
    def validate_and_normalize_database_url(cls, v: str) -> str:
        return normalize_database_url(v) or v

    @field_validator("DATABASE_URL_UNPOOLED", mode="after")
    @classmethod
    def validate_and_normalize_unpooled_url(cls, v: str | None) -> str | None:
        if v:
            return normalize_database_url(v)
        return v

    # ─── Environment & Runtime ─────────────────────────────────────────────
    ENVIRONMENT: str = "development"
    VERCEL: str | None = None
    VERCEL_ENV: str | None = None
    DEMO_RESET_ENABLED: bool = True

    @property
    def is_serverless(self) -> bool:
        """Determines if the application is running in an ephemeral serverless environment."""
        return bool(self.VERCEL) or self.ENVIRONMENT == "production" or bool(self.VERCEL_ENV)

    # ─── Server ────────────────────────────────────────────────────────────
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    LOG_LEVEL: str = "INFO"

    # ─── CORS ──────────────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
    ]

    # ─── App metadata ──────────────────────────────────────────────────────
    APP_NAME: str = "Historical Coverage Explorer"
    APP_VERSION: str = "0.1.0"


settings = Settings()
