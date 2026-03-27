from typing import TYPE_CHECKING

from app.models.article import Article

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

    from app.schemas.article import ArticleCreate


class ArticleRepository:
    @staticmethod
    def get_all(db: "Session") -> list[Article]:
        return db.query(Article).all()

    @staticmethod
    def get_filtered(
        db: "Session",
        q: str | None = None,
        topic_id: int | None = None,
        region_id: int | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Article]:
        query = db.query(Article)
        if q:
            query = query.filter(
                Article.title.ilike(f"%{q}%") | Article.summary.ilike(f"%{q}%")
            )
        if topic_id is not None:
            query = query.filter(Article.topic_id == topic_id)
        if region_id is not None:
            query = query.filter(Article.region_id == region_id)
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def count_filtered(
        db: "Session",
        q: str | None = None,
        topic_id: int | None = None,
        region_id: int | None = None,
    ) -> int:
        query = db.query(Article)
        if q:
            query = query.filter(
                Article.title.ilike(f"%{q}%") | Article.summary.ilike(f"%{q}%")
            )
        if topic_id is not None:
            query = query.filter(Article.topic_id == topic_id)
        if region_id is not None:
            query = query.filter(Article.region_id == region_id)
        return query.count()

    @staticmethod
    def get_by_id(db: "Session", article_id: int) -> Article | None:
        return db.query(Article).filter(Article.id == article_id).first()

    @staticmethod
    def get_by_url(db: "Session", url: str) -> Article | None:
        return db.query(Article).filter(Article.url == url).first()

    @staticmethod
    def get_by_topic(db: "Session", topic_id: int) -> list[Article]:
        return db.query(Article).filter(Article.topic_id == topic_id).all()

    @staticmethod
    def get_by_region(db: "Session", region_id: int) -> list[Article]:
        return db.query(Article).filter(Article.region_id == region_id).all()

    @staticmethod
    def get_by_topic_event(db: "Session", topic_event_id: int) -> list[Article]:
        return db.query(Article).filter(Article.topic_event_id == topic_event_id).all()

    @staticmethod
    def create(db: "Session", article_in: "ArticleCreate") -> Article:
        db_article = Article(
            title=article_in.title,
            url=str(article_in.url),
            published_at=article_in.published_at,
            summary=article_in.summary,
            image_url=str(article_in.image_url) if article_in.image_url else None,
            source_id=article_in.source_id,
            topic_id=article_in.topic_id,
            region_id=article_in.region_id,
            topic_event_id=article_in.topic_event_id,
        )
        db.add(db_article)
        db.commit()
        db.refresh(db_article)
        return db_article

    @staticmethod
    def delete(db: "Session", db_article: Article) -> None:
        db.delete(db_article)
        db.commit()
