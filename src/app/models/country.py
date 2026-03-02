from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class Country(Base):
    __tablename__ = "countries"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(2), unique=True, index=True, nullable=False)  # ISO-3166 like "US"
    name = Column(String, unique=True, index=True, nullable=False)
    language = Column(String(8), nullable=True)  # optional like "en", "fr-FR"

    sources = relationship("Source", back_populates="country")