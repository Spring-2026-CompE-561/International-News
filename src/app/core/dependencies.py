from typing import Annotated

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import oauth2_scheme, verify_token
from app.core.database import get_db
from app.schemas.user import User
from app.services.user import user_service

credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception

    email: str | None = payload.get("sub")
    if email is None:
        raise credentials_exception

    user = user_service.get_by_mail(db, email=email)
    if user is None:
        raise credentials_exception

    return user
