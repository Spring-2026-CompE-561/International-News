from typing import Optional
from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
from typing import Annotated
from app.services.country import get_countries
from app.schemas.country import CountryResponse, CountryRead
from app.core.database import get_db

api_router = APIRouter(prefix="/countries", tags=["countries"])

@api_router.get("", response_model=list[CountryRead])
def list_countries(db: Annotated[Session, Depends(get_db)]) -> list[CountryRead]:
    """
    Get all countries.
    """
    return get_countries(db)


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