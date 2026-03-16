from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.auth import oauth2_scheme, verify_token
from app.core.database import get_db
from app.exceptions.credential_exception import credentials_exception
from app.schemas.user import User
from app.services.user import user_service

# Is this needed?
def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """
    Get the current authenticated user from JWT token.

    Args:
        token: JWT access token
        db: Database session

    Returns:
        User: Current authenticated user

    Raises:
        HTTPException: If token is invalid or user not found
    """

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