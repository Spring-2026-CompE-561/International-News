from fastapi import APIRouter

api_router = APIRouter(prefix="/topics", tags=["topics"])


@api_router.get("")
async def get_topics():
    return {"message": "Get topics route"}


@api_router.get("/trending")
async def get_trending_topics():
    return {"message": "Get treding topics"}


@api_router.get("/{id}")
async def get_topics_by_id(id: int):
    return {"message": f"Get topics by {id}"}


@api_router.get("/{id}/coverage")
async def get_topics_coverage(id: int):
    return {"message": f"coverage for topic {id}"}
