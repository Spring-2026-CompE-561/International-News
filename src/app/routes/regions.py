from fastapi import APIRouter

api_router = APIRouter(prefix="/regions", tags=["regions"])


@api_router.get("")
async def get_regions():
    return {"message": "Get regions route"}
