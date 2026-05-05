from typing import Annotated
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.comment import CommentCreate, CommentResponse
from app.schemas.user import User as UserSchema
from app.services.comment import comment_service

api_router = APIRouter(tags=["comments"])


@api_router.get("/articles/{article_id}/comments", response_model=list[CommentResponse])
async def get_article_comments(
    article_id: int,
    db: Annotated[Session, Depends(get_db)],
):
    return comment_service.get_article_comments(db, article_id)


@api_router.post("/articles/{article_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def post_article_comment(
    article_id: int,
    body: CommentCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[UserSchema, Depends(get_current_user)],
):
    return comment_service.create_article_comment(
        db, article_id, current_user.id, body.content,
        current_user.country, current_user.city,
    )


@api_router.get("/stories/{story_id}/comments", response_model=list[CommentResponse])
async def get_story_comments(
    story_id: int,
    db: Annotated[Session, Depends(get_db)],
):
    return comment_service.get_story_comments(db, story_id)


@api_router.post("/stories/{story_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def post_story_comment(
    story_id: int,
    body: CommentCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[UserSchema, Depends(get_current_user)],
):
    return comment_service.create_story_comment(
        db, story_id, current_user.id, body.content,
        current_user.country, current_user.city,
    )


@api_router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[UserSchema, Depends(get_current_user)],
):
    comment_service.delete_comment(db, comment_id, current_user.id)
