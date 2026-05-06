from typing import Annotated
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.bookmark import BookmarkCreate, BookmarkResponse, BookmarkDetailResponse
from app.schemas.user import User as UserSchema
from app.services.bookmark import (
    get_bookmarks as fetch_bookmarks,
    create_bookmark,
    delete_bookmark as remove_bookmark,
)


api_router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


@api_router.get("", response_model=list[BookmarkDetailResponse])
async def get_bookmarks(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[UserSchema, Depends(get_current_user)],
):
    return fetch_bookmarks(db, current_user.id)


@api_router.post(
    "", response_model=BookmarkResponse, status_code=status.HTTP_201_CREATED
)
async def bookmark_article(
    bookmark_in: BookmarkCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[UserSchema, Depends(get_current_user)],
):
    return create_bookmark(db, current_user.id, bookmark_in)


@api_router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bookmark(
    id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[UserSchema, Depends(get_current_user)],
):
    remove_bookmark(db, id, current_user.id)
