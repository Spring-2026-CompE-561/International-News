from pydantic import BaseModel


class RegionBase(BaseModel):
    name: str
    description: str | None = None


class RegionCreate(RegionBase):
    pass


class RegionResponse(RegionBase):
    id: int

    class Config:
        from_attributes = True