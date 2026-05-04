"""
Horizon News — Story Engine v5

1. Fetch articles from all sources (GDELT, NewsAPI, 60+ RSS feeds, Guardian, Google News search)
2. Extract entities + keywords per article
3. AI-classify category
4. Cluster by entity/keyword/category/time similarity
5. Score clusters: velocity × authority × strength × freshness × category engagement - penalties
6. Two-lane ranking: clusters first, then strong singletons (guarantee 10+ per category)
7. AI polishes titles/hooks for top clusters
8. Store everything

Target: 2000+ articles per run, 10+ stories per category.

Usage:
    cd backend && PYTHONPATH=src uv run python src/seed.py
"""

import os
import re
import json
import time
import requests
import feedparser
from datetime import datetime, timezone, timedelta
from urllib.parse import urlparse, unquote
from collections import defaultdict

from app.core.database import SessionLocal, Base, engine
from app.core.settings import settings
from app.models.country import Country
from app.models.region import Region
from app.models.topic import Topic
from app.models.topic_event import TopicEvent
from app.models.source import Source
from app.models.article import Article

GROQ_KEY = settings.groq_api_key
NEWSAPI_KEY = settings.news_api_key
GUARDIAN_KEY = "test"

COUNTRIES_CONFIG = {
    "US": {"name": "United States", "language": "en", "region": "North America"},
    "GB": {"name": "United Kingdom", "language": "en", "region": "Europe"},
    "FR": {"name": "France", "language": "fr", "region": "Europe"},
    "DE": {"name": "Germany", "language": "de", "region": "Europe"},
    "AU": {"name": "Australia", "language": "en", "region": "Oceania"},
    "CA": {"name": "Canada", "language": "en", "region": "North America"},
    "IN": {"name": "India", "language": "en", "region": "Asia"},
    "JP": {"name": "Japan", "language": "ja", "region": "Asia"},
    "BR": {"name": "Brazil", "language": "pt", "region": "South America"},
    "ZA": {"name": "South Africa", "language": "en", "region": "Africa"},
    "AE": {"name": "United Arab Emirates", "language": "ar", "region": "Middle East"},
    "CN": {"name": "China", "language": "zh", "region": "Asia"},
    "RU": {"name": "Russia", "language": "ru", "region": "Europe"},
    "IL": {"name": "Israel", "language": "he", "region": "Middle East"},
    "MX": {"name": "Mexico", "language": "es", "region": "North America"},
}

CATEGORY_NAMES = {
    "world": "World & Conflict",
    "business": "Business & Economy",
    "technology": "Technology",
    "science": "Science",
    "health": "Health",
    "sports": "Sports",
    "entertainment": "Entertainment",
}

CATEGORY_AUTHORITY = {
    "world": {"reuters.com": 100, "apnews.com": 95, "bbc.com": 90, "bbc.co.uk": 90, "aljazeera.com": 85, "theguardian.com": 80, "cnn.com": 75, "nytimes.com": 85, "washingtonpost.com": 80, "france24.com": 75, "dw.com": 70, "news.un.org": 95},
    "business": {"bloomberg.com": 100, "reuters.com": 95, "ft.com": 95, "wsj.com": 90, "cnbc.com": 85, "marketwatch.com": 70, "economist.com": 90, "fortune.com": 75},
    "technology": {"theverge.com": 95, "wired.com": 90, "techcrunch.com": 88, "arstechnica.com": 80, "reuters.com": 85, "bloomberg.com": 85, "engadget.com": 70},
    "science": {"nature.com": 100, "science.org": 100, "scientificamerican.com": 90, "newscientist.com": 85, "reuters.com": 80, "bbc.com": 75, "theguardian.com": 70, "nasa.gov": 95},
    "health": {"reuters.com": 95, "apnews.com": 90, "statnews.com": 90, "who.int": 100, "cdc.gov": 100, "bbc.com": 75, "theguardian.com": 70, "nytimes.com": 80, "news.un.org": 90},
    "sports": {"espn.com": 100, "skysports.com": 90, "theathletic.com": 90, "reuters.com": 75, "apnews.com": 75, "bbc.com": 70, "bleacherreport.com": 65},
    "entertainment": {"variety.com": 100, "hollywoodreporter.com": 95, "deadline.com": 90, "billboard.com": 90, "people.com": 75, "apnews.com": 70, "rollingstone.com": 85},
}

ENGAGEMENT_WORDS = {
    "crisis": 12, "war": 12, "strike": 10, "attack": 10, "dead": 10, "killed": 10,
    "collapse": 10, "scandal": 9, "ban": 8, "warning": 8, "emergency": 10,
    "breakthrough": 9, "record": 8, "wins": 7, "upset": 9, "final": 7,
    "lawsuit": 8, "hack": 10, "leak": 9, "fired": 8, "arrested": 9,
    "approval": 7, "launch": 6, "surge": 7, "plunge": 7, "rally": 6,
    "exclusive": 8, "breaking": 10, "shocking": 7, "historic": 8,
}

# Category-specific engagement words — boost scores for domain-relevant terms
CATEGORY_ENGAGEMENT = {
    "world": {
        "war": 14, "invasion": 14, "ceasefire": 12, "sanctions": 11, "coup": 14,
        "refugee": 10, "diplomat": 8, "summit": 9, "treaty": 10, "airstrikes": 13,
        "hostage": 13, "peacekeeping": 8, "genocide": 14, "embargo": 10, "espionage": 11,
        "revolt": 12, "uprising": 12, "assassination": 14, "occupation": 11, "sovereignty": 9,
    },
    "business": {
        "recession": 14, "bankruptcy": 13, "merger": 10, "acquisition": 10, "ipo": 12,
        "layoffs": 12, "earnings": 8, "inflation": 11, "tariff": 10, "default": 13,
        "rally": 9, "crash": 14, "dividend": 7, "antitrust": 11, "bailout": 13,
        "profit": 8, "revenue": 7, "downturn": 11, "bubble": 10, "unicorn": 9,
    },
    "technology": {
        "breach": 14, "hack": 14, "ransomware": 13, "outage": 12, "leaked": 11,
        "launch": 9, "chatgpt": 10, "openai": 10, "nvidia": 9, "apple": 8,
        "robot": 9, "quantum": 10, "autonomous": 9, "startup": 7, "patent": 8,
        "vulnerability": 12, "exploit": 12, "disruption": 9, "foldable": 8, "chipmaker": 9,
    },
    "science": {
        "discovery": 12, "breakthrough": 14, "nasa": 10, "mars": 10, "asteroid": 11,
        "species": 9, "fossil": 9, "genome": 10, "crispr": 11, "telescope": 9,
        "supernova": 10, "earthquake": 11, "volcanic": 11, "extinction": 12, "fusion": 12,
        "quantum": 10, "exoplanet": 10, "comet": 9, "mutation": 10, "neanderthal": 9,
    },
    "health": {
        "pandemic": 14, "outbreak": 14, "vaccine": 12, "fda": 10, "recall": 11,
        "cancer": 10, "clinical": 8, "mortality": 11, "epidemic": 13, "virus": 12,
        "drug": 9, "trial": 8, "surgery": 8, "cure": 12, "diagnosis": 8,
        "resistant": 11, "contagious": 12, "overdose": 11, "therapy": 7, "transplant": 9,
    },
    "sports": {
        "championship": 12, "finals": 12, "knockout": 12, "upset": 14, "record": 11,
        "injury": 10, "trade": 10, "transfer": 10, "derby": 9, "comeback": 12,
        "overtime": 11, "shutout": 10, "eliminated": 11, "undefeated": 11, "mvp": 10,
        "hat-trick": 11, "suspension": 10, "doping": 12, "retirement": 9, "draft": 9,
    },
    "entertainment": {
        "premiere": 10, "oscar": 12, "grammy": 12, "emmy": 11, "box office": 11,
        "cancelled": 12, "reunion": 10, "sequel": 8, "reboot": 8, "viral": 10,
        "concert": 8, "album": 8, "trailer": 9, "streaming": 7, "blockbuster": 10,
        "comeback": 11, "scandal": 13, "feud": 10, "divorce": 9, "engagement": 9,
    },
}

CATEGORY_IMAGE_POOLS = {
    "world": [
        "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1551038247-3d9af20df552?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1600&q=85",
    ],
    "business": [
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1462899006636-339e08d1844e?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=1600&q=85",
    ],
    "technology": [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1600&q=85",
    ],
    "science": [
        "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1600&q=85",
    ],
    "health": [
        "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=1600&q=85",
    ],
    "sports": [
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1471295253337-3ceaaedca402?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1600&q=85",
    ],
    "entertainment": [
        "https://images.unsplash.com/photo-1603190287605-e6ade32fa852?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1600&q=85",
    ],
}

STOPWORDS = {
    "the", "and", "for", "are", "but", "not", "you", "all", "can", "her",
    "was", "one", "our", "out", "had", "has", "his", "how", "its", "may",
    "who", "did", "get", "got", "let", "say", "she", "too", "use",
    "says", "said", "after", "before", "over", "under", "with", "from",
    "latest", "live", "update", "news", "report", "today", "watch",
    "video", "photos", "analysis", "explainer", "could", "would", "should",
    "new", "first", "major", "also", "just", "like", "make", "take",
    "show", "about", "into", "more", "some", "that", "this", "than",
    "have", "been", "will", "being", "what", "when", "where", "which",
    "their", "there", "these", "those", "other", "many", "much",
    "does", "doing", "most", "such", "only", "very", "come", "came",
    "every", "here", "look", "want", "give", "going", "know", "need",
    "still", "back", "even", "well", "then", "them", "they", "your",
    "really", "might", "keep", "start", "why", "set", "run", "big",
}


# ── Content Type Classification ──────────────────────────────
# Detects filler content that should never rank as a "top event"

FILLER_PATTERNS = {
    "deal": [
        r"\$\d+\s*off", r"\d+%\s*off", r"save \$", r"best deal", r"price drop",
        r"on sale", r"discount", r"coupon", r"promo code", r"flash sale",
        r"cheapest", r"budget pick", r"best buy", r"where to buy",
    ],
    "guide": [
        r"^how to ", r"^best \w+ for ", r"^top \d+ (best|ways|tips)",
        r"\d+ tips", r"step.by.step", r"beginner.?s guide", r"everything you need to know",
        r"complete guide", r"ultimate guide", r"what to know before",
        r"^the best ", r"track your", r"our picks",
    ],
    "horoscope": [
        r"horoscope", r"zodiac", r"astrology", r"star sign", r"celestial align",
        r"mercury retrograde", r"tarot", r"daily stars",
    ],
    "schedule": [
        r"start time", r"when (and|to) watch", r"tv schedule", r"channel listing",
        r"how to watch .+ live", r"stream .+ online free", r"kick.?off time",
        r"what time does .+ start", r"where to watch",
    ],
    "lifestyle": [
        r"^your .+ could", r"surprising (health |)benefit", r"self.care",
        r"morning routine", r"wellness tips", r"kits for pets",
        r"four.legged fans", r"gift guide",
    ],
    "product_review": [
        r"^review:", r"hands.on", r"unboxing", r"vs\.?\s", r"compared",
        r"first look", r"is it worth", r"\d+ (best|top) .+ we tested",
    ],
    "opinion": [
        r"^opinion:", r"^editorial:", r"^op.ed", r"^column:",
        r"^letter(s)? to the editor", r"in (my|our) opinion",
    ],
}

# Hard category validation — if a story doesn't match its category's core signals,
# it gets a heavy penalty. A "top event" MUST be about its category's domain.
CATEGORY_VALIDATORS = {
    "world": {
        "required_any": [
            "war", "conflict", "military", "troops", "invasion", "ceasefire",
            "diplomacy", "diplomat", "summit", "treaty", "sanctions", "embargo",
            "government", "president", "prime minister", "election", "vote",
            "protest", "revolution", "coup", "refugee", "humanitarian",
            "disaster", "earthquake", "hurricane", "flood", "tsunami",
            "nuclear", "nato", "united nations", "eu ", "european union",
            "border", "territory", "sovereignty", "occupation", "genocide",
            "terror", "hostage", "assassination", "espionage",
            "china", "russia", "ukraine", "iran", "israel", "gaza", "taiwan",
            "africa", "middle east", "asia", "europe",
        ],
    },
    "business": {
        "required_any": [
            "market", "stock", "shares", "economy", "economic", "trade",
            "tariff", "inflation", "recession", "gdp", "federal reserve",
            "interest rate", "bank", "earnings", "revenue", "profit",
            "layoff", "hiring", "jobs", "unemployment", "wages", "salary",
            "merger", "acquisition", "ipo", "startup", "valuation",
            "oil", "gas", "energy price", "housing", "mortgage", "rent",
            "consumer", "spending", "debt", "bankruptcy", "bailout",
            "company", "corporation", "ceo", "executive", "billion", "million",
            "industry", "manufacture", "supply chain", "retail",
        ],
    },
    "technology": {
        "required_any": [
            "ai ", "artificial intelligence", "machine learning", "chatbot",
            "software", "hardware", "chip", "semiconductor", "processor",
            "cybersecurity", "hack", "breach", "ransomware", "vulnerability",
            "startup", "platform", "app ", "application", "cloud",
            "robot", "autonomous", "self-driving", "electric vehicle",
            "apple", "google", "microsoft", "meta", "amazon", "nvidia",
            "openai", "tesla", "spacex", "samsung",
            "quantum", "blockchain", "crypto", "5g", "6g",
            "data", "privacy", "algorithm", "code", "developer",
            "internet", "social media", "streaming tech",
        ],
        "reject_any": [
            "off thanks to", "$ off", "% off", "best deal", "how to track",
            "luggage", "where to buy", "our picks for", "shopping",
        ],
    },
    "science": {
        "required_any": [
            "research", "study", "discover", "scientist", "professor",
            "nasa", "space", "mars", "moon", "asteroid", "comet", "planet",
            "telescope", "orbit", "spacecraft", "rocket", "launch",
            "climate", "environment", "species", "fossil", "dinosaur",
            "ocean", "arctic", "antarctic", "glacier",
            "gene", "dna", "cell", "evolution", "mutation", "crispr",
            "physics", "quantum", "particle", "atom",
            "earthquake", "volcano", "geological", "seismic",
            "experiment", "laboratory", "journal", "peer.review",
        ],
    },
    "health": {
        "required_any": [
            "health", "medical", "medicine", "doctor", "patient", "hospital",
            "fda", "drug", "treatment", "therapy", "clinical trial",
            "vaccine", "virus", "disease", "pandemic", "epidemic", "outbreak",
            "cancer", "diabetes", "heart", "brain", "mental health",
            "surgery", "diagnosis", "symptom", "chronic",
            "public health", "who ", "cdc", "nih",
            "pharmaceutical", "biotech", "gene therapy",
            "obesity", "addiction", "overdose", "mortality",
        ],
    },
    "sports": {
        "required_any": [
            "nba", "nfl", "mlb", "nhl", "mls", "ufc", "wwe", "f1", "formula",
            "premier league", "champions league", "la liga", "bundesliga",
            "world cup", "olympic", "grand slam", "grand prix",
            "player", "coach", "team", "match", "game", "race",
            "score", "goal", "win", "defeat", "loss", "draw",
            "championship", "playoff", "final", "semifinal", "quarter",
            "transfer", "trade", "draft", "injury", "suspension",
            "athlete", "record", "medal", "title", "trophy",
            "football", "soccer", "basketball", "baseball", "tennis",
            "golf", "cricket", "rugby", "boxing", "mma",
            "stadium", "tournament", "league", "division", "season",
        ],
    },
    "entertainment": {
        "required_any": [
            "film", "movie", "box office", "cinema", "director", "actor",
            "actress", "cast", "sequel", "franchise", "premiere", "trailer",
            "tv", "series", "show", "season", "episode", "streaming",
            "netflix", "disney", "hbo", "hulu", "amazon prime",
            "music", "album", "song", "concert", "tour", "artist",
            "singer", "band", "rapper", "grammy", "billboard",
            "oscar", "emmy", "golden globe", "award", "nomination",
            "celebrity", "star", "famous", "viral", "tiktok",
            "gaming", "video game", "playstation", "xbox", "nintendo",
            "broadway", "theater", "comedy", "stand-up", "podcast",
            "book", "novel", "author", "bestseller",
        ],
        "reject_any": [
            "horoscope", "zodiac", "astrology", "daily stars", "tarot",
            "start time", "kick-off time", "when to watch",
        ],
    },
}


def classify_content_type(title):
    """Classify an article's content type based on title patterns."""
    low = title.lower()
    for content_type, patterns in FILLER_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, low):
                return content_type
    return "news"  # Default: legitimate news


def validate_category_fit(title, category):
    """Check if title belongs in its assigned category. Returns (fits, penalty)."""
    low = title.lower()
    validator = CATEGORY_VALIDATORS.get(category)
    if not validator:
        return True, 0

    # Check hard rejects first
    reject_words = validator.get("reject_any", [])
    for word in reject_words:
        if word in low:
            return False, 40

    # Check if ANY required signal is present
    required = validator.get("required_any", [])
    if not required:
        return True, 0

    for signal in required:
        if signal in low:
            return True, 0

    # No category signal found — this story might be miscategorized
    return False, 25


# ── Helpers ───────────────────────────────────────────────────

# Domains known to serve high-resolution editorial images
HIGH_QUALITY_IMAGE_SOURCES = {
    "reuters.com", "apnews.com", "bbc.com", "bbc.co.uk", "cnn.com",
    "theguardian.com", "nytimes.com", "washingtonpost.com", "aljazeera.com",
    "france24.com", "espn.com", "skysports.com", "variety.com",
    "hollywoodreporter.com", "theverge.com", "techcrunch.com",
    "bloomberg.com", "cnbc.com", "nature.com", "nasa.gov",
    "nbcnews.com", "abcnews.go.com", "cbsnews.com", "foxnews.com", "news.un.org",
    "deadline.com", "rollingstone.com", "wired.com",
}


def is_high_quality_image_url(url):
    """Check if an image URL looks like it's high-resolution (not a thumbnail)."""
    if not url or not is_good_image(url):
        return False
    low = url.lower()
    # Prefer images with explicit large width params
    large_indicators = [
        "w=1200", "w=1600", "w=1400", "w=1000", "w=800",
        "width=1200", "width=1600", "width=1000", "width=800",
        "w_1200", "w_1600", "w_1000", "w_800",
        "/1200x", "/1600x", "/1000x", "/800x",
        "maxwidth=1200", "maxwidth=1600",
    ]
    if any(ind in low for ind in large_indicators):
        return True
    # Images from quality editorial sources are usually full-size
    for domain in HIGH_QUALITY_IMAGE_SOURCES:
        if domain in low:
            return True
    # Unsplash images are always high quality
    if "unsplash.com" in low:
        return True
    # If no size indicator but passes is_good_image, it's acceptable
    return True


def upscale_image_url(url):
    """
    Attempt to get a higher-resolution version of known image CDN URLs.
    Many sources serve thumbnails by default but support larger sizes via URL params.
    """
    if not url:
        return url

    # BBC: /standard/240/ → /standard/1200/
    if "ichef.bbci.co.uk" in url:
        url = re.sub(r'/standard/\d+/', '/standard/1200/', url)
        return url

    # Guardian: /500.jpg or similar → /1000.jpg
    if "media.guim.co.uk" in url:
        url = re.sub(r'/\d+\.jpg', '/1000.jpg', url)
        return url

    # CNN: super-169.jpg is already decent, but check for small variants
    if "cdn.cnn.com" in url:
        url = url.replace("-small-11.", "-super-169.").replace("-medium-plus-169.", "-super-169.")
        return url

    # Generic: if URL has a width param, try to bump it
    url = re.sub(r'[?&]w=\d+', lambda m: m.group(0).split('=')[0] + '=1200', url)
    url = re.sub(r'[?&]width=\d+', lambda m: m.group(0).split('=')[0] + '=1200', url)

    return url


def article_matches_cluster_topic(article, cluster):
    """Check if an article's title is relevant to the cluster's main story."""
    rep_title = cluster.get("representative_title", "").lower()
    art_title = article.get("title", "").lower()

    # Extract keywords (3+ char words, skip stopwords)
    rep_words = {w for w in re.findall(r'\b[a-z]{3,}\b', rep_title)} - STOPWORDS
    art_words = {w for w in re.findall(r'\b[a-z]{3,}\b', art_title)} - STOPWORDS

    # Extract entities (proper nouns — names, places, orgs)
    rep_entities = {e.lower() for e in re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', cluster.get("representative_title", ""))}
    art_entities = {e.lower() for e in re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', article.get("title", ""))}

    # If they share ANY entity (e.g. "Miami", "Trump", "Arsenal"), it's relevant
    if rep_entities and art_entities and (rep_entities & art_entities):
        return True

    if not rep_words or not art_words:
        return False

    # Keyword overlap — 15% is enough (titles use varied wording for same story)
    overlap = len(rep_words & art_words) / len(rep_words | art_words)
    return overlap >= 0.15


def pick_best_image(cluster, fallback_pool, index):
    """
    Pick the best image for a story cluster.
    Only considers images from articles that are actually about the cluster's topic.
    Priority:
      1. High-res image from a trusted editorial source (upscaled if needed)
      2. Any valid image with explicit large-size in URL
      3. Upscaled version of any valid cluster image
      4. Unsplash fallback (always crisp at 1600px)
    """
    articles = cluster.get("articles", [])

    # Filter to only articles relevant to the cluster's story
    relevant_articles = [a for a in articles if article_matches_cluster_topic(a, cluster)]
    # If nothing matched (e.g. singleton), use all articles
    if not relevant_articles:
        relevant_articles = articles

    # First pass: images from high-quality editorial sources, upscaled
    for a in relevant_articles:
        img = a.get("image_url", "")
        domain = a.get("domain", "")
        if img and is_good_image(img) and domain in HIGH_QUALITY_IMAGE_SOURCES:
            return upscale_image_url(img)

    # Second pass: any image with explicit large-size indicators
    for a in relevant_articles:
        img = a.get("image_url", "")
        if img and is_good_image(img):
            low = img.lower()
            large_indicators = ["w=1200", "w=1600", "w=1000", "w=800",
                                "width=1200", "width=1600", "/1200x", "/1600x"]
            if any(ind in low for ind in large_indicators):
                return img

    # Third pass: any valid image from relevant articles, upscaled
    for a in relevant_articles:
        img = a.get("image_url", "")
        if img and is_good_image(img):
            upscaled = upscale_image_url(img)
            tiny_patterns = ["gdelt-gkg", "newsapi.org", "google.com/amp"]
            if not any(p in upscaled.lower() for p in tiny_patterns):
                return upscaled

    # Fallback: Unsplash (always high-res and crisp)
    return fallback_pool[index % len(fallback_pool)]


def get_or_create(db, model, filter_kwargs, create_kwargs=None):
    instance = db.query(model).filter_by(**filter_kwargs).first()
    if not instance:
        all_kwargs = {**filter_kwargs, **(create_kwargs or {})}
        instance = model(**all_kwargs)
        db.add(instance)
        db.commit()
        db.refresh(instance)
    return instance


OPENROUTER_KEY = os.environ.get("OPENROUTER_API_KEY", "")

def groq_call(prompt, max_tokens=2048):
    # Try Groq first
    if GROQ_KEY:
        resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"},
            json={"model": "llama-3.1-8b-instant", "messages": [{"role": "user", "content": prompt}], "max_tokens": max_tokens, "temperature": 0.3},
            timeout=30,
        )
        if resp.status_code == 200:
            return resp.json()["choices"][0]["message"]["content"].strip()
        print(f"    Groq {resp.status_code}", end="")
    # Fallback to OpenRouter
    if OPENROUTER_KEY:
        resp = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENROUTER_KEY}", "Content-Type": "application/json"},
            json={"model": "google/gemma-4-26b-a4b-it:free", "messages": [{"role": "user", "content": prompt}], "max_tokens": max_tokens, "temperature": 0.3},
            timeout=30,
        )
        if resp.status_code == 200:
            print(" → OpenRouter")
            return resp.json()["choices"][0]["message"]["content"].strip()
        print(f" → OpenRouter {resp.status_code}")
    return None


def is_good_image(url):
    """Filter out thumbnails, logos, tracking pixels, and low-quality images."""
    if not url or not url.startswith("http"):
        return False
    low = url.lower()
    # Reject logos, placeholders, tracking pixels
    bad = ["logo", "avatar", "icon", "favicon", "default", "placeholder", "1x1",
           "pixel", "blank", "spacer", "tracking", "badge", "button", "widget"]
    if any(b in low for b in bad):
        return False
    # Reject known thumbnail patterns (small/blurry images)
    thumb_patterns = [
        "/thumbnail/", "/thumbs/", "/thumb_", "-thumb.", "_thumb.",
        "/small/", "/tiny/", "-small.", "_small.", "-sm.",
        "width=150", "width=200", "width=100", "w=150", "w=200", "w=100",
        "w_150", "w_200", "w_100", "/150x", "/200x", "/100x",
        "resize=150", "resize=200", "maxwidth=200", "maxwidth=150",
        "s=150", "s=200", "size=small", "size=thumb",
        "/standard/240/", "/standard/120/", "/standard/96/",
    ]
    if any(p in low for p in thumb_patterns):
        return False
    # Reject very short URLs (often tracking redirects)
    if len(url) < 30:
        return False
    return True


def minutes_ago(dt, now):
    if isinstance(dt, str):
        try:
            if "T" in dt:
                dt = datetime.fromisoformat(dt.replace("Z", "+00:00"))
            else:
                dt = datetime.strptime(dt[:14], "%Y%m%d%H%M%S").replace(tzinfo=timezone.utc)
        except (ValueError, IndexError):
            return 9999
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return max(0, (now - dt).total_seconds() / 60)


# ── Phase 1: Collect ─────────────────────────────────────────

def fetch_all_articles():
    articles = []

    # GDELT
    print("  GDELT...")
    gdelt_queries = [
        "breaking news world", "crisis conflict war", "ukraine russia military",
        "iran israel middle east", "nato troops europe", "economy markets trade",
        "stock market crash rally", "oil prices energy", "artificial intelligence",
        "cybersecurity hack", "tech startup", "space nasa mars",
        "climate change global warming", "scientific discovery", "pandemic disease",
        "mental health crisis", "NBA NFL championship", "world cup olympics",
        "UFC boxing MMA", "formula grand prix", "movie film blockbuster",
        "music concert festival", "celebrity culture fashion", "streaming netflix",
        "election government summit", "earthquake hurricane disaster",
    ]
    for query in gdelt_queries:
        try:
            resp = requests.get("https://api.gdeltproject.org/api/v2/doc/doc",
                params={"query": f"{query} sourcelang:english", "mode": "ArtList", "maxrecords": 50, "format": "json", "sort": "DateDesc", "timespan": "72h"}, timeout=15)
            if resp.status_code == 200:
                for item in resp.json().get("articles", []):
                    title = item.get("title", "").strip()
                    if title and len(title) > 15:
                        articles.append({
                            "title": title, "url": item.get("url", ""),
                            "source_name": item.get("domain", "Unknown"), "domain": item.get("domain", ""),
                            "country_code": (item.get("sourcecountry", "US") or "US")[:2].upper(),
                            "published_at": item.get("seendate", ""), "image_url": item.get("socialimage", ""),
                            "known_category": "", "source_type": "gdelt",
                        })
        except Exception:
            pass
        time.sleep(0.3)

    # NewsAPI — fetch from multiple countries for global coverage
    if NEWSAPI_KEY:
        print("  NewsAPI...")
        cat_map = {"general": "world", "business": "business", "technology": "technology", "science": "science", "health": "health", "sports": "sports", "entertainment": "entertainment"}
        newsapi_countries = [
            ("us", "US"), ("gb", "GB"), ("au", "AU"), ("ca", "CA"),
            ("in", "IN"), ("de", "DE"), ("fr", "FR"), ("ae", "AE"),
        ]
        for country_code_lower, cc_upper in newsapi_countries:
            for cat in cat_map:
                try:
                    resp = requests.get("https://newsapi.org/v2/top-headlines",
                        params={"country": country_code_lower, "category": cat, "apiKey": NEWSAPI_KEY, "pageSize": 10})
                    if resp.status_code == 200:
                        for item in resp.json().get("articles", []):
                            if not item.get("title") or item["title"] == "[Removed]":
                                continue
                            title = re.sub(r"\s*[-–—|]\s*[A-Z][A-Za-z0-9\s\'\.\,\&\!]+$", "", item["title"]).strip()
                            domain = ""
                            try:
                                d = urlparse(item.get("url", "")).netloc
                                domain = d[4:] if d.startswith("www.") else d
                            except Exception:
                                pass
                            articles.append({
                                "title": title, "url": item.get("url", ""),
                                "source_name": item.get("source", {}).get("name", "Unknown"), "domain": domain,
                                "country_code": cc_upper, "published_at": item.get("publishedAt", ""),
                                "image_url": item.get("urlToImage", ""), "known_category": cat_map[cat], "source_type": "newsapi",
                            })
                except Exception:
                    pass
                time.sleep(0.15)

    # RSS feeds — expanded pool for 2000+ articles per run
    print("  RSS feeds...")
    rss_feeds = {
        # ── Google News category feeds ──
        "Google News": ("https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en", "world", "US"),
        "Google Business": ("https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en-US", "business", "US"),
        "Google Tech": ("https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB?hl=en-US", "technology", "US"),
        "Google Science": ("https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y1RjU0FtVnVHZ0pWVXlnQVAB?hl=en-US", "science", "US"),
        "Google Health": ("https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNR3QwTlRFU0FtVnVLQUFQAQ?hl=en-US", "health", "US"),
        "Google Sports": ("https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnVHZ0pWVXlnQVAB?hl=en-US", "sports", "US"),
        "Google Entertainment": ("https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0FtVnVHZ0pWVXlnQVAB?hl=en-US", "entertainment", "US"),
        # ── BBC category feeds ──
        "BBC World": ("https://feeds.bbci.co.uk/news/world/rss.xml", "world", "GB"),
        "BBC Business": ("https://feeds.bbci.co.uk/news/business/rss.xml", "business", "GB"),
        "BBC Tech": ("https://feeds.bbci.co.uk/news/technology/rss.xml", "technology", "GB"),
        "BBC Science": ("https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", "science", "GB"),
        "BBC Health": ("https://feeds.bbci.co.uk/news/health/rss.xml", "health", "GB"),
        "BBC Entertainment": ("https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", "entertainment", "GB"),
        "BBC Sport": ("https://feeds.bbci.co.uk/sport/rss.xml", "sports", "GB"),
        # ── Wire services ──
        "Al Jazeera": ("https://www.aljazeera.com/xml/rss/all.xml", "world", "AE"),
        "NPR": ("https://feeds.npr.org/1001/rss.xml", "world", "US"),
        "CNN Top": ("http://rss.cnn.com/rss/edition.rss", "world", "US"),
        "Reuters World": ("https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best", "world", "US"),
        # ── Sports feeds ──
        "ESPN Top": ("https://www.espn.com/espn/rss/news", "sports", "US"),
        "ESPN NFL": ("https://www.espn.com/espn/rss/nfl/news", "sports", "US"),
        "ESPN NBA": ("https://www.espn.com/espn/rss/nba/news", "sports", "US"),
        "ESPN Soccer": ("https://www.espn.com/espn/rss/soccer/news", "sports", "US"),
        "ESPN MLB": ("https://www.espn.com/espn/rss/mlb/news", "sports", "US"),
        "Sky Sports": ("https://www.skysports.com/rss/12040", "sports", "GB"),
        "Sky Football": ("https://www.skysports.com/rss/11095", "sports", "GB"),
        "Sky F1": ("https://www.skysports.com/rss/11094", "sports", "GB"),
        "CBS Sports": ("https://www.cbssports.com/rss/headlines", "sports", "US"),
        # ── Entertainment feeds ──
        "Variety": ("https://variety.com/feed/", "entertainment", "US"),
        "Hollywood Reporter": ("https://www.hollywoodreporter.com/feed/", "entertainment", "US"),
        "Deadline": ("https://deadline.com/feed/", "entertainment", "US"),
        "Billboard": ("https://www.billboard.com/feed/", "entertainment", "US"),
        "Rolling Stone": ("https://www.rollingstone.com/feed/", "entertainment", "US"),
        "Pitchfork": ("https://pitchfork.com/feed/feed-news/rss", "entertainment", "US"),
        "EW": ("https://ew.com/feed/", "entertainment", "US"),
        # ── Technology feeds ──
        "The Verge": ("https://www.theverge.com/rss/index.xml", "technology", "US"),
        "TechCrunch": ("https://techcrunch.com/feed/", "technology", "US"),
        "Wired": ("https://www.wired.com/feed/rss", "technology", "US"),
        "Ars Technica": ("https://feeds.arstechnica.com/arstechnica/index", "technology", "US"),
        "Engadget": ("https://www.engadget.com/rss.xml", "technology", "US"),
        "CNET": ("https://www.cnet.com/rss/news/", "technology", "US"),
        "MIT Tech Review": ("https://www.technologyreview.com/feed/", "technology", "US"),
        # ── Science feeds ──
        "Science Daily": ("https://www.sciencedaily.com/rss/all.xml", "science", "US"),
        "NASA Breaking": ("https://www.nasa.gov/rss/dyn/breaking_news.rss", "science", "US"),
        "Space.com": ("https://www.space.com/feeds/all", "science", "US"),
        "Phys.org": ("https://phys.org/rss-feed/", "science", "US"),
        "New Scientist": ("https://www.newscientist.com/feed/home/", "science", "GB"),
        "Nature News": ("https://www.nature.com/nature.rss", "science", "GB"),
        # ── Health feeds ──
        "STAT News": ("https://www.statnews.com/feed/", "health", "US"),
        "Medical News Today": ("https://www.medicalnewstoday.com/newsfeeds/rss", "health", "US"),
        "Health News": ("https://www.sciencedaily.com/rss/health_medicine.xml", "health", "US"),
        "WHO News": ("https://www.who.int/feeds/entity/news/en/rss.xml", "health", "US"),
        # ── United Nations ──
        "UN News Global": ("https://news.un.org/feed/subscribe/en/news/all/rss.xml", "world", "US"),
        "UN News Peace": ("https://news.un.org/feed/subscribe/en/news/topic/peace-and-security/feed/rss.xml", "world", "US"),
        "UN News Climate": ("https://news.un.org/feed/subscribe/en/news/topic/climate-change/feed/rss.xml", "science", "US"),
        "UN News Health": ("https://news.un.org/feed/subscribe/en/news/topic/health/feed/rss.xml", "health", "US"),
        "UN News Rights": ("https://news.un.org/feed/subscribe/en/news/topic/human-rights/feed/rss.xml", "world", "US"),
        "UN News Humanitarian": ("https://news.un.org/feed/subscribe/en/news/topic/humanitarian-aid/feed/rss.xml", "world", "US"),
        "UN News Economic": ("https://news.un.org/feed/subscribe/en/news/topic/economic-development/feed/rss.xml", "business", "US"),
        "UN News SDGs": ("https://news.un.org/feed/subscribe/en/news/topic/sdgs/feed/rss.xml", "world", "US"),
        # ── Business feeds ──
        "CNBC Top": ("https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114", "business", "US"),
        "CNBC Markets": ("https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258", "business", "US"),
        "MarketWatch": ("https://feeds.marketwatch.com/marketwatch/topstories/", "business", "US"),
        "Fortune": ("https://fortune.com/feed/", "business", "US"),
        "Business Insider": ("https://markets.businessinsider.com/rss/news", "business", "US"),
        # ── International sources ──────────────────────────
        # France
        "France24 World": ("https://www.france24.com/en/rss", "world", "FR"),
        "France24 Business": ("https://www.france24.com/en/business/rss", "business", "FR"),
        "France24 Tech": ("https://www.france24.com/en/technology/rss", "technology", "FR"),
        "France24 Sport": ("https://www.france24.com/en/sport/rss", "sports", "FR"),
        "France24 Culture": ("https://www.france24.com/en/culture/rss", "entertainment", "FR"),
        # Germany
        "DW World": ("https://rss.dw.com/rdf/rss-en-world", "world", "DE"),
        "DW Business": ("https://rss.dw.com/rdf/rss-en-bus", "business", "DE"),
        "DW Science": ("https://rss.dw.com/rdf/rss-en-sci", "science", "DE"),
        "DW Sports": ("https://rss.dw.com/rdf/rss-en-sports", "sports", "DE"),
        "DW Culture": ("https://rss.dw.com/rdf/rss-en-cul", "entertainment", "DE"),
        # India
        "Times of India": ("https://timesofindia.indiatimes.com/rssfeedstopstories.cms", "world", "IN"),
        "NDTV World": ("https://feeds.feedburner.com/ndtvnews-world-news", "world", "IN"),
        "NDTV Business": ("https://feeds.feedburner.com/ndtvprofit-latest", "business", "IN"),
        "NDTV Tech": ("https://feeds.feedburner.com/gadgets360-latest", "technology", "IN"),
        "NDTV Sports": ("https://feeds.feedburner.com/ndtvsports-latest", "sports", "IN"),
        # Japan
        "Japan Times": ("https://www.japantimes.co.jp/feed/", "world", "JP"),
        "NHK World": ("https://www3.nhk.or.jp/nhkworld/en/news/feeds/", "world", "JP"),
        # Australia
        "ABC Australia": ("https://www.abc.net.au/news/feed/2942460/rss.xml", "world", "AU"),
        "ABC AU Business": ("https://www.abc.net.au/news/feed/51120/rss.xml", "business", "AU"),
        "ABC AU Science": ("https://www.abc.net.au/news/feed/2942482/rss.xml", "science", "AU"),
        "ABC AU Sport": ("https://www.abc.net.au/news/feed/2942474/rss.xml", "sports", "AU"),
        "Sydney Morning Herald": ("https://www.smh.com.au/rss/feed.xml", "world", "AU"),
        # Canada
        "CBC World": ("https://www.cbc.ca/webfeed/rss/rss-world", "world", "CA"),
        "CBC Business": ("https://www.cbc.ca/webfeed/rss/rss-business", "business", "CA"),
        "CBC Tech": ("https://www.cbc.ca/webfeed/rss/rss-technology", "technology", "CA"),
        "CBC Sports": ("https://www.cbc.ca/webfeed/rss/rss-sports", "sports", "CA"),
        # Middle East
        "Al Jazeera Business": ("https://www.aljazeera.com/xml/rss/all.xml", "business", "AE"),
        "Arab News": ("https://www.arabnews.com/rss.xml", "world", "SA"),
        "Jerusalem Post": ("https://www.jpost.com/rss/rssfeedsfrontpage.aspx", "world", "IL"),
        # Africa
        "Daily Maverick": ("https://www.dailymaverick.co.za/feed/", "world", "ZA"),
        "News24 SA": ("https://feeds.news24.com/articles/news24/TopStories/rss", "world", "ZA"),
        # Latin America
        "Buenos Aires Times": ("https://www.batimes.com.ar/feed", "world", "AR"),
        "Mexico News Daily": ("https://mexiconewsdaily.com/feed/", "world", "MX"),
        # Asia
        "South China Morning Post": ("https://www.scmp.com/rss/91/feed", "world", "CN"),
        "Straits Times": ("https://www.straitstimes.com/news/world/rss.xml", "world", "JP"),
        "Korea Herald": ("https://www.koreaherald.com/common/rss_xml.php?ct=102", "world", "KR"),
    }

    # Google News search feeds — targeted queries for deeper category coverage
    google_search_feeds = {
        "sports": [
            "NBA playoffs 2026", "NFL draft", "Premier League", "Champions League",
            "UFC fight", "Formula 1 Grand Prix", "MLB baseball", "tennis grand slam",
            "World Cup qualifying", "boxing championship", "Olympics 2026",
            "NHL playoffs", "MMA knockout", "cricket world", "golf masters",
        ],
        "entertainment": [
            "movie box office", "new album release", "Netflix series", "Oscar nominations",
            "celebrity news", "concert tour", "streaming premiere", "TV show cancelled",
            "Grammy awards", "video game release", "comic con", "Broadway opening",
            "Disney Marvel", "music festival", "podcast viral",
        ],
        "technology": [
            "artificial intelligence AI", "Apple iPhone", "cybersecurity breach",
            "startup funding", "electric vehicle EV", "social media platform",
            "quantum computing", "SpaceX launch", "Google AI", "Microsoft OpenAI",
            "chip semiconductor", "robot autonomous", "VR AR metaverse", "5G network",
        ],
        "science": [
            "NASA space discovery", "climate change research", "new species discovery",
            "CERN physics", "Mars rover", "James Webb telescope", "gene editing CRISPR",
            "earthquake volcano", "fossil discovery", "ocean deep sea",
            "renewable energy solar", "Arctic ice", "dinosaur paleontology",
        ],
        "health": [
            "FDA drug approval", "vaccine clinical trial", "cancer treatment breakthrough",
            "mental health crisis", "pandemic virus outbreak", "surgery breakthrough",
            "obesity treatment", "Alzheimer research", "antibiotic resistance",
            "public health WHO", "rare disease gene therapy",
        ],
        "business": [
            "stock market crash rally", "Federal Reserve interest rates",
            "tech layoffs hiring", "merger acquisition deal", "IPO stock",
            "cryptocurrency bitcoin", "oil prices OPEC", "trade war tariff",
            "housing market mortgage", "startup unicorn", "bank earnings",
        ],
        "world": [
            "Ukraine Russia war", "Middle East conflict", "NATO military",
            "China Taiwan", "election results", "UN Security Council",
            "refugee crisis", "nuclear weapons", "climate summit",
            "coup government", "protest revolution",
        ],
    }
    for cat, queries in google_search_feeds.items():
        for query in queries:
            encoded = query.replace(" ", "+")
            feed_url = f"https://news.google.com/rss/search?q={encoded}&hl=en-US&gl=US&ceid=US:en"
            rss_feeds[f"GSearch {cat} {query[:20]}"] = (feed_url, cat, "US")

    # Google News — international editions (English) for global coverage
    intl_google = [
        ("en-GB", "GB", "GB:en"), ("en-AU", "AU", "AU:en"), ("en-CA", "CA", "CA:en"),
        ("en-IN", "IN", "IN:en"), ("en-ZA", "ZA", "ZA:en"), ("en-SG", "SG", "SG:en"),
    ]
    for lang, cc, ceid in intl_google:
        rss_feeds[f"Google {cc} Top"] = (f"https://news.google.com/rss?hl={lang}&gl={cc}&ceid={ceid}", "world", cc)
    for name, (url, cat, cc) in rss_feeds.items():
        try:
            # Use requests with timeout, then parse — feedparser.parse(url) has no timeout
            rss_resp = requests.get(url, timeout=8, headers={"User-Agent": "Mozilla/5.0"})
            if rss_resp.status_code != 200:
                continue
            feed = feedparser.parse(rss_resp.content)
            is_google_feed = "google" in name.lower() or "GSearch" in name
            for entry in feed.entries[:20]:
                raw_title = entry.get("title", "").strip()
                if not raw_title or len(raw_title) < 15:
                    continue
                # Extract real publisher from Google News RSS
                real_publisher = ""
                if is_google_feed:
                    # Prefer feedparser's source field (most reliable)
                    if hasattr(entry, "source") and entry.source:
                        real_publisher = entry.source.get("title", "") if isinstance(entry.source, dict) else ""
                    # Fallback: extract from title suffix ("headline - Publisher")
                    if not real_publisher:
                        pub_match = re.search(r'\s[-–—]\s*([A-Z][A-Za-z0-9\s\'\.\,\&\!]+)$', raw_title)
                        if pub_match:
                            real_publisher = pub_match.group(1).strip()
                title = re.sub(r"\s*[-–—]\s*[A-Z][A-Za-z0-9\s\'\.\,\&\!]+$", "", raw_title).strip()
                link = entry.get("link", "")
                domain = urlparse(link).netloc
                domain = domain[4:] if domain.startswith("www.") else domain
                # Use real publisher for Google feeds, otherwise use feed name
                source_name = real_publisher if real_publisher else name.split(" ")[0]
                # For Google feeds, try to get domain from the actual article URL
                if is_google_feed and domain == "news.google.com":
                    # Google redirects — domain stays as google, use publisher name as domain
                    domain = real_publisher.lower().replace(" ", "").replace("the", "") + ".com" if real_publisher else domain
                image = ""
                if hasattr(entry, "media_content") and entry.media_content:
                    image = entry.media_content[0].get("url", "")
                elif hasattr(entry, "media_thumbnail") and entry.media_thumbnail:
                    image = entry.media_thumbnail[0].get("url", "")
                articles.append({
                    "title": title, "url": link,
                    "source_name": source_name, "domain": domain or f"{name.split(' ')[0].lower()}.com",
                    "country_code": cc, "published_at": entry.get("published", ""),
                    "image_url": image, "known_category": cat, "source_type": "rss",
                })
        except Exception:
            pass

    # Guardian
    print("  Guardian...")
    guardian_map = {"world": "world", "business": "business", "technology": "technology", "science": "science", "society": "health", "sport": "sports", "culture": "entertainment"}
    for section, cat in guardian_map.items():
        try:
            resp = requests.get("https://content.guardianapis.com/search",
                params={"section": section, "api-key": GUARDIAN_KEY, "show-fields": "headline,trailText,thumbnail", "page-size": 15, "order-by": "newest"})
            if resp.status_code == 200:
                for item in resp.json().get("response", {}).get("results", []):
                    fields = item.get("fields", {})
                    articles.append({
                        "title": fields.get("headline", item.get("webTitle", "")), "url": item.get("webUrl", ""),
                        "source_name": "The Guardian", "domain": "theguardian.com",
                        "country_code": "GB", "published_at": item.get("webPublicationDate", ""),
                        "image_url": fields.get("thumbnail", ""), "known_category": cat, "source_type": "guardian",
                    })
        except Exception:
            pass

    # Dedup
    seen_urls, seen_titles = set(), set()
    unique = []
    for a in articles:
        tkey = a["title"].lower().strip()[:50]
        if a["url"] not in seen_urls and tkey not in seen_titles and len(a["title"]) > 15:
            seen_urls.add(a["url"])
            seen_titles.add(tkey)
            unique.append(a)
    return unique


# ── Phase 2: Extract keywords + entities ──────────────────────

def extract_keywords(title):
    words = re.findall(r"\b[a-zA-Z][a-zA-Z]{2,}\b", title.lower())
    return {w for w in words if w not in STOPWORDS}

def extract_entities(title):
    matches = re.findall(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b", title)
    return {m.strip() for m in matches if len(m.strip()) > 2}

def enrich_articles(articles):
    for a in articles:
        a["keywords"] = extract_keywords(a["title"])
        a["entities"] = extract_entities(a["title"])
    return articles


# ── Phase 3: AI classify ─────────────────────────────────────

def ai_classify_batch(articles):
    """Classify articles in batches of 50 using Groq."""
    results = {}
    batch_size = 50
    for i in range(0, len(articles), batch_size):
        batch = articles[i:i + batch_size]
        # Use known_category if available
        for a in batch:
            if a.get("known_category") and a["known_category"] in CATEGORY_NAMES:
                results[a["url"]] = a["known_category"]

        # Classify unknowns with Groq
        unknowns = [(j, a) for j, a in enumerate(batch) if a["url"] not in results]
        if not unknowns:
            continue

        lines = "\n".join(f"{j}: {a['title']}" for j, a in unknowns)
        prompt = f"""Classify each headline into ONE category: world, business, technology, science, health, sports, entertainment

Rules:
- world = war, military, geopolitics, diplomacy, government, elections, immigration
- business = markets, economy, trade, corporate, finance, earnings
- technology = AI, tech companies, cybersecurity, software, crypto
- science = space, NASA, climate, environment, research, discoveries
- health = medicine, disease, drugs, mental health, wellness
- sports = ANY sport/athlete/team/game/match/UFC/boxing/F1/NBA/NFL
- entertainment = movies, TV, music, celebrities, streaming, gaming, comedy, fashion

Return ONLY: number: category

{lines}"""

        result = groq_call(prompt, max_tokens=1024)
        if result:
            for line in result.strip().split("\n"):
                match = re.match(r'(\d+)\s*[:\.]\s*(\w+)', line.strip())
                if match:
                    idx = int(match.group(1))
                    cat = match.group(2).lower().strip()
                    if cat in CATEGORY_NAMES:
                        matching = [a for j, a in unknowns if j == idx]
                        if matching:
                            results[matching[0]["url"]] = cat
        time.sleep(8)

    # Apply
    for a in articles:
        a["category"] = results.get(a["url"], a.get("known_category", "world"))
        if a["category"] not in CATEGORY_NAMES:
            a["category"] = "world"

    return articles


# ── Phase 4: Cluster ──────────────────────────────────────────

def jaccard(a, b):
    if not a or not b:
        return 0
    return len(a & b) / len(a | b)

def article_similarity(a, b):
    # HARD RULE: different categories never cluster
    if a.get("category") != b.get("category"):
        return 0.0

    entity_score = jaccard(a.get("entities", set()), b.get("entities", set()))
    keyword_score = jaccard(a.get("keywords", set()), b.get("keywords", set()))

    # Must have at least SOME entity or keyword overlap to cluster
    # This prevents "The..." articles from grouping on shared filler words
    if entity_score == 0 and keyword_score < 0.15:
        return 0.0

    return entity_score * 0.55 + keyword_score * 0.45

def cluster_articles(articles):
    clusters = []
    used = set()

    # Sort by source type priority: rss > newsapi > guardian > gdelt
    priority = {"rss": 0, "newsapi": 1, "guardian": 2, "gdelt": 3}
    articles.sort(key=lambda a: priority.get(a.get("source_type", "gdelt"), 3))

    for i, article in enumerate(articles):
        if i in used:
            continue
        cluster = [article]
        used.add(i)

        threshold = 0.38 if article.get("category") in ("sports", "entertainment") else 0.30

        for j, other in enumerate(articles):
            if j in used:
                continue
            if article_similarity(article, other) >= threshold:
                cluster.append(other)
                used.add(j)

        clusters.append({
            "articles": cluster,
            "category": cluster[0]["category"],
            "representative_title": cluster[0]["title"],
            "image_url": next((a["image_url"] for a in cluster if is_good_image(a.get("image_url"))), ""),
        })

    return clusters


# ── Phase 5: Score ────────────────────────────────────────────

def score_velocity(cluster, now):
    articles = cluster["articles"]
    last_2h = sum(1 for a in articles if minutes_ago(a.get("published_at", ""), now) <= 120)
    last_6h = sum(1 for a in articles if minutes_ago(a.get("published_at", ""), now) <= 360)
    prev_6h = sum(1 for a in articles if 360 < minutes_ago(a.get("published_at", ""), now) <= 720)
    spike = last_6h / max(prev_6h, 1)
    return min(last_2h * 10 + min(spike * 12, 30), 100)

def score_authority(cluster):
    cat = cluster["category"]
    auth_map = CATEGORY_AUTHORITY.get(cat, {})
    sources = {a["domain"] for a in cluster["articles"]}
    scores = [auth_map.get(d, 40) for d in sources]
    if not scores:
        return 0
    return min(max(scores) * 0.6 + (sum(scores) / len(scores)) * 0.4, 100)

def score_strength(cluster):
    articles = cluster["articles"]
    n = len(articles)
    sources = len({a["domain"] for a in articles})
    countries = len({a.get("country_code", "US") for a in articles})
    return min(min(n * 4, 35) + min(sources * 7, 40) + min(countries * 4, 25), 100)

def score_freshness(cluster, now):
    times = [minutes_ago(a.get("published_at", ""), now) for a in cluster["articles"]]
    newest = min(times) if times else 9999
    if newest <= 30: return 100
    if newest <= 60: return 85
    if newest <= 180: return 70
    if newest <= 360: return 55
    if newest <= 720: return 35
    if newest <= 1440: return 20
    return 5

def score_engagement(cluster):
    text = " ".join(a["title"].lower() for a in cluster["articles"])
    cat = cluster.get("category", "world")

    # Base engagement words (universal)
    score = sum(v for w, v in ENGAGEMENT_WORDS.items() if w in text)

    # Category-specific engagement boost
    cat_words = CATEGORY_ENGAGEMENT.get(cat, {})
    cat_score = sum(v for w, v in cat_words.items() if w in text)
    score += cat_score

    entities = set()
    for a in cluster["articles"]:
        entities |= a.get("entities", set())
    if len(entities) >= 3:
        score += 15
    rep = cluster["representative_title"]
    if 35 <= len(rep) <= 90:
        score += 10
    return min(score, 100)

def score_penalties(cluster):
    penalty = 0
    articles = cluster["articles"]
    # No single-article penalty — singletons are handled by the two-lane system
    sources = len({a["domain"] for a in articles})
    if len(articles) >= 4 and sources <= 2:
        penalty += 20
    if not cluster.get("image_url"):
        penalty += 8
    generic = {"update", "latest", "live", "news", "report"}
    title_words = set(cluster["representative_title"].lower().split())
    if len(title_words & generic) >= 2:
        penalty += 10
    return penalty

def calculate_final_score(cluster, now):
    v = score_velocity(cluster, now)
    a = score_authority(cluster)
    s = score_strength(cluster)
    f = score_freshness(cluster, now)
    e = score_engagement(cluster)
    p = score_penalties(cluster)
    final = v * 0.25 + a * 0.22 + s * 0.20 + f * 0.15 + e * 0.10 - p
    cluster["trending_score"] = max(0, min(round(final), 100))
    cluster["source_count"] = len({a_["domain"] for a_ in cluster["articles"]})
    cluster["country_count"] = len({a_.get("country_code", "US") for a_ in cluster["articles"]})
    cluster["article_count"] = len(cluster["articles"])
    return cluster["trending_score"]


# ── Phase 6: Quality-Gated Two-Lane Ranking ─────────────────
#
# Every cluster/singleton passes through:
#   1. Content type filter — reject deals, guides, horoscopes, schedules
#   2. Category validation — must contain domain-relevant signals
#   3. Two-lane merge — clusters first, then qualified singletons
#   4. Quality gate — only items scoring above threshold make the Top Events
#
# This ensures the Top 10 per category feels like "the most important
# story worlds being watched right now" — not random articles.

MIN_STORIES_PER_CATEGORY = 10


def is_filler_content(cluster):
    """Check if a cluster is filler content (deal, guide, horoscope, etc.)."""
    title = cluster["representative_title"]
    content_type = classify_content_type(title)
    cluster["content_type"] = content_type
    return content_type != "news"


def cluster_quality_score(cluster):
    """
    Calculate a quality gate score for ranking.
    Factors: trending_score + category fit + content type + article count.
    Items below threshold get rejected from Top Events.
    """
    cat = cluster.get("category", "world")
    title = cluster["representative_title"]
    base_score = cluster.get("trending_score", 0)

    # Content type penalty
    content_type = cluster.get("content_type", classify_content_type(title))
    type_penalties = {
        "deal": -50, "guide": -40, "horoscope": -50, "schedule": -30,
        "lifestyle": -35, "product_review": -20, "opinion": -15, "news": 0,
    }
    type_adj = type_penalties.get(content_type, 0)

    # Category fit check
    fits, cat_penalty = validate_category_fit(title, cat)
    cat_adj = -cat_penalty if not fits else 5  # Bonus for strong category fit

    # Multi-article cluster bonus (real story = more sources covering it)
    article_count = len(cluster.get("articles", []))
    cluster_bonus = min(article_count * 3, 20) if article_count >= 2 else 0

    # Source diversity bonus
    sources = len({a.get("domain", "") for a in cluster.get("articles", [])})
    diversity_bonus = min(sources * 4, 15) if sources >= 2 else 0

    quality = base_score + type_adj + cat_adj + cluster_bonus + diversity_bonus
    cluster["quality_score"] = quality
    return quality


def singleton_quality_score(cluster):
    """Score a single-article cluster for Lane 2 eligibility."""
    article = cluster["articles"][0]
    cat = cluster.get("category", "world")
    domain = article.get("domain", "")
    title = article.get("title", "")

    # Hard reject filler
    content_type = classify_content_type(title)
    cluster["content_type"] = content_type
    if content_type != "news":
        return -100

    # Hard reject category misfits
    fits, penalty = validate_category_fit(title, cat)
    if not fits and penalty >= 30:
        return -50

    # Authority from known sources
    auth_map = CATEGORY_AUTHORITY.get(cat, {})
    authority = auth_map.get(domain, 25)

    # Engagement from category-specific words
    text = title.lower()
    engagement = sum(v for w, v in CATEGORY_ENGAGEMENT.get(cat, {}).items() if w in text)
    engagement += sum(v for w, v in ENGAGEMENT_WORDS.items() if w in text)

    # Image and title quality
    image_bonus = 5 if is_good_image(article.get("image_url")) else 0
    title_bonus = 8 if 30 <= len(title) <= 100 else 0

    # Category fit bonus
    fit_bonus = 10 if fits else -15

    return authority * 0.35 + min(engagement, 50) * 0.3 + image_bonus + title_bonus + fit_bonus


def rank_categories(clusters):
    by_cat = defaultdict(list)
    for c in clusters:
        by_cat[c["category"]].append(c)

    ranked = {}
    for cat, cat_clusters in by_cat.items():
        lane1_clusters = []
        lane2_singletons = []
        rejected_filler = 0
        rejected_miscat = 0

        used_families = set()

        for c in cat_clusters:
            family = c["representative_title"][:30].lower()
            if family in used_families:
                continue
            used_families.add(family)

            # Step 1: Reject filler content
            if is_filler_content(c):
                rejected_filler += 1
                continue

            # Step 2: Validate category fit
            fits, penalty = validate_category_fit(c["representative_title"], cat)
            if not fits and penalty >= 30:
                rejected_miscat += 1
                continue

            if len(c["articles"]) >= 2:
                lane1_clusters.append(c)
            else:
                lane2_singletons.append(c)

        # Score and sort Lane 1 by quality
        for c in lane1_clusters:
            cluster_quality_score(c)
        lane1_clusters.sort(key=lambda c: c["quality_score"], reverse=True)

        # Score and sort Lane 2
        for s in lane2_singletons:
            s["singleton_quality"] = singleton_quality_score(s)
        lane2_singletons.sort(key=lambda c: c.get("singleton_quality", 0), reverse=True)

        # Filter Lane 2: only keep high-quality singletons that fit the category
        lane2_qualified = [s for s in lane2_singletons if s.get("singleton_quality", 0) >= 25]

        # Merge: clusters first, then fill with singletons
        final = lane1_clusters[:]
        needed = max(0, MIN_STORIES_PER_CATEGORY - len(final))
        if needed > 0:
            final.extend(lane2_qualified[:needed])
        else:
            # Add up to 3 top singletons for diversity
            final.extend(lane2_qualified[:3])

        # Final sort: clusters keep priority
        for c in final:
            if len(c["articles"]) >= 2:
                c["_rank_score"] = c.get("quality_score", c["trending_score"])
            else:
                c["_rank_score"] = c.get("singleton_quality", 0) * 0.7

        final.sort(key=lambda c: c["_rank_score"], reverse=True)

        ranked[cat] = final
        print(f"    {cat}: {len(lane1_clusters)} clusters + {len(lane2_qualified)} singletons"
              f" (rejected {rejected_filler} filler, {rejected_miscat} miscat) → {len(final)} stories")

    return ranked


# ── Phase 7: AI polish top clusters ──────────────────────────

def ai_polish_cluster(cluster):
    headlines = "\n".join(f"- {a['title']}" for a in cluster["articles"][:6])
    prompt = f"""You are the senior editor at Horizon News, a premium global news briefing app.

Write a title and hook for this story cluster. Use ONLY facts from the headlines below.

Category: {cluster['category']}
Sources covering: {cluster['source_count']}
Headlines:
{headlines}

TITLE RULES (strict):
- Exactly 5-9 words
- Name the specific event, actor, or consequence
- No filler words: "tensions rise", "chaos unfolds", "shakes up", "raises concerns"
- No colons unless separating location from event
- No AI-sounding phrases: "amid growing", "sparks debate", "sends shockwaves"
- Sound like Reuters/AP, not a blog
- Examples of GOOD titles:
  "Ukraine Strikes Major Russian Oil Port"
  "FDA Approves New Alzheimer's Drug"
  "Arsenal Move Six Points Clear After Fulham Win"

HOOK RULES:
- Exactly 2 sentences, 30-50 words total
- First sentence: the hard fact (what happened)
- Second sentence: why it matters or what's next
- No adjectives like "shocking", "stunning", "unprecedented"
- Only facts from the headlines above

Return this EXACT format:
===TITLE===
[your title here]
===HOOK===
[your hook here]"""

    content = groq_call(prompt, max_tokens=256)
    if not content:
        return None

    title_match = re.search(r'===TITLE===\s*(.+?)(?=\s*===)', content, re.DOTALL)
    hook_match = re.search(r'===HOOK===\s*(.+)', content, re.DOTALL)

    result = {}
    if title_match:
        result["title"] = title_match.group(1).strip()
    else:
        first = re.match(r'===(.+?)===', content)
        if first and first.group(1).upper() not in ("HOOK",):
            result["title"] = first.group(1).strip()

    if hook_match:
        result["hook"] = hook_match.group(1).strip().replace("===", "").strip()

    return result if "title" in result else None


# ── Main ──────────────────────────────────────────────────────

def main():
    if not GROQ_KEY:
        print("ERROR: Set GROQ_API_KEY in .env")
        return

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    now = datetime.now(timezone.utc)

    try:
        # Setup
        regions = {}
        for code, info in COUNTRIES_CONFIG.items():
            rname = info["region"]
            if rname not in regions:
                regions[rname] = get_or_create(db, Region, {"name": rname})
        countries = {}
        for code, info in COUNTRIES_CONFIG.items():
            countries[code] = get_or_create(db, Country, {"code": code}, {"name": info["name"], "language": info["language"]})
        topics = {}
        for slug, name in CATEGORY_NAMES.items():
            topics[slug] = get_or_create(db, Topic, {"slug": slug}, {"name": name})

        # Phase 1
        print("Phase 1: Collecting articles...")
        all_articles = fetch_all_articles()
        print(f"  Total: {len(all_articles)} unique articles\n")

        # Phase 2
        print("Phase 2: Extracting keywords & entities...")
        all_articles = enrich_articles(all_articles)
        print(f"  Done\n")

        # Phase 3
        print("Phase 3: AI-classifying articles...")
        all_articles = ai_classify_batch(all_articles)
        cat_counts = defaultdict(int)
        for a in all_articles:
            cat_counts[a["category"]] += 1
        for cat, count in sorted(cat_counts.items()):
            print(f"  {cat}: {count}")

        # Phase 4
        print("\nPhase 4: Clustering...")
        clusters = cluster_articles(all_articles)
        print(f"  {len(clusters)} clusters formed")

        # Phase 5
        print("\nPhase 5: Scoring...")
        for c in clusters:
            calculate_final_score(c, now)

        # Phase 6
        print("\nPhase 6: Two-lane ranking per category...")
        ranked = rank_categories(clusters)
        for cat, cat_clusters in ranked.items():
            top = cat_clusters[0] if cat_clusters else None
            print(f"  {cat}: {len(cat_clusters)} total | #1: [{top['trending_score'] if top else 0}] {top['representative_title'][:50] if top else 'none'}...")

        # Phase 7
        print("\nPhase 7: AI polishing top stories (top 3 per category)...")
        polished_cats = set()
        for cat in CATEGORY_NAMES:
            if cat not in ranked or not ranked[cat]:
                continue
            # Polish top 3 clusters per category for premium titles
            for rank_idx in range(min(3, len(ranked[cat]))):
                cluster = ranked[cat][rank_idx]
                # Only polish multi-article clusters (singletons keep their real title)
                if len(cluster["articles"]) < 2:
                    cluster["polished_title"] = cluster["representative_title"]
                    continue
                print(f"  Polishing {cat} #{rank_idx + 1}...")
                result = ai_polish_cluster(cluster)
                time.sleep(10)
                if result:
                    cluster["polished_title"] = result.get("title", cluster["representative_title"])
                    cluster["hook"] = result.get("hook", "")
                    polished_cats.add(cat)
                    print(f"    ✓ {cluster['polished_title']}")
                else:
                    cluster["polished_title"] = cluster["representative_title"]
                    print(f"    ✗ Using original title")

        # Store everything
        print("\nStoring...")
        total_stories = 0
        total_articles = 0

        for cat, cat_clusters in ranked.items():
            topic = topics[cat]
            cat_name = CATEGORY_NAMES[cat]
            images = CATEGORY_IMAGE_POOLS.get(cat, CATEGORY_IMAGE_POOLS["world"])

            for ci, cluster in enumerate(cat_clusters):
                title = cluster.get("polished_title", cluster["representative_title"])
                clean_title = re.sub(r'\s*[|]\s*.*$', '', title).strip()
                if len(clean_title) > 60:
                    clean_title = clean_title[:57] + "..."

                # Pick best image — for top stories, search all articles in cluster
                chosen_image = pick_best_image(cluster, images, ci)

                # Build basic angles from article countries (for homepage flags)
                cluster_countries = {}
                for a in cluster["articles"]:
                    cc = a.get("country_code", "US")
                    cname = COUNTRIES_CONFIG.get(cc, {}).get("name", "")
                    if cname and cname not in cluster_countries:
                        cluster_countries[cname] = a.get("source_name", "Unknown")
                seed_angles = json.dumps([
                    {"label": country_name, "type": "country", "summary": "", "source_names": [src]}
                    for country_name, src in list(cluster_countries.items())[:5]
                ]) if cluster_countries else None

                te = TopicEvent(
                    title=clean_title,
                    query=re.sub(r'[^a-z0-9]+', '-', clean_title.lower())[:50],
                    summary=cluster.get("hook", ""),
                    category=cat_name,
                    hook=cluster.get("hook", cluster["articles"][0]["title"] if cluster["articles"] else ""),
                    image_url=chosen_image,
                    trending_score=cluster["trending_score"],
                    article_count=cluster["article_count"],
                    source_count=cluster["source_count"],
                    country_count=cluster["country_count"],
                    angles=seed_angles,
                )
                db.add(te)
                db.commit()
                db.refresh(te)
                total_stories += 1

                for a in cluster["articles"]:
                    if db.query(Article).filter(Article.url == a["url"]).first():
                        continue
                    if db.query(Article).filter(Article.title == a["title"]).first():
                        continue
                    cc = a.get("country_code", "US")
                    country = countries.get(cc, countries.get("US"))
                    region = regions.get(COUNTRIES_CONFIG.get(cc, {}).get("region", "North America"), regions.get("North America"))
                    source = get_or_create(db, Source, {"domain": a["domain"]}, {"name": a["source_name"], "country_id": country.id, "region_id": region.id})

                    pub_date = None
                    raw = a.get("published_at", "")
                    if raw:
                        try:
                            if "T" in raw:
                                pub_date = datetime.fromisoformat(raw.replace("Z", "+00:00"))
                            else:
                                pub_date = datetime.strptime(raw[:14], "%Y%m%d%H%M%S").replace(tzinfo=timezone.utc)
                        except (ValueError, IndexError):
                            pass

                    db_article = Article(
                        title=a["title"], url=a["url"],
                        published_at=pub_date or now,
                        summary=a["title"],
                        image_url=a.get("image_url") if is_good_image(a.get("image_url")) else "",
                        source_id=source.id, topic_id=topic.id, region_id=region.id,
                        topic_event_id=te.id, trending_score=cluster["trending_score"],
                    )
                    db.add(db_article)
                    total_articles += 1

                db.commit()

        # Update trending labels
        print("\nUpdating category labels...")
        for cat, topic in topics.items():
            cat_name = CATEGORY_NAMES[cat]
            top_event = db.query(TopicEvent).filter(TopicEvent.category == cat_name).order_by(TopicEvent.trending_score.desc()).first()
            if top_event:
                topic.trending_label = top_event.title[:45]
                print(f"  {cat}: {top_event.title[:50]}")
        db.commit()

        print(f"\n{'='*50}")
        print(f"DONE")
        print(f"  Stories:  {total_stories}")
        print(f"  Articles: {total_articles}")
        for cat in CATEGORY_NAMES:
            count = db.query(TopicEvent).filter(TopicEvent.category == CATEGORY_NAMES[cat]).count()
            print(f"  {cat}: {count} stories")

    finally:
        db.close()


if __name__ == "__main__":
    main()
