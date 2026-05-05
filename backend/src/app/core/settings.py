from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "International News API"
    app_version: str = "1.0.0"


    secret_key: str = Field(default="your_secret_key")
    algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=10080)  # 7 days

    database_url: str = Field(
        default="postgresql://localhost/horizon_news",
        description="Database connection URL",
    )

    news_api_key: str = Field(
        default="",
        description="NewsAPI.org API key",
    )

    groq_api_key: str = Field(
        default="",
        description="Groq API key for headline polish",
    )

    gemini_api_key: str = Field(
        default="",
        description="Google Gemini API key (fallback AI provider)",
    )

    openrouter_api_key: str = Field(
        default="",
        description="OpenRouter API key (free fallback AI provider)",
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()