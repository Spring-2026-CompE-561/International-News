"""
Generate 5 captivating trending stories based on real headlines.
Each story gets a long-form narrative article.

Usage:
    cd backend && PYTHONPATH=src uv run python src/seed_trending.py
"""

import json
import re
import time
import requests
from datetime import datetime, timezone
from urllib.parse import urlparse

from app.core.database import SessionLocal, Base, engine
from app.core.settings import settings
from app.models.country import Country
from app.models.region import Region
from app.models.topic import Topic
from app.models.topic_event import TopicEvent
from app.models.source import Source
from app.models.article import Article

NEWSAPI_KEY = settings.news_api_key
GROQ_KEY = settings.groq_api_key
GUARDIAN_KEY = "test"

CATEGORIES = ["business", "technology", "science", "health", "sports", "entertainment"]

# Images for trending stories — high-impact editorial photos
STORY_IMAGES = [
    "https://images.unsplash.com/photo-1504711434969-e33886168d9c?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1400&q=80",
]


def clean_title(title):
    title = re.sub(r"\s*[-–—|]\s*[A-Z][A-Za-z0-9\s\'\.\,\&\!]+$", "", title)
    return title.rstrip("-–—").strip()


def get_or_create(db, model, filter_kwargs, create_kwargs=None):
    instance = db.query(model).filter_by(**filter_kwargs).first()
    if not instance:
        all_kwargs = {**filter_kwargs, **(create_kwargs or {})}
        instance = model(**all_kwargs)
        db.add(instance)
        db.commit()
        db.refresh(instance)
    return instance


def fetch_all_headlines():
    """Fetch headlines from all sources to know what's trending globally."""
    headlines = []

    # NewsAPI — US headlines across categories
    if NEWSAPI_KEY:
        for cat in ["general", "business", "technology", "science", "health", "sports"]:
            resp = requests.get(
                "https://newsapi.org/v2/top-headlines",
                params={"country": "us", "category": cat, "apiKey": NEWSAPI_KEY, "pageSize": 5},
            )
            if resp.status_code == 200:
                for item in resp.json().get("articles", []):
                    if item.get("title") and item["title"] != "[Removed]":
                        headlines.append(clean_title(item["title"]))
            time.sleep(0.5)

    # Guardian — global headlines
    for section in ["world", "business", "technology", "sport", "science"]:
        resp = requests.get(
            "https://content.guardianapis.com/search",
            params={"section": section, "api-key": GUARDIAN_KEY, "page-size": 5, "order-by": "newest"},
        )
        if resp.status_code == 200:
            for item in resp.json().get("response", {}).get("results", []):
                headlines.append(item.get("webTitle", ""))

    return headlines


def groq_call(prompt, max_tokens=1024):
    """Make a Groq API call."""
    resp = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {GROQ_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": "llama-3.1-8b-instant",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens,
            "temperature": 0.7,
        },
    )
    if resp.status_code != 200:
        print(f"  Groq error: {resp.status_code}")
        return None
    return resp.json()["choices"][0]["message"]["content"].strip()


def identify_trending_stories(headlines):
    """Ask Groq to identify the 5 biggest global stories right now."""
    headlines_text = "\n".join(f"- {h}" for h in headlines[:40])

    prompt = f"""You are an editor-in-chief at a major international news organization.

Based on these real headlines from today's news cycle:
{headlines_text}

Identify the 5 BIGGEST, most captivating global stories happening right now. These should be stories that:
- Everyone is talking about
- Have global significance
- Would make someone stop scrolling

For each story, return a JSON object with:
- "title": A short, punchy 2-5 word label (like "Iran Crisis Deepens" or "AI Arms Race")
- "category": The broad category (World, Business, Technology, Science, Sports, Culture)
- "summary": One compelling sentence describing why this story matters right now

Return ONLY a JSON array of 5 objects. No markdown, no code blocks."""

    content = groq_call(prompt, max_tokens=512)
    if not content:
        return []

    try:
        content = re.sub(r'^```(?:json)?\s*', '', content)
        content = re.sub(r'\s*```$', '', content)
        match = re.search(r'\[.*\]', content, re.DOTALL)
        if match:
            return json.loads(match.group())[:5]
    except json.JSONDecodeError as e:
        print(f"  JSON error: {e}")
    return []


def generate_long_article(story, headlines):
    """Generate one long-form narrative article for a trending story."""
    related = [h for h in headlines if any(
        word.lower() in h.lower()
        for word in story["title"].split() if len(word) > 3
    )][:5]

    related_text = ""
    if related:
        related_text = "\nRelated headlines for context:\n" + "\n".join(f"- {h}" for h in related)

    prompt = f"""You are a senior correspondent at Horizon News, a premium international news publication.

Write a compelling, in-depth article about this trending story:
Topic: {story["title"]}
Category: {story["category"]}
Context: {story["summary"]}
{related_text}

Write in the style of The Economist or The Atlantic — intelligent, engaging, with narrative flow.

Use this EXACT format (the markers ===TITLE===, ===SUMMARY===, ===BODY=== must appear exactly as shown):

===TITLE===
A professional, compelling headline (8-14 words)
===SUMMARY===
A gripping 2-sentence hook (40-60 words)
===BODY===
A full 5-6 paragraph article (400-500 words). Include a strong narrative opening, specific details and data, quotes from unnamed analysts or officials, geopolitical implications, and a thought-provoking closing. Use paragraph breaks between paragraphs."""

    content = groq_call(prompt, max_tokens=2048)
    if not content:
        return None

    try:
        title_match = re.search(r'===TITLE===\s*(.+?)(?=\s*===SUMMARY===)', content, re.DOTALL)
        summary_match = re.search(r'===SUMMARY===\s*(.+?)(?=\s*===BODY===)', content, re.DOTALL)
        body_match = re.search(r'===BODY===\s*(.+)', content, re.DOTALL)

        if title_match and summary_match and body_match:
            return {
                "title": title_match.group(1).strip(),
                "summary": summary_match.group(1).strip(),
                "body": body_match.group(1).strip(),
            }
        else:
            print(f"    Could not parse sections from response")
    except Exception as e:
        print(f"    Parse error: {e}")
    return None


def main():
    if not GROQ_KEY:
        print("ERROR: Set GROQ_API_KEY in .env")
        return

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Ensure we have regions/countries/sources
        na_region = get_or_create(db, Region, {"name": "North America"})
        us_country = get_or_create(db, Country, {"code": "US"}, {"name": "United States", "language": "en"})
        source = get_or_create(
            db, Source, {"name": "Horizon News"},
            {"domain": "horizon-news.horizonnews.app", "country_id": us_country.id, "region_id": na_region.id},
        )

        # Step 1: Fetch all real headlines
        print("Fetching global headlines...")
        headlines = fetch_all_headlines()
        print(f"Found {len(headlines)} headlines\n")

        # Step 2: Identify 5 biggest stories (1 Groq call)
        print("Identifying top 5 trending stories...")
        stories = identify_trending_stories(headlines)
        time.sleep(5)

        if not stories:
            print("ERROR: Could not identify stories")
            return

        for i, s in enumerate(stories):
            print(f"  {i+1}. {s['title']} ({s['category']})")

        # Step 3: Generate long-form article for each story (5 Groq calls)
        print("\nGenerating articles...")
        for i, story in enumerate(stories):
            print(f"\n  [{i+1}/5] {story['title']}...")

            article_data = generate_long_article(story, headlines)
            time.sleep(8)  # rate limit

            if not article_data:
                print(f"    FAILED — skipping")
                continue

            # Find or create matching topic
            cat_slug = story.get("category", "world").lower()
            if cat_slug in ("world", "politics", "conflict"):
                cat_slug = "business"  # map to existing topic
            elif cat_slug == "culture":
                cat_slug = "entertainment"
            topic = db.query(Topic).filter(Topic.slug == cat_slug).first()
            if not topic:
                topic = db.query(Topic).first()

            # Create TopicEvent for this trending story
            topic_event = TopicEvent(
                title=story["title"],
                query=story["title"].lower().replace(" ", "-"),
                summary=story.get("summary", ""),
                category=story.get("category", "World"),
            )
            db.add(topic_event)
            db.commit()
            db.refresh(topic_event)

            # Create the article
            slug = re.sub(r'[^a-z0-9]+', '-', article_data["title"].lower()).strip('-')
            url = f"https://horizonnews.app/trending/{slug}"

            if not db.query(Article).filter(Article.url == url).first():
                db_article = Article(
                    title=article_data["title"],
                    url=url,
                    published_at=datetime.now(timezone.utc),
                    summary=article_data.get("summary", ""),
                    body=article_data.get("body", ""),
                    image_url=STORY_IMAGES[i % len(STORY_IMAGES)],
                    source_id=source.id,
                    topic_id=topic.id,
                    region_id=na_region.id,
                    topic_event_id=topic_event.id,
                )
                db.add(db_article)
                db.commit()
                print(f"    ✓ {article_data['title']}")
            else:
                print(f"    (already exists)")

        # Update topic trending labels — assign each story to the most relevant topic
        print("\nUpdating trending labels...")
        used_topics = set()
        for story in stories:
            cat = story.get("category", "").lower()
            # Map story category to topic slug
            mapping = {
                "world": "business", "politics": "business", "conflict": "business",
                "business": "business", "economy": "business",
                "technology": "technology", "tech": "technology",
                "science": "science", "space": "science",
                "health": "health", "medicine": "health",
                "sports": "sports", "sport": "sports",
                "culture": "entertainment", "entertainment": "entertainment",
            }
            slug = mapping.get(cat, None)
            # If already used or not found, pick first unused
            if not slug or slug in used_topics:
                for s in CATEGORIES:
                    if s not in used_topics:
                        slug = s
                        break
            if slug:
                topic = db.query(Topic).filter(Topic.slug == slug).first()
                if topic:
                    topic.trending_label = story["title"]
                    db.commit()
                    used_topics.add(slug)
                    print(f"  {topic.name} → {story['title']}")

        print(f"\nDone!")
        print(f"  TopicEvents: {db.query(TopicEvent).count()}")
        print(f"  Articles:    {db.query(Article).count()}")

    finally:
        db.close()


if __name__ == "__main__":
    main()
