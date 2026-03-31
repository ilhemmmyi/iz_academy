"""Application settings loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    DATABASE_URL: str = ""  # same Supabase DB as the main backend
    FRONTEND_URL: str = "http://localhost:5173"
    N8N_URL: str = "http://localhost:5678"

    class Config:
        env_file = ".env"


settings = Settings()
