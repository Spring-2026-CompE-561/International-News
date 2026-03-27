from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.article import get_article_by_id, get_articles
from app.schemas.article import ArticleResponse

api_router = APIRouter(prefix="/articles", tags=["articles"])


@api_router.get("/{id}")
async def get_article(id: int, db: Session = Depends(get_db)) -> ArticleResponse:
    return get_article_by_id(db, id)