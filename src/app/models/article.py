from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String, nullable=False)
    url = Column(String, unique=True, index=True, nullable=False)

    published_at = Column(DateTime, nullable=True)

    summary = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)

    source_id = Column(Integer, ForeignKey("sources.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)

    source = relationship("Source", back_populates="articles")
    topic = relationship("Topic", back_populates="articles")

    cluster_links = relationship("ClusterArticle", back_populates="article")