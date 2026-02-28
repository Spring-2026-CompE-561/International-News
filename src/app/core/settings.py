from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "International News API"
    app_version: str = "1.0.0"


    secret_key: str = Field(default="your_secret_key")
    algorithm: str = Field(default="HS256")
    # access_token_expire_minutes: int = Field(default=30)

    database_url: str = Field(
        default="sqlite:///./Horizon_News.db",
        description="Database connection URL",
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()