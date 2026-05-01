from sqlalchemy.orm import Session

from app.repository.region import RegionRepository


def get_regions(db: Session) -> list:
    """
    Get all regions.

    Args:
        db: Database session

    Returns:
        list: All regions
    """
    return RegionRepository.get_all(db)