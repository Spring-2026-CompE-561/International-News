from typing import TYPE_CHECKING

from sqlalchemy.orm import joinedload

from app.models.article import Article
from app.models.source import Source
from app.models.topic_event import TopicEvent

if TYPE_CHECKING:
    from sqlalchemy.orm import Session


class TopicEventRepository:
    @staticmethod
    def get_by_id(db: "Session", topic_event_id: int) -> TopicEvent | None:
        return db.query(TopicEvent).filter(TopicEvent.id == topic_event_id).first()

    @staticmethod
    def get_trending(db: "Session", limit: int = 10, category: str | None = None) -> list[TopicEvent]:
        query = db.query(TopicEvent)
        if category:
            query = query.filter(TopicEvent.category == category)
        return (
            query
            .order_by(TopicEvent.trending_score.desc())
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_coverage(
        db: "Session",
        topic_event_id: int,
        country_ids: list[int] | None = None,
        limit: int = 5,
    ) -> dict:
        query = (
            db.query(Article)
            .options(
                joinedload(Article.source).joinedload(Source.country),
                joinedload(Article.topic_event),
            )
            .join(Source, Article.source_id == Source.id)
            .filter(Article.topic_event_id == topic_event_id)
            .order_by(Article.published_at.desc())
        )

        if country_ids:
            query = query.filter(Source.country_id.in_(country_ids))

        articles = query.all()

        coverage_by_country: dict[int, dict] = {}

        for article in articles:
            if not article.source or not article.source.country:
                continue

            country = article.source.country

            if country.id not in coverage_by_country:
                coverage_by_country[country.id] = {
                    "country": {
                        "id": country.id,
                        "code": country.code,
                        "name": country.name,
                        "language": country.language,
                    },
                    "articles": [],
                }

            if len(coverage_by_country[country.id]["articles"]) < limit:
                coverage_by_country[country.id]["articles"].append(
                    {
                        "id": article.id,
                        "title": article.title,
                        "url": article.url,
                        "published_at": article.published_at,
                        "summary": article.summary,
                        "image_url": article.image_url,
                        "source": {
                            "id": article.source.id,
                            "name": article.source.name,
                            "domain": article.source.domain,
                            "country_id": article.source.country_id,
                            "region_id": article.source.region_id,
                        },
                        "topic_id": article.topic_id,
                        "region_id": article.region_id,
                        "topic_event_id": article.topic_event_id,
                    }
                )

        return {
            "topic_event_id": topic_event_id,
            "coverage": list(coverage_by_country.values()),
        }

    @staticmethod
    def get_trending_by_country(
        db: "Session", country_code: str, limit: int = 20
    ) -> list[TopicEvent]:
        from app.models.country import Country

        return (
            db.query(TopicEvent)
            .join(Article, Article.topic_event_id == TopicEvent.id)
            .join(Source, Article.source_id == Source.id)
            .join(Country, Source.country_id == Country.id)
            .filter(Country.code == country_code)
            .order_by(TopicEvent.updated_at.desc())
            .distinct()
            .limit(limit)
            .all()
        )
