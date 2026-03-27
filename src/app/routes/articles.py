from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Annotated
from app.core.database import get_db
from app.services.article import get_article_by_id, get_articles
from app.schemas.article import ArticleResponse, ArticleSearchResponse

api_router = APIRouter(prefix="/articles", tags=["articles"])

@api_router.get("", response_model=ArticleSearchResponse)
def search_articles(
    db: Annotated[Session, Depends(get_db)],
    q: Annotated[str | None, Query(description="Search in title and summary")] = None,
    topic_id: Annotated[int | None, Query(description="Filter by topic ID")] = None,
    region_id: Annotated[int | None, Query(description="Filter by region ID")] = None,
    country_code: Annotated[str | None, Query(description="Filter by country code")] = None,
    topic_event_id: Annotated[int | None, Query(description="Filter by topic event ID")] = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> ArticleSearchResponse:
    return get_articles(
        db,
        q=q,
        topic_id=topic_id,
        region_id=region_id,
        country_code=country_code,
        topic_event_id=topic_event_id,
        skip=skip,
        limit=limit,
    )


@api_router.get("/{id}", response_model=ArticleResponse)
async def get_article(id: int, db: Session = Depends(get_db)) -> ArticleResponse:
    return get_article_by_id(db, id)


