from pydantic import BaseModel, ConfigDict


class CountryBase(BaseModel):
    code: str
    name: str
    language: str | None = None


class CountryCreate(CountryBase):
    pass


class CountryResponse(CountryBase):
    id: int

    class Config:
        from_attributes = True

# This schema is used for country/ endpoint
class CountryRead(BaseModel):
    code: str
    name: str
    language: str | None = None

    model_config = ConfigDict(from_attributes=True)