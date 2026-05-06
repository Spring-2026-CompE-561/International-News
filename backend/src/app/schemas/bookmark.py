from datetime import datetime
from pydantic import BaseModel


class BookmarkBase(BaseModel):
    article_id: int | None = None
    topic_event_id: int | None = None


class BookmarkCreate(BookmarkBase):
    pass


# Simple response — used by POST (create). No relationship loading needed.
class BookmarkResponse(BookmarkBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SourceInBookmark(BaseModel):
    name: str

    class Config:
        from_attributes = True


class TopicInBookmark(BaseModel):
    name: str

    class Config:
        from_attributes = True


class ArticleInBookmark(BaseModel):
    id: int
    title: str | None = None
    source: SourceInBookmark | None = None
    topic: TopicInBookmark | None = None
    image_url: str | None = None
    published_at: datetime | None = None

    class Config:
        from_attributes = True


class StoryInBookmark(BaseModel):
    id: int
    title: str | None = None
    category: str | None = None
    image_url: str | None = None
    source_count: int | None = None
    country_count: int | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


# Rich response — used by GET (list). Requires eager-loaded relationships.
class BookmarkDetailResponse(BookmarkResponse):
    article: ArticleInBookmark | None = None
    topic_event: StoryInBookmark | None = None
