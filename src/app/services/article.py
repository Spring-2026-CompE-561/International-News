from sqlalchemy.orm import Session

from app.repository.article import ArticleRepository
from app.repository.country import CountryRepository
from fastapi import HTTPException, status


ARTICLE_NOT_FOUND_MSG = "Article not found"

def get_article_by_id(db: Session, article_id: int):
    """
    Get an article by ID.

    Args:
        db: Database session
        article_id: ID of the article to retrieve

    Returns:
        Article: Retrieved article
    """
    article = ArticleRepository.get_by_id(db, article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ARTICLE_NOT_FOUND_MSG,
        )


    return article
