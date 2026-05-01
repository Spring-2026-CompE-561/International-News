from pydantic import BaseModel


class SourceBase(BaseModel):
    name: str
    domain: str | None = None
    country_id: int
    region_id: int | None = None


class SourceCreate(SourceBase):
    pass


class SourceResponse(SourceBase):
    id: int

    class Config:
        from_attributes = True
