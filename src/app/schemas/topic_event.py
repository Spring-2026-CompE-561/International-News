from datetime import datetime
from pydantic import BaseModel


class TopicEventBase(BaseModel):
    title: str
    query: str
    summary: str | None = None
    category: str | None = None


class TopicEventCreate(TopicEventBase):
    pass


class TopicEventResponse(TopicEventBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
