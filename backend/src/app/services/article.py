import re
import requests
from sqlalchemy.orm import Session

from app.repository.article import ArticleRepository
from app.schemas.article import ArticleSearchResponse
from app.core.settings import settings
from fastapi import HTTPException, status


ARTICLE_NOT_FOUND_MSG = "Article not found"


def scrape_article_text(url: str) -> str:
    """Scrape the actual article text from the source URL."""
    try:
        from newspaper import Article as NewsArticle

        news = NewsArticle(url)
        news.download()
        news.parse()
        text = news.text.strip()
        # Return first 2000 chars to keep Groq prompt reasonable
        return text[:2000] if text else ""
    except Exception:
        return ""


def generate_article_content(article, scraped_text: str = "") -> dict:
    """Use Groq to write article content based on real scraped text."""
    groq_key = settings.groq_api_key
    if not groq_key:
        return {"summary": article.title, "body": ""}

    topic_name = article.topic.name if article.topic else "News"
    source_name = article.source.name if article.source else "Unknown"

    if scraped_text:
        context = f"""Here is the actual source article text from {source_name}:

\"\"\"{scraped_text}\"\"\"

Based on this REAL article, rewrite it as a Horizon News piece. Keep all facts, names, numbers, and quotes accurate. Do not invent any facts that are not in the source text."""
    else:
        context = f"""The headline is: "{article.title}"
Source: {source_name}
Category: {topic_name}

Write a factual article based on this headline. Include realistic details and context, but clearly note this is based on available reporting."""

    prompt = f"""You are a senior journalist at Horizon News, a premium global news publication.

{context}

Use this EXACT format:

===SUMMARY===
[2-sentence compelling hook. 40-60 words. Based on real facts from the source.]
===BODY===
[5-6 paragraphs, 400-500 words. Write like Reuters meets The Atlantic.
- Keep all real facts, names, dates, and quotes from the source
- Add context and analysis around the facts
- Include broader implications
- Strong narrative opening, thought-provoking close
- Write in present tense where appropriate]"""

    try:
        resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 2048,
                "temperature": 0.5,
            },
            timeout=30,
        )
        if resp.status_code != 200:
            return {"summary": article.title, "body": ""}

        content = resp.json()["choices"][0]["message"]["content"].strip()

        summary = ""
        body = ""

        summary_match = re.search(r'===SUMMARY===\s*(.+?)(?=\s*===BODY===)', content, re.DOTALL)
        body_match = re.search(r'===BODY===\s*(.+)', content, re.DOTALL)

        if summary_match:
            summary = summary_match.group(1).strip()
        if body_match:
            body = body_match.group(1).strip()

        if not body and len(content) > 100:
            body = content

        return {"summary": summary, "body": body}

    except Exception:
        return {"summary": article.title, "body": ""}


def get_article_by_id(db: Session, article_id: int):
    article = ArticleRepository.get_by_id(db, article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ARTICLE_NOT_FOUND_MSG,
        )

    # Generate content on first read if missing
    if not article.body:
        # Step 1: Try to scrape real article text
        scraped = scrape_article_text(article.url)

        # Step 2: Generate content (with real text if available)
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
    total = ArticleRepository.count_filtered(
        db,
        q=q,
        topic_id=topic_id,
        region_id=region_id,
        country_code=country_code,
        topic_event_id=topic_event_id,
    )
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
    return ArticleSearchResponse(total=total, articles=articles)
