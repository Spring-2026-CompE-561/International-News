from typing import TYPE_CHECKING
from sqlalchemy.orm import joinedload

from app.models.comment import Comment

if TYPE_CHECKING:
    from sqlalchemy.orm import Session


class CommentRepository:
    @staticmethod
    def get_by_article_id(db: "Session", article_id: int) -> list[Comment]:
        return (
            db.query(Comment)
            .options(joinedload(Comment.user))
            .filter(Comment.article_id == article_id)
            .order_by(Comment.created_at.desc())
            .all()
        )

    @staticmethod
    def get_by_story_id(db: "Session", story_id: int) -> list[Comment]:
        return (
            db.query(Comment)
            .options(joinedload(Comment.user))
            .filter(Comment.story_id == story_id)
            .order_by(Comment.created_at.desc())
            .all()
        )

    @staticmethod
    def get_by_user_id(db: "Session", user_id: int) -> list[Comment]:
        return (
            db.query(Comment)
            .options(joinedload(Comment.user))
            .filter(Comment.user_id == user_id)
            .order_by(Comment.created_at.desc())
            .all()
        )

    @staticmethod
    def get_by_id(db: "Session", comment_id: int) -> Comment | None:
        return (
            db.query(Comment)
            .options(joinedload(Comment.user))
            .filter(Comment.id == comment_id)
            .first()
        )

    @staticmethod
    def create(db: "Session", comment: Comment) -> Comment:
        db.add(comment)
        db.commit()
        db.refresh(comment)
        # Reload with user relationship
        return CommentRepository.get_by_id(db, comment.id)  # type: ignore[return-value]

    @staticmethod
    def delete(db: "Session", comment: Comment) -> None:
        db.delete(comment)
        db.commit()
