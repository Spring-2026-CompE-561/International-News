from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from datetime import datetime
from sqlalchemy.orm import relationship

from app.core.database import Base


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # One of these will be set depending on what was commented on
    article_id = Column(Integer, nullable=True, index=True)
    story_id = Column(Integer, nullable=True, index=True)

    content = Column(Text, nullable=False)

    # Snapshot of user location at time of posting
    user_country = Column(String(100), nullable=True)
    user_city = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="comments")
