from fastapi import APIRouter
from typing import Annotated
from fastapi import Depends, Query
from sqlalchemy.orm import Session  
from app.core.database import get_db
from app.services.source import get_sources, get_source_by_id
from app.schemas.source import SourceResponse

api_router = APIRouter(prefix="/sources", tags=["sources"])


@api_router.get("", response_model=list[SourceResponse])
def list_sources(
    db: Annotated[Session, Depends(get_db)],
    region_id: Annotated[int | None, Query(description="Filter by region ID")] = None,
    country_code: Annotated[str | None, Query(description="Filter by country code")] = None,
) -> list[SourceResponse]:
    """
    Get all news sources, filterable by region or country.
    """
    return get_sources(db, region_id=region_id, country_code=country_code)



@api_router.get("/{id}", response_model=SourceResponse)
def get_source(id: int, db: Annotated[Session, Depends(get_db)]) -> SourceResponse:
    """
    Get details about a specific news source.
    """
    return get_source_by_id(db, id)