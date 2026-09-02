from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    supabase_url: str = "https://placeholder-project.supabase.co"
    supabase_key: str = "placeholder-anon-key"
    jwt_secret_key: str = "placeholder-secret-key-32-chars-minimum"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60
    frontend_url: str = "http://localhost:3000"


settings = Settings()
