from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class TopicEvent(Base):
    __tablename__ = "topic_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    query = Column(String, nullable=False)
    summary = Column(String, nullable=True)
    category = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    articles = relationship("Article", back_populates="topic_event")
    bookmarks = relationship("Bookmark", back_populates="topic_event")
