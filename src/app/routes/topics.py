from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repository.topic_event import TopicEventRepository


api_router = APIRouter(prefix="/topics", tags=["topics"])


@api_router.get("/trending")
async def get_trending_topics():
    return {"message": "Get treding topics"}


@api_router.get("/{id}")
async def get_topics_by_id(id: int):
    return {"message": f"Get topics by {id}"}


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
