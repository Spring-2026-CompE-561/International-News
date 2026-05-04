import re
import requests
from sqlalchemy.orm import Session

from app.repository.article import ArticleRepository
from app.schemas.article import ArticleSearchResponse
from app.core.settings import settings
from fastapi import HTTPException, status


ARTICLE_NOT_FOUND_MSG = "Article not found"


def scrape_article_text(url: str, title: str = "") -> str:
    """Scrape article text. Validates content is relevant to the title."""
    # Skip Google News redirect URLs — they won't resolve to the real article
    if "news.google.com" in url or "google.com/rss" in url:
        return ""

    try:
        from newspaper import Article as NewsArticle

        news = NewsArticle(url)
        news.download()
        news.parse()
        text = news.text.strip()
        if not text:
            return ""

        # Validate scraped content is about the same topic as the title
        if title:
            title_words = set(re.findall(r'\b[a-z]{4,}\b', title.lower()))
            text_words = set(re.findall(r'\b[a-z]{4,}\b', text[:500].lower()))
            skip = {"that", "this", "with", "from", "have", "been", "will", "about", "their", "there", "would", "could"}
            title_words -= skip
            text_words -= skip
            overlap = len(title_words & text_words)
            if overlap < 2:
                return ""  # Scraped content is unrelated

        return text[:2000]
    except Exception:
        return ""


def _try_scrape_meta(url: str) -> str:
    """Try to get meta description as a fallback snippet."""
    if "news.google.com" in url:
        return ""
    try:
        resp = requests.get(url, timeout=5, headers={"User-Agent": "Mozilla/5.0"})
        if resp.status_code != 200:
            return ""
        match = re.search(r'<meta[^>]+(?:name=["\']description["\']|property=["\']og:description["\'])[^>]+content=["\'](.*?)["\']', resp.text, re.IGNORECASE)
        if match:
            return match.group(1).strip()[:300]
    except Exception:
        pass
    return ""


def generate_article_content(article, scraped_text: str = "") -> dict:
    """Generate article content using the provider fallback chain."""
    from app.services.topic_event import groq_call

    topic_name = article.topic.name if article.topic else "News"
    source_name = article.source.name if article.source else "Unknown"

    if scraped_text:
        prompt = f"""Rewrite this article as a Horizon News piece. Keep ALL facts, names, numbers accurate. Do not invent anything not in the source.

Headline: {article.title}
Source: {source_name} | Category: {topic_name}

Source text:
{scraped_text[:1500]}

Use this format:
===SUMMARY===
2 sentence hook based on the facts.
===BODY===
4-6 paragraphs. Use only facts from the source text. Write with flow."""
    else:
        # No scraped text — write based on headline only, but be honest about it
        prompt = f"""Write a short news article based ONLY on this headline. Do not invent quotes, names, numbers, or details not implied by the headline. Keep it factual and brief.

Headline: {article.title}
Source: {source_name} | Category: {topic_name}

Use this format:
===SUMMARY===
2 sentence summary of what the headline tells us.
===BODY===
3-4 short paragraphs. Only what the headline supports. If details are unknown, say so briefly rather than inventing."""

    content = groq_call(prompt, max_tokens=1200)
    if not content:
        return {"summary": article.title, "body": ""}

    summary = ""
    body = ""

    summary_match = re.search(r'===SUMMARY===\s*(.+?)(?=\s*===BODY===)', content, re.DOTALL)
    body_match = re.search(r'===BODY===\s*(.+)', content, re.DOTALL)

    if summary_match:
        summary = summary_match.group(1).strip()
    if body_match:
        body = body_match.group(1).strip()
        body = re.sub(r'===.*?===\s*', '', body).strip()

    if not body and len(content) > 100:
        body = content

    return {"summary": summary, "body": body}


def get_article_by_id(db: Session, article_id: int):
    article = ArticleRepository.get_by_id(db, article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ARTICLE_NOT_FOUND_MSG,
        )

    # Generate content on first read if missing
    if not article.body:
        # Try to scrape real article text (validates relevance)
        scraped = scrape_article_text(article.url, article.title)

        # If scraping failed, try meta description
        if not scraped:
            meta = _try_scrape_meta(article.url)
            if meta:
                scraped = meta

        # Generate content
        generated = generate_article_content(article, scraped)
        if generated["body"]:
            article.body = generated["body"]
        if generated["summary"] and (not article.summary or article.summary == article.title):
            article.summary = generated["summary"]
        db.commit()
        db.refresh(article)

    return article


def get_articles(
    db: Session,
    q: str | None = None,
    topic_id: int | None = None,
    region_id: int | None = None,
    country_code: str | None = None,
    topic_event_id: int | None = None,
    skip: int = 0,
    limit: int = 20,
) -> ArticleSearchResponse:
    articles = ArticleRepository.get_filtered(
        db,
        q=q,
        topic_id=topic_id,
        region_id=region_id,
        country_code=country_code,
        topic_event_id=topic_event_id,
        skip=skip,
        limit=limit,
    )
    total = ArticleRepository.count_filtered(
        db,
        q=q,
        topic_id=topic_id,
        region_id=region_id,
        country_code=country_code,
        topic_event_id=topic_event_id,
    )
    return ArticleSearchResponse(total=total, articles=articles)
