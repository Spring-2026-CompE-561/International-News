from sqlalchemy.orm import Session

from app.repository.source import SourceRepository
from fastapi import HTTPException, status

def get_sources(
    db: Session,
    region_id: int | None = None,
    country_code: str | None = None,
) -> list:
    """
    Get all sources, optionally filtered by region or country.

    Args:
        db: Database session
        region_id: Filter by region ID
        country_code: Filter by country code

    Returns:
        list: All matching sources
    """
    return SourceRepository.get_filtered(db, region_id=region_id, country_code=country_code)

SOURCE_NOT_FOUND_MSG = "Source not found"


def get_source_by_id(db: Session, source_id: int):
    """
    Get a source by ID.

    Args:
        db: Database session
        source_id: ID of the source to retrieve

    Returns:
        Source: Retrieved source
    """
    source = SourceRepository.get_by_id(db, source_id)
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=SOURCE_NOT_FOUND_MSG,
        )
    return source