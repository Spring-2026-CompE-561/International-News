from typing import TYPE_CHECKING

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.core.settings import settings

# TYPE_CHECKING = false when python is running code, so import is skipped.
# TYPE_CHECKING = true when editor analyses code
# Recommended usage when importing for type hints
if TYPE_CHECKING:
    from collections.abc import Generator

# Create database engine
engine = create_engine(
    settings.database_url,
    connect_args=(
        {"check_same_thread": False}
        if settings.database_url.startswith("sqlite")
        else {}
    ),
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class that your database models will inherit from
Base = declarative_base()

# Opens DB session and sends to route. Function is called by a route.
def get_db() -> "Generator[Session]":
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()