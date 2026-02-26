from fastapi import APIRouter

api_router = APIRouter(prefix="/topics", tags=["topics"])


@api_router.get("")
async def get_topics():
    return {"message": "Get topics route"}
