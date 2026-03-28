from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.repository.source import SourceRepository
from app.schemas.source import SourceResponse


api_router = APIRouter(prefix="/sources", tags=["sources"])


@api_router.get("", response_model=list[SourceResponse])
async def get_sources(
    db: Annotated[Session, Depends(get_db)],
    region_id: int | None = None,
    country_code: str | None = None,
):
    return SourceRepository.get_filtered(
        db, region_id=region_id, country_code=country_code
    )


@api_router.get("/{id}", response_model=SourceResponse)
async def get_specific_source(
    id: int,
    db: Annotated[Session, Depends(get_db)],
):
    source = SourceRepository.get_by_id(db, id)
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Source not found."
        )
    return source
