from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from typing import Annotated
from app.core.database import get_db
from app.services.article import get_article_by_id, get_articles
from app.schemas.article import ArticleRead, ArticleSearchResponse
from app.models.article import Article

api_router = APIRouter(prefix="/articles", tags=["articles"])


@api_router.get("/offradar", response_model=ArticleSearchResponse)
def get_offradar_articles(
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=20)] = 6,
) -> ArticleSearchResponse:
    """Get lesser-known stories — lower-ranked but interesting. One per cluster, randomized."""
    from app.models.topic_event import TopicEvent
    from sqlalchemy import func as sqlfunc

    # Get mid-to-low ranked events (skip top 5 per category, pick from the rest)
    categories = ["World & Conflict", "Business & Economy", "Technology", "Science", "Health", "Sports", "Entertainment"]
    top_ids = set()
    for cat in categories:
        tops = db.query(TopicEvent.id).filter(TopicEvent.category == cat).order_by(TopicEvent.trending_score.desc()).limit(5).all()
        top_ids.update(t[0] for t in tops)

    # Get random events from the remaining pool that have images
    events = (
        db.query(TopicEvent)
        .filter(
            TopicEvent.id.notin_(top_ids),
            TopicEvent.image_url != None,
            TopicEvent.image_url != "",
        )
        .order_by(sqlfunc.random())
        .limit(limit)
        .all()
    )

    articles = []
    for event in events:
        candidates = db.query(Article).filter(Article.topic_event_id == event.id).all()
        if not candidates:
            continue
        with_image = [a for a in candidates if a.image_url and len(a.image_url) > 10]
        best = with_image[0] if with_image else candidates[0]
        if (not best.image_url or best.image_url == "") and event.image_url:
            best.image_url = event.image_url
        articles.append(best)

    return ArticleSearchResponse(total=len(articles), articles=articles)


@api_router.get("/top", response_model=ArticleSearchResponse)
def get_top_articles(
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=50)] = 10,
) -> ArticleSearchResponse:
    """
    Get the most globally significant articles — the stories the world is watching.
    Ranked by a global significance score that weighs:
      - trending_score (editorial ranking)
      - source_count (how many outlets covered it)
      - country_count (how many countries are reporting)
      - article_count (depth of coverage)
    Excludes the #1 story per category (those are in the briefing cards).
    Picks one article per cluster, preferring authoritative sources with images.
    """
    from app.models.topic_event import TopicEvent

    # Exclude the #1 story per category — already shown in top 5 cards
    categories = ["World & Conflict", "Business & Economy", "Technology", "Science", "Health", "Sports", "Entertainment"]
    excluded_event_ids = set()
    for cat in categories:
        top = db.query(TopicEvent).filter(TopicEvent.category == cat).order_by(TopicEvent.trending_score.desc()).first()
        if top:
            excluded_event_ids.add(top.id)

    # Get all remaining events with real coverage (2+ articles = real story, not noise)
    events = (
        db.query(TopicEvent)
        .filter(
            TopicEvent.id.notin_(excluded_event_ids),
            TopicEvent.article_count >= 2,
        )
        .all()
    )

    # Rank by global significance:
    # Stories covered by more sources, more countries, and higher score = more globally watched
    AUTHORITY_DOMAINS = {
        "reuters.com", "apnews.com", "bbc.com", "bbc.co.uk", "cnn.com",
        "aljazeera.com", "theguardian.com", "nytimes.com", "france24.com",
        "dw.com", "news.un.org", "washingtonpost.com",
    }

    def global_significance(event):
        score = event.trending_score or 0
        sources = event.source_count or 0
        countries = event.country_count or 0
        articles = event.article_count or 0
        # Multi-country stories are more globally significant
        return score + (sources * 3) + (countries * 8) + min(articles * 2, 20)

    events.sort(key=global_significance, reverse=True)

    articles = []
    for event in events[:limit * 2]:  # overfetch in case some lack images
        candidates = (
            db.query(Article)
            .filter(Article.topic_event_id == event.id)
            .all()
        )
        if not candidates:
            continue

        # Pick the best article: authority source with image > any with image > any
        def article_quality(a):
            has_image = 1 if (a.image_url and len(a.image_url) > 10) else 0
            domain = ""
            try:
                domain = a.source.domain if a.source else ""
            except Exception:
                pass
            is_authority = 1 if domain in AUTHORITY_DOMAINS else 0
            return (has_image, is_authority, len(a.title))

        candidates.sort(key=article_quality, reverse=True)
        best = candidates[0]

        # Fall back to topic event image if article has none
        if (not best.image_url or best.image_url == "") and event.image_url:
            best.image_url = event.image_url

        articles.append(best)
        if len(articles) >= limit:
            break

    return ArticleSearchResponse(total=len(articles), articles=articles)


@api_router.get("", response_model=ArticleSearchResponse)
def search_articles(
    db: Annotated[Session, Depends(get_db)],
    q: Annotated[str | None, Query(description="Search in title and summary")] = None,
    topic_id: Annotated[int | None, Query(description="Filter by topic ID")] = None,
    region_id: Annotated[int | None, Query(description="Filter by region ID")] = None,
    country_code: Annotated[str | None, Query(description="Filter by country code")] = None,
    topic_event_id: Annotated[int | None, Query(description="Filter by topic event ID")] = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> ArticleSearchResponse:
    return get_articles(
        db,
        q=q,
        topic_id=topic_id,
        region_id=region_id,
        country_code=country_code,
        topic_event_id=topic_event_id,
        skip=skip,
        limit=limit,
    )


@api_router.get("/{id}", response_model=ArticleRead)
async def get_article(id: int, db: Session = Depends(get_db)) -> ArticleRead:
    return get_article_by_id(db, id)


