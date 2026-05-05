from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.user import User as UserSchema, UserCreate, UserProfile, UserProfileUpdate
from app.schemas.comment import CommentResponse
from app.services.user import user_service
from app.services.comment import comment_service

api_router = APIRouter(prefix="/users", tags=["users"])


@api_router.get("/me", response_model=UserProfile)
async def read_users_me(
    current_user: Annotated[UserSchema, Depends(get_current_user)],
):
    return current_user


@api_router.patch("/me/profile", response_model=UserProfile)
async def update_my_profile(
    body: UserProfileUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[UserSchema, Depends(get_current_user)],
):
    return user_service.update_profile(db, current_user.id, body)


@api_router.get("/me/comments", response_model=list[CommentResponse])
async def get_my_comments(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[UserSchema, Depends(get_current_user)],
):
    return comment_service.get_user_comments(db, current_user.id)


@api_router.get("/{id}", response_model=UserSchema)
async def get_user(db: Annotated[Session, Depends(get_db)], id: int):
    user = user_service.get_by_id(db, id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


@api_router.put("/{id}", response_model=UserSchema)
async def update_user(
    db: Annotated[Session, Depends(get_db)],
    id: int,
    current_user: Annotated[UserSchema, Depends(get_current_user)],
    user_data: UserCreate,
):
    if current_user.id != id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")
    return user_service.update(db, id, user_data)


@api_router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    db: Annotated[Session, Depends(get_db)],
    id: int,
    current_user: Annotated[UserSchema, Depends(get_current_user)],
):
    if current_user.id != id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")
    user_service.delete(db, id)
