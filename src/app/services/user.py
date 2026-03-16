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

    def is_user_exists(self, db: Session, email: str) -> bool:
        return self.repository.get_by_mail(db, email) is not None

    def create(self, db: Session, user: UserCreate) -> User:
        """
        Create a new user with validation.

        Args:
            db: Database session
            user: User creation data

        Returns:
            User: Created user

        Raises:
            HTTPException: If email already exists
        """
        # Check if user already exists

        existing_user = self.is_user_exists(db, user.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

        # Hash password and create user
        hashed_password = get_password_hash(user.password)
        user_db = UserDb(
            email=user.email,
            hashed_password=hashed_password,
        )
        return self.repository.create(db, user_db=user_db)

    def authenticate(self, db: Session, email: str, password: str) -> User | None:
        """
        Authenticate user with email and password.

        Args:
            db: Database session
            email: User email
            password: Plain text password

        Returns:
            User | None: Authenticated user if credentials are valid, None otherwise
        """
        user = self.repository.get_by_mail(db, email)
        if not user:
            return None
        if not verify_password(password, str(user.hashed_password)):
            return None
        return user


user_service = UserService()