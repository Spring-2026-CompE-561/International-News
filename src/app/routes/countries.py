from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
from typing import Annotated
from app.services.country import get_countries
from app.schemas.country import CountryRead
from app.core.database import get_db
from app.repository.topic_event import TopicEventRepository
from app.schemas.topic_event import TopicEventResponse

api_router = APIRouter(prefix="/countries", tags=["countries"])


@api_router.get("", response_model=list[CountryRead])
def list_countries(db: Annotated[Session, Depends(get_db)]) -> list[CountryRead]:
    """
    Get all countries.
    """
    return get_countries(db)


@api_router.get("/{code}/trending/topics", response_model=list[TopicEventResponse])
async def get_country_trending_topics(
    code: str,
    limit: int = Query(default=20, ge=1, le=100),
    db: Annotated[Session, Depends(get_db)] = None,
):
    return TopicEventRepository.get_trending_by_country(
        db, country_code=code, limit=limit
    )
