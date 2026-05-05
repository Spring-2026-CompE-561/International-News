from fastapi import HTTPException, status

from app.models.comment import Comment
from app.repository.comment import CommentRepository

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.orm import Session


class CommentService:
    def __init__(self) -> None:
        self.repository = CommentRepository()

    def get_article_comments(self, db: "Session", article_id: int) -> list[Comment]:
        return self.repository.get_by_article_id(db, article_id)

    def get_story_comments(self, db: "Session", story_id: int) -> list[Comment]:
        return self.repository.get_by_story_id(db, story_id)

    def get_user_comments(self, db: "Session", user_id: int) -> list[Comment]:
        return self.repository.get_by_user_id(db, user_id)

    def create_article_comment(
        self, db: "Session", article_id: int, user_id: int,
        content: str, user_country: str | None, user_city: str | None,
    ) -> Comment:
        comment = Comment(
            user_id=user_id,
            article_id=article_id,
            content=content.strip(),
            user_country=user_country,
            user_city=user_city,
        )
        return self.repository.create(db, comment)

    def create_story_comment(
        self, db: "Session", story_id: int, user_id: int,
        content: str, user_country: str | None, user_city: str | None,
    ) -> Comment:
        comment = Comment(
            user_id=user_id,
            story_id=story_id,
            content=content.strip(),
            user_country=user_country,
            user_city=user_city,
        )
        return self.repository.create(db, comment)

    def delete_comment(self, db: "Session", comment_id: int, user_id: int) -> None:
        comment = self.repository.get_by_id(db, comment_id)
        if not comment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found.")
        if comment.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your comment.")
        self.repository.delete(db, comment)


comment_service = CommentService()
