from sqlalchemy.orm import Session

from app.repository.article import ArticleRepository
from app.schemas.article import ArticleSearchResponse
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


def get_articles(
    db: Session,
    q: str | None = None,
    topic_id: int | None = None,
    region_id: int | None = None,
    country_code: str | None = None,
    topic_event_id: int | None = None,
    skip: int = 0,
    limit: int = 20,
) -> ArticleSearchResponse:
    """
    Search and filter articles.

    Args:
        db: Database session
        q: Search keyword for title and summary
        topic_id: Filter by topic ID
        region_id: Filter by region ID
        country_code: Filter by country code
        topic_event_id: Filter by topic event ID
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        ArticleSearchResponse: Total count and list of articles
    """

    total = ArticleRepository.count_filtered(
        db,
        q=q,
        topic_id=topic_id,
        region_id=region_id,
        country_code=country_code,
        topic_event_id=topic_event_id,
    )
    articles = ArticleRepository.get_filtered(
        db,
        q=q,
        topic_id=topic_id,
        region_id=region_id,
        country_code=country_code,
        topic_event_id=topic_event_id,
        skip=skip,
        limit=limit,
    )
    return ArticleSearchResponse(total=total, articles=articles)
