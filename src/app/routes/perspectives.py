from fastapi import APIRouter

api_router = APIRouter(prefix="/perspectives", tags=["perspectives"])


@api_router.get("")
async def get_perspectives():
    return {"message": "Get perspectives route"}
