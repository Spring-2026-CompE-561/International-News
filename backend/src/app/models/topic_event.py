from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.core.database import Base


class TopicEvent(Base):
    __tablename__ = "topic_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    query = Column(String, nullable=False)
    summary = Column(String, nullable=True)
    category = Column(String, nullable=True)

    # Story briefing fields (legacy — kept for backward compat)
    hook = Column(Text, nullable=True)
    what_happened = Column(Text, nullable=True)
    why_it_matters = Column(Text, nullable=True)
    timeline = Column(Text, nullable=True)
    global_perspective = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)

    # New briefing fields (JSON stored as text)
    dek = Column(Text, nullable=True)
    quick_brief = Column(Text, nullable=True)       # JSON array of bullet strings
    full_briefing = Column(Text, nullable=True)      # JSON {heading, body} — main narrative
    what_changed = Column(Text, nullable=True)       # JSON {heading, body}
    big_picture = Column(Text, nullable=True)        # JSON {heading, body}
    angles = Column(Text, nullable=True)             # JSON array of {label, type, summary, source_names}
    sides_saying = Column(Text, nullable=True)        # JSON array of {side, position}
    burning_questions = Column(Text, nullable=True)   # JSON array of {question, answer}
    rabbit_holes = Column(Text, nullable=True)       # JSON array of {title, description}
    uncertainty = Column(Text, nullable=True)         # JSON array of strings
    source_notes = Column(Text, nullable=True)        # JSON array of {source, country, publisher_type, contribution}
    timeline_json = Column(Text, nullable=True)       # JSON array of {label, event}

    # Trending
    trending_score = Column(Integer, default=0)
    article_count = Column(Integer, default=0)
    source_count = Column(Integer, default=0)
    country_count = Column(Integer, default=0)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    articles = relationship("Article", back_populates="topic_event")
    bookmarks = relationship("Bookmark", back_populates="topic_event")
