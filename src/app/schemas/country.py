from pydantic import BaseModel


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