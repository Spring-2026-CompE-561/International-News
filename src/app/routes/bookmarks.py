from fastapi import APIRouter

api_router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


@api_router.get("")
async def get_bookmarks():
    return {"message": "Get bookmarks route"}


@api_router.post("")
async def bookmark_article():
    return {"message": "Bookmark article route"}


@api_router.delete("/{id}")
async def delete_bookmark(id: int):
    return {"message": f"Delete bookmark {id}"}
