from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import create_access_token
from app.schemas.user import UserCreate, User as UserSchema
from app.schemas.token import Token
from app.services.user import user_service


api_router = APIRouter(prefix="/auth", tags=["auth"])


@api_router.post(
    "/signup", response_model=UserSchema, status_code=status.HTTP_201_CREATED
)
async def signup(
    user: UserCreate, db: Annotated[Session, Depends(get_db)]
) -> UserSchema:
    return user_service.create(db, user)


@api_router.post("/login")
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[Session, Depends(get_db)],
) -> Token:
    user = user_service.authenticate(
        db, email=form_data.username, password=form_data.password
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.email})
    return Token(access_token=access_token, token_type="bearer")
