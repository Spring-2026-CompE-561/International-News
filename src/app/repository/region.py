from typing import TYPE_CHECKING

from app.models.region import Region

if TYPE_CHECKING:
    from sqlalchemy.orm import Session


class RegionRepository:
    @staticmethod
    def get_all(db: "Session") -> list[Region]:
        return db.query(Region).all()

    @staticmethod
    def get_by_id(db: "Session", region_id: int) -> Region | None:
        return db.query(Region).filter(Region.id == region_id).first()

    @staticmethod
    def get_by_name(db: "Session", name: str) -> Region | None:
        return db.query(Region).filter(Region.name == name).first()

    @staticmethod
    def create(db: "Session", name: str, description: str | None = None) -> Region:
        db_region = Region(name=name, description=description)
        db.add(db_region)
        db.commit()
        db.refresh(db_region)
        return db_region

    @staticmethod
    def delete(db: "Session", db_region: Region) -> None:
        db.delete(db_region)
        db.commit()
