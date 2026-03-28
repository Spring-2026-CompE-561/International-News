from sqlalchemy.orm import Session

from app.repository.bookmark import BookmarkRepository
from app.schemas.bookmark import BookmarkCreate
from app.models.bookmark import Bookmark
from fastapi import HTTPException, status


def get_bookmarks(db: Session, user_id: int):

    bookmark = BookmarkRepository.get_by_user(db, user_id)

    return bookmark


def create_bookmark(db: Session, user_id: int, bookmark_in: BookmarkCreate) -> Bookmark:
    if not bookmark_in.article_id and not bookmark_in.topic_event_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide article_id or topic_event_id",
        )

    if bookmark_in.article_id:
        existing = BookmarkRepository.get_by_user_and_article(
            db, user_id, bookmark_in.article_id
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Article already bookmarked",
            )
    return BookmarkRepository.create(db, user_id, bookmark_in)


def delete_bookmark(db: Session, bookmark_id: int, user_id: int):
    bookmark = BookmarkRepository.get_by_id(db, bookmark_id)
    if not bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bookmark not found"
        )
    if bookmark.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    BookmarkRepository.delete(db, bookmark)
