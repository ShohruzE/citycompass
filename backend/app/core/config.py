from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import secrets


class Settings(BaseSettings):
    database_url: str

    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    MICROSOFT_CLIENT_ID: str
    MICROSOFT_CLIENT_SECRET: str
    ACS_API_KEY: str

    # document further
    SECRET_KEY: str = secrets.token_hex(32)
    # To read env variables from .env file
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


@lru_cache
def get_settings():
    return Settings()
