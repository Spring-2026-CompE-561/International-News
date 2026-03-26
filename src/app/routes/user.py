from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.user import User as UserSchema, UserCreate
from app.services.user import user_service


api_router = APIRouter(prefix="/users", tags=["users"])


@api_router.get("/me", response_model=UserSchema)
async def read_users_me(
    current_user: Annotated[UserSchema, Depends(get_current_user)],
) -> UserSchema:
    return current_user


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

    return user_service.update(db, id, user_data)


@api_router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    db: Annotated[Session, Depends(get_db)],
    id: int,
    current_user: Annotated[UserSchema, Depends(get_current_user)],
):
    user_service.delete(db, id)
