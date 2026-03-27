from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.region import RegionResponse
from app.services.region import get_regions

api_router = APIRouter(prefix="/regions", tags=["regions"])


@api_router.get("", response_model=list[RegionResponse])
def list_regions(db: Annotated[Session, Depends(get_db)]) -> list[RegionResponse]:
    """
    Get all regions for filter dropdown.
    """
    return get_regions(db)



