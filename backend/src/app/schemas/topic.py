from pydantic import BaseModel


class TopicBase(BaseModel):
    name: str
    slug: str
    trending_label: str | None = None


class TopicCreate(TopicBase):
    pass


class TopicResponse(TopicBase):
    id: int

    class Config:
        from_attributes = True
