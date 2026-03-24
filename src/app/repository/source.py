from typing import TYPE_CHECKING

from app.models.source import Source

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

    from app.schemas.source import SourceCreate


class SourceRepository:
    @staticmethod
    def get_all(db: "Session") -> list[Source]:
        return db.query(Source).all()

    @staticmethod
    def get_by_id(db: "Session", source_id: int) -> Source | None:
        return db.query(Source).filter(Source.id == source_id).first()

    @staticmethod
    def get_by_domain(db: "Session", domain: str) -> Source | None:
        return db.query(Source).filter(Source.domain == domain).first()

    @staticmethod
    def get_by_country(db: "Session", country_id: int) -> list[Source]:
        return db.query(Source).filter(Source.country_id == country_id).all()

    @staticmethod
    def get_by_region(db: "Session", region_id: int) -> list[Source]:
        return db.query(Source).filter(Source.region_id == region_id).all()

    @staticmethod
    def create(db: "Session", source_in: "SourceCreate") -> Source:
        db_source = Source(
            name=source_in.name,
            domain=source_in.domain,
            country_id=source_in.country_id,
            region_id=source_in.region_id,
        )
        db.add(db_source)
        db.commit()
        db.refresh(db_source)
        return db_source

    @staticmethod
    def delete(db: "Session", db_source: Source) -> None:
        db.delete(db_source)
        db.commit()
