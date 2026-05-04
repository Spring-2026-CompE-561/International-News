from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Annotated

from app.core.database import get_db
from app.repository.topic import TopicRepository
from app.repository.topic_event import TopicEventRepository
from app.repository.article import ArticleRepository
from app.schemas.topic import TopicResponse
from app.schemas.topic_event import TopicEventResponse


api_router = APIRouter(prefix="/topics", tags=["topics"])


@api_router.get("", response_model=list[TopicResponse])
def list_topics(db: Annotated[Session, Depends(get_db)]) -> list[TopicResponse]:
    return TopicRepository.get_all(db)


@api_router.get("/trending", response_model=list[TopicEventResponse])
async def get_trending_topics(
    limit: int = Query(default=20, ge=1, le=100),
    category: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return TopicEventRepository.get_trending(db, limit=limit, category=category)


@api_router.get("/{id}", response_model=TopicEventResponse)
async def get_topics_by_id(id: int, db: Session = Depends(get_db)):
    from app.services.topic_event import get_topic_event_by_id
    topic_event = get_topic_event_by_id(db, id)
    if not topic_event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Topic event not found"
        )
    return topic_event


@api_router.get("/{id}/coverage")
async def get_topics_coverage(
    id: int,
    country_ids: list[int] | None = Query(default=None),
    limit: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    topic_event = TopicEventRepository.get_by_id(db, id)

    if not topic_event:
        raise HTTPException(status_code=404, detail="Topic event not found")

    return TopicEventRepository.get_coverage(
        db=db,
        topic_event_id=id,
        country_ids=country_ids,
        limit=limit,
    )
