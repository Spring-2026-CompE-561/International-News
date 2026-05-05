from datetime import datetime
from pydantic import BaseModel, model_validator


class CommentCreate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: int
    user_id: int
    username: str = ""
    display_name: str | None = None
    article_id: int | None = None
    story_id: int | None = None
    content: str
    user_country: str | None = None
    user_city: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def extract_user_fields(cls, data):
        if hasattr(data, "user") and data.user is not None:
            return {
                "id": data.id,
                "user_id": data.user_id,
                "username": data.user.username,
                "display_name": data.user.display_name,
                "article_id": data.article_id,
                "story_id": data.story_id,
                "content": data.content,
                "user_country": data.user_country,
                "user_city": data.user_city,
                "created_at": data.created_at,
            }
        return data
