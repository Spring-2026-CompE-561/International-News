from typing import TYPE_CHECKING

from app.models.user import User

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

    from app.schemas.user import UserDb


class UserRepository:
    @staticmethod
    def get_by_mail(db: Session, email: str) -> User | None:

        # Select all from user where email matches
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_by_id(db: Session, user_id: int) -> User | None:

        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_by_username(db: Session, username: str):
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def create(
        db: Session,
        user_db: UserDb,
    ) -> User:
        db_user = User(
            email=user_db.email,
            username=user_db.username,
            hashed_password=user_db.hashed_password,
        )

        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def update(db: Session, db_user: User) -> User:
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def delete(db: Session, db_user: User) -> None:
        db.delete(db_user)
        db.commit()
