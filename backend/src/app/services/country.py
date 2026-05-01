from sqlalchemy.orm import Session

from app.repository.country import CountryRepository


def get_countries(db: Session) -> list:
    """
    Get all countries.

    Args:
        db: Database session

    Returns:
        list: All countries
    """
    return CountryRepository.get_all(db)