"""Application settings loaded from the environment (12-factor)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database / cache
    database_url: str = "postgresql+asyncpg://agrichain:agrichain@localhost:5432/agrichain"
    redis_url: str = "redis://localhost:6379/0"

    # Auth
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_ttl_min: int = 4320
    otp_ttl_seconds: int = 300
    otp_pepper: str = "change-me-too"

    # LLM — narration only. All numbers are computed deterministically.
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # HTTP
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    environment: str = "development"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
