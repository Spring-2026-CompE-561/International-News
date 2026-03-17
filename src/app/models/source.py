from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    domain = Column(
        String, unique=True, index=True, nullable=True
    )  # optional "bbc.co.uk"
    country_id = Column(Integer, ForeignKey("countries.id"), nullable=False)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=True)

    country = relationship("Country", back_populates="sources")
    articles = relationship("Article", back_populates="source")
    region = relationship("Region", back_populates="sources")
