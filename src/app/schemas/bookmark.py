from datetime import datetime
from pydantic import BaseModel


class BookmarkBase(BaseModel):
    article_id: int | None = None
    topic_event_id: int | None = None


class BookmarkCreate(BookmarkBase):
    pass


class BookmarkResponse(BookmarkBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
