from datetime import datetime
from pydantic import BaseModel, ConfigDict, HttpUrl

from app.schemas.country import CountryResponse
from app.schemas.source import SourceResponse
from app.schemas.topic import TopicResponse
from app.schemas.topic_event import TopicEventResponse
from app.schemas.region import RegionResponse

class ArticleBase(BaseModel):
    title: str
    url: HttpUrl
    published_at: datetime | None = None
    summary: str | None = None
    image_url: HttpUrl | None = None

    source_id: int
    topic_id: int | None = None
    region_id: int | None = None
    topic_event_id: int | None = None


class ArticleCreate(ArticleBase):
    pass


class ArticleResponse(ArticleBase):
    id: int

    class Config:
        from_attributes = True

class ArticleRead(BaseModel):
    id: int
    title: str
    url: HttpUrl
    published_at: datetime | None = None
    source: SourceResponse | None = None
    topic: TopicResponse | None = None
    region: RegionResponse | None = None
    country: CountryResponse | None = None
    topic_event: TopicEventResponse | None = None

    model_config = ConfigDict(from_attributes=True)


class ArticleSearchResponse(BaseModel):
    total: int
    articles: list[ArticleRead]