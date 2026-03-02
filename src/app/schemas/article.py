from datetime import datetime
from pydantic import BaseModel, HttpUrl


class ArticleBase(BaseModel):
    title: str
    url: HttpUrl
    published_at: datetime | None = None
    summary: str | None = None
    image_url: HttpUrl | None = None

    source_id: int
    topic_id: int | None = None


class ArticleCreate(ArticleBase):
    pass


class ArticleResponse(ArticleBase):
    id: int

    class Config:
        from_attributes = True