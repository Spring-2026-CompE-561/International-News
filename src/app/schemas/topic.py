from pydantic import BaseModel


class TopicBase(BaseModel):
    name: str


class TopicCreate(TopicBase):
    pass


class TopicResponse(TopicBase):
    id: int

    class Config:
        from_attributes = True