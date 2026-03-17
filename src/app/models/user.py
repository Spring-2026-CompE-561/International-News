from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # Deletes bookmarks if user is deleted
    bookmarks = relationship(
        "Bookmark",
        back_populates="user",
        cascade="all, delete-orphan"
    )
