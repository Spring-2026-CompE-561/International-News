from typing import TYPE_CHECKING

from app.models.country import Country

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

    from app.schemas.country import CountryCreate


class CountryRepository:
    @staticmethod
    def get_all(db: "Session") -> list[Country]:
        return db.query(Country).all()

    @staticmethod
    def get_by_id(db: "Session", country_id: int) -> Country | None:
        return db.query(Country).filter(Country.id == country_id).first()

    @staticmethod
    def get_by_code(db: "Session", code: str) -> Country | None:
        return db.query(Country).filter(Country.code == code).first()

    @staticmethod
    def get_by_name(db: "Session", name: str) -> Country | None:
        return db.query(Country).filter(Country.name == name).first()

    @staticmethod
    def create(db: "Session", country_in: "CountryCreate") -> Country:
        db_country = Country(
            code=country_in.code,
            name=country_in.name,
            language=country_in.language,
        )
        db.add(db_country)
        db.commit()
        db.refresh(db_country)
        return db_country

    @staticmethod
    def delete(db: "Session", db_country: Country) -> None:
        db.delete(db_country)
        db.commit()
