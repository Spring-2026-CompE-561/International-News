from typing import TYPE_CHECKING

from fastapi import HTTPException, status

from app.core.auth import get_password_hash, verify_password
from app.repository.user import UserRepository
from app.schemas.user import User, UserCreate, UserDb

if TYPE_CHECKING:
    from sqlalchemy.orm import Session


class UserService:
    def __init__(self) -> None:
        self.repository = UserRepository()

    def get_by_mail(self, db: Session, email: str) -> User | None:
        return self.repository.get_by_mail(db, email)

    def get_by_id(self, db: Session, user_id: int) -> User | None:
        return self.repository.get_by_id(db, user_id)

    def if_user_exists(self, db: Session, email: str) -> User:
        return self.repository.get_by_mail(db, email) is not None

    def create(self, db: Session, user: UserCreate) -> User:
        existing_user = self.if_user_exists(db, user.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User already registered",
            )

        if self.repository.get_by_username(db, user.username):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already registered.",
            )

        hashed_password = get_password_hash(user.password)
        user_db = UserDb(
            username=user.username,
            email=user.email,
            hashed_password=hashed_password,
        )

        return self.repository.create(db, user_db=user_db)

    def update(self, db: Session, user_id: int, user_data: UserCreate) -> User:
        user = self.repository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )
        existing_email = self.repository.get_by_mail(db, user_data.email)
        if existing_email and existing_email.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already in use",
            )
        existing_username = self.repository.get_by_username(db, user_data.username)
        if existing_username and existing_username.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already in use",
            )
        user.email = user_data.email
        user.username = user_data.username
        user.hashed_password = get_password_hash(user_data.password)
        return self.repository.update(db, user)

    def delete(self, db: Session, user_id: int) -> None:
        user = self.repository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found."
            )
        self.repository.delete(db, user)

    def authenticate(self, db: Session, email: str, password: str) -> User | None:
        user = self.repository.get_by_mail(db, email)
        if not user:
            return None
        if not verify_password(password, str(user.hashed_password)):
            return None
        return user


user_service = UserService()
