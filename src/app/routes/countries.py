from typing import Optional
from fastapi import APIRouter, Query

api_router = APIRouter(prefix="/countries", tags=["countries"])


@api_router.get("")
async def get_countries():
    return {"message": "Get countries route"}


@api_router.get("/{code}/trending/topics")
async def get_country_trending_topics(
    code: str,
    limit: int = Query(default=20),
    topic: Optional[str] = Query(default=None), 
):
    return {
        "message": f"Get trending topics for country {code}",
        "limit": limit,
        "topic_filter": topic,
    }