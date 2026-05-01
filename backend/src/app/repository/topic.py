from typing import TYPE_CHECKING

from app.models.topic import Topic

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

    from app.schemas.topic import TopicCreate


class TopicRepository:
    @staticmethod
    def get_all(db: "Session") -> list[Topic]:
        return db.query(Topic).all()

    @staticmethod
    def get_by_id(db: "Session", topic_id: int) -> Topic | None:
        return db.query(Topic).filter(Topic.id == topic_id).first()

    @staticmethod
    def get_by_slug(db: "Session", slug: str) -> Topic | None:
        return db.query(Topic).filter(Topic.slug == slug).first()

    @staticmethod
    def get_by_name(db: "Session", name: str) -> Topic | None:
        return db.query(Topic).filter(Topic.name == name).first()

    @staticmethod
    def create(db: "Session", topic_in: "TopicCreate") -> Topic:
        db_topic = Topic(
            name=topic_in.name,
            slug=topic_in.slug,
        )
        db.add(db_topic)
        db.commit()
        db.refresh(db_topic)
        return db_topic

    @staticmethod
    def delete(db: "Session", db_topic: Topic) -> None:
        db.delete(db_topic)
        db.commit()
