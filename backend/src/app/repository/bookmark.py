from typing import TYPE_CHECKING

from sqlalchemy.orm import joinedload

from app.models.bookmark import Bookmark
from app.models.article import Article

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

    from app.schemas.bookmark import BookmarkCreate


class BookmarkRepository:
    @staticmethod
    def get_by_user(db: "Session", user_id: int) -> list[Bookmark]:
        return (
            db.query(Bookmark)
            .filter(Bookmark.user_id == user_id)
            .options(
                joinedload(Bookmark.article).joinedload(Article.source),
                joinedload(Bookmark.article).joinedload(Article.topic),
                joinedload(Bookmark.topic_event),
            )
            .all()
        )

    @staticmethod
    def get_by_id(db: "Session", bookmark_id: int) -> Bookmark | None:
        return db.query(Bookmark).filter(Bookmark.id == bookmark_id).first()

    @staticmethod
    def get_by_user_and_article(
        db: "Session", user_id: int, article_id: int
    ) -> Bookmark | None:
        return (
            db.query(Bookmark)
            .filter(Bookmark.user_id == user_id, Bookmark.article_id == article_id)
            .first()
        )

    @staticmethod
    def create(db: "Session", user_id: int, bookmark_in: "BookmarkCreate") -> Bookmark:
        db_bookmark = Bookmark(
            user_id=user_id,
            article_id=bookmark_in.article_id,
            topic_event_id=bookmark_in.topic_event_id,
        )
        db.add(db_bookmark)
        db.commit()
        db.refresh(db_bookmark)
        return db_bookmark

    @staticmethod
    def delete(db: "Session", db_bookmark: Bookmark) -> None:
        db.delete(db_bookmark)
        db.commit()
