from fastapi import APIRouter

from app.routes import (
    articles,
    auth,
    bookmarks,
    perspectives,
    regions,
    sources,
    topics,
    user,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(articles.api_router)
api_router.include_router(auth.api_router)
api_router.include_router(bookmarks.api_router)
api_router.include_router(perspectives.api_router)
api_router.include_router(regions.api_router)
api_router.include_router(sources.api_router)
api_router.include_router(topics.api_router)
api_router.include_router(user.api_router)
