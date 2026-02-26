from fastapi import APIRouter

api_router = APIRouter(prefix="/articles", tags=["articles"])

@api_router.get("")
async def get_articles():
    return {"message": "get articles route"}

@api_router.get("/compare")
async def compare_articles():
    return {"message": "compare articles route"}

@api_router.get("/{id}")
async def get_certain_article(id: int):
    return {"message": f"get article {id}"}
