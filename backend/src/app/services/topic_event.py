import json
import re
import requests
from sqlalchemy.orm import Session

from app.repository.topic_event import TopicEventRepository
from app.models.topic_event import TopicEvent
from app.models.article import Article
from app.core.settings import settings


# ── Angle detection ──────────────────────────────────────────

def detect_angle(title, summary=""):
    text = f"{title} {summary or ''}".lower()
    if any(w in text for w in ["oil", "market", "stocks", "prices", "energy", "inflation",
                                "trade", "tariff", "economy", "gdp", "earnings", "investor",
                                "crude", "export", "import", "supply"]):
        return "market/economic"
    if any(w in text for w in ["consumer", "household", "bills", "cost of living", "mortgage",
                                "rent", "food price", "grocery", "fertilizer", "meal"]):
        return "consumer/cost"
    if any(w in text for w in ["congress", "approval", "law", "court", "legal", "ruling",
                                "judge", "legislation", "constitutional", "bill"]):
        return "legal/political"
    if any(w in text for w in ["troops", "strike", "military", "ceasefire", "missile",
                                "drone", "nato", "defense", "weapon", "combat", "offensive"]):
        return "military/security"
    if any(w in text for w in ["civilian", "aid", "displacement", "humanitarian", "refugee"]):
        return "humanitarian"
    if any(w in text for w in ["election", "campaign", "president", "vote", "poll", "party"]):
        return "domestic politics"
    if any(w in text for w in ["patient", "drug", "fda", "treatment", "hospital", "vaccine"]):
        return "health/medical"
    if any(w in text for w in ["research", "study", "scientist", "discovery", "experiment"]):
        return "research/science"
    if any(w in text for w in ["box office", "album", "film", "movie", "streaming", "concert",
                                "award", "oscar", "emmy", "grammy"]):
        return "entertainment/culture"
    if any(w in text for w in ["match", "game", "goal", "score", "championship", "league",
                                "playoff", "coach", "team"]):
        return "sports/competition"
    if any(w in text for w in ["ai ", "software", "hack", "cyber", "tech", "startup"]):
        return "technology"
    return "general"


AGGREGATOR_DOMAINS = {"news.google.com", "google.com", "yahoo.com", "msn.com",
                       "aol.com", "flipboard.com", "smartnews.com", "apple.news"}


def detect_publisher_type(source_name, domain):
    low_name = (source_name or "").lower()
    low_domain = (domain or "").lower()
    if low_name in {"google", "google news", "yahoo", "msn", "flipboard", "smartnews"} or low_domain in AGGREGATOR_DOMAINS:
        return "aggregator"
    if any(s in low_name for s in ["opinion", "editorial", "column", "op-ed"]):
        return "opinion"
    if any(s in low_name for s in ["analysis", "explainer", "investigation"]):
        return "analysis"
    return "reporting"


def extract_real_publisher(title, source_name, domain):
    """For Google News articles, try to extract the real publisher from the title suffix."""
    if detect_publisher_type(source_name, domain) != "aggregator":
        return source_name

    # Google News titles often end with " - Publisher Name"
    match = re.search(r'\s[-–—]\s*([A-Z][A-Za-z0-9\s\.\'\&]+)$', title)
    if match:
        return match.group(1).strip()
    return source_name


def build_source_packets(articles):
    packets = []
    for a in articles:
        try:
            source_name = a.source.name if a.source else "Unknown"
        except Exception:
            source_name = "Unknown"
        try:
            country = a.source.country.name if a.source and a.source.country else None
        except Exception:
            country = None
        try:
            domain = a.source.domain if a.source else ""
        except Exception:
            domain = ""

        snippet = ""
        if a.summary and a.summary != a.title and len(a.summary) > 20:
            snippet = a.summary[:150]

        pub_type = detect_publisher_type(source_name, domain)
        real_publisher = extract_real_publisher(a.title, source_name, domain)
        is_agg = pub_type == "aggregator"

        packets.append({
            "source": real_publisher if not is_agg else source_name,
            "original_publisher": real_publisher if is_agg else source_name,
            "country": country or "Unknown",
            "headline": a.title,
            "snippet": snippet,
            "published_at": a.published_at.isoformat() if a.published_at else None,
            "angle_hint": detect_angle(a.title, a.summary),
            "is_aggregator": is_agg,
            "publisher_type": pub_type if not is_agg else "aggregator",
        })
    return packets


# ── Category tones ───────────────────────────────────────────

CATEGORY_TONES = {
    "World & Conflict": "Sober, sharp, high-stakes. Power, military risk, diplomacy, law, civilians, regional consequences.",
    "Business & Economy": "Markets, companies, prices, workers, consumers, financial consequences. Numbers matter.",
    "Technology": "What changed, who benefits, what risk, what shifts next.",
    "Science": "Discovery, evidence, uncertainty, why it changes understanding.",
    "Health": "Patients, public health, medicine, regulation, practical consequences. No overclaiming.",
    "Sports": "Stakes, matchup, record, rivalry, injury, title race, fan impact. Energy.",
    "Entertainment": "Cultural momentum, audience reaction, industry impact, celebrity/music/film context.",
}


# ── Category-aware section names ─────────────────────────────

SIDES_SECTION_NAMES = {
    "World & Conflict": "What Each Side Is Saying",
    "Business & Economy": "Who's Affected",
    "Technology": "Who's Affected",
    "Science": "What Researchers Are Watching",
    "Health": "What Patients & Public Should Know",
    "Sports": "What It Means for the Season",
    "Entertainment": "What It Means for the Industry",
}


# ── Prompt builder ───────────────────────────────────────────

def build_briefing_prompt(topic_event: TopicEvent, source_packets: list, verified_facts: str = "") -> str:
    category = topic_event.category or "World & Conflict"
    tone = CATEGORY_TONES.get(category, CATEGORY_TONES["World & Conflict"])

    countries = list({p["country"] for p in source_packets if p["country"] != "Unknown"})
    source_lines = []
    for p in source_packets:
        src = p.get("original_publisher", p["source"])
        line = f"• {p['headline']} [{src}, {p['country']}]"
        if p.get("snippet") and p["snippet"] != p["headline"]:
            line += f"\n  → {p['snippet']}"
        source_lines.append(line)
    sources_text = "\n".join(source_lines)

    facts_block = ""
    if verified_facts:
        facts_block = f"""
VERIFIED FACTS (use ONLY these — do not add any facts not on this list):
{verified_facts}
"""

    return f"""You are a senior editor at a premium news magazine. Write a story briefing that reads like The Atlantic meets Reuters — authoritative but engaging, sharp but never dry.

{topic_event.title} | {category} | {len(countries)} countries ({', '.join(countries)})

{sources_text}
{facts_block}
STRICT RULE: Every claim in your writing MUST come from the verified facts list above. Do NOT invent quotes, numbers, names, dates, or events not on that list. If the facts are thin, write a shorter but accurate piece.

Writing rules:
- Short punchy paragraphs. Vary sentence length.
- Use transitions — connect ideas, don't list facts.
- Name specific actors, places, numbers from the facts. No vague "officials say."
- Make the reader feel the stakes.
- Style: {tone}

Use this EXACT format:

===DEK===
One sentence that makes someone stop scrolling.
===HOOK===
Two sentences. First: the hard news. Second: why it matters.
===BULLETS===
• Key fact with specifics
• What changed
• Who is involved
• Why it matters now
===STORY===
Write 5-8 paragraphs. This is the main read — make it flow like a magazine article, not a report. Each paragraph should pull the reader to the next. Cover: what happened, why, who's affected, what different countries see, and what comes next.
===CHANGED===
The single newest development. 2-3 crisp sentences.
===MATTERS===
The consequences. Who wins, who loses, what's at risk. 2-3 sentences.
===ANGLES===
{chr(10).join(f'{c}: What {c} media coverage reveals about their perspective [source name]' for c in countries)}
===TIMELINE===
Latest — event
===SOURCES===
Source name (Country): their unique angle or contribution"""


# ── Generation ───────────────────────────────────────────────

def _call_groq(prompt, max_tokens=4000, temperature=0.4):
    """Try Groq (Llama 3.1 8B). Single attempt, no retry."""
    groq_key = settings.groq_api_key
    if not groq_key:
        return None
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
                "max_tokens": max_tokens,
                "temperature": temperature,
            },
            timeout=30,
        )
        if resp.status_code == 200:
            return resp.json()["choices"][0]["message"]["content"].strip()
        print(f"    Groq {resp.status_code}")
        return None
    except Exception as e:
        print(f"    Groq: {e}")
        return None


def _call_openrouter(prompt, max_tokens=4000, temperature=0.4):
    """Try OpenRouter (free Gemma). Single attempt, no retry."""
    or_key = settings.openrouter_api_key
    if not or_key:
        return None
    try:
        resp = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {or_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "google/gemma-4-26b-a4b-it:free",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
                "temperature": temperature,
            },
            timeout=30,
        )
        if resp.status_code == 200:
            text = resp.json()["choices"][0]["message"]["content"].strip()
            return text
        print(f"    OpenRouter {resp.status_code}")
        return None
    except Exception as e:
        print(f"    OpenRouter: {e}")
        return None


def groq_call(prompt, max_tokens=4000, temperature=0.4):
    """Try Groq and OpenRouter in parallel. First response wins."""
    import concurrent.futures

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        groq_future = executor.submit(_call_groq, prompt, max_tokens, temperature)
        or_future = executor.submit(_call_openrouter, prompt, max_tokens, temperature)

        # Return whichever finishes first with a result
        for future in concurrent.futures.as_completed([groq_future, or_future], timeout=35):
            try:
                result = future.result()
                if result:
                    return result
            except Exception:
                continue

    return None


def _extract_section(content, key):
    """Extract text between ===KEY=== markers."""
    pattern = f'==={key}===\\s*(.+?)(?=\\s*===[A-Z]|$)'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        text = match.group(1).strip()
        return re.sub(r'===.*?===\s*', '', text).strip()
    return ""


def _parse_angles(text):
    """Parse angle lines like 'United States: perspective text [BBC]'"""
    angles = []
    for line in text.split("\n"):
        line = line.strip().strip("*").strip()
        if not line or line.startswith("==="):
            continue
        # Parse "Label: summary [source]"
        match = re.match(r'^(.+?):\s*(.+?)(?:\[(.+?)\])?\s*$', line)
        if match:
            label = match.group(1).strip().strip("*").strip()
            summary = match.group(2).strip().strip("*").strip()
            sources = [s.strip() for s in match.group(3).split(",")] if match.group(3) else []
            angles.append({"label": label, "type": "country", "summary": summary, "source_names": sources})
        elif ":" in line:
            parts = line.split(":", 1)
            angles.append({"label": parts[0].strip().strip("*").strip(), "type": "country", "summary": parts[1].strip().strip("*").strip(), "source_names": []})
    return angles


def _parse_bullets(text):
    """Parse bullet lines."""
    bullets = []
    for line in text.split("\n"):
        line = line.strip().lstrip("•-* ").strip()
        if line:
            bullets.append(line)
    return bullets


def _parse_timeline(text):
    """Parse timeline lines like 'Latest — event'"""
    items = []
    for line in text.split("\n"):
        line = line.strip().lstrip("•-* ").strip()
        if not line:
            continue
        if " — " in line:
            parts = line.split(" — ", 1)
            items.append({"label": parts[0].strip(), "event": parts[1].strip()})
        elif line:
            items.append({"label": "Update", "event": line})
    return items


def _parse_sources(text):
    """Parse source lines like 'BBC (UK): unique contribution'"""
    notes = []
    for line in text.split("\n"):
        line = line.strip().lstrip("•-* ").strip()
        if not line:
            continue
        match = re.match(r'^(.+?)\s*\((.+?)\)\s*:\s*(.+)$', line)
        if match:
            notes.append({"source": match.group(1).strip(), "country": match.group(2).strip(),
                          "publisher_type": "reporting", "contribution": match.group(3).strip()})
        elif ":" in line:
            parts = line.split(":", 1)
            notes.append({"source": parts[0].strip(), "country": "", "publisher_type": "reporting",
                          "contribution": parts[1].strip()})
    return notes


def store_briefing_from_text(topic_event, content):
    """Parse ===SECTION=== text format and store into model fields."""
    dek = _extract_section(content, "DEK")
    hook = _extract_section(content, "HOOK")
    bullets_text = _extract_section(content, "BULLETS")
    story = _extract_section(content, "STORY")
    changed = _extract_section(content, "CHANGED")
    matters = _extract_section(content, "MATTERS")
    angles_text = _extract_section(content, "ANGLES")
    timeline_text = _extract_section(content, "TIMELINE")
    sources_text = _extract_section(content, "SOURCES")

    if dek:
        topic_event.dek = dek
    if hook:
        topic_event.hook = hook
    if bullets_text:
        topic_event.quick_brief = json.dumps(_parse_bullets(bullets_text))
    if story:
        topic_event.full_briefing = json.dumps({"heading": "The Story", "body": story})
        topic_event.what_happened = story
    if changed:
        topic_event.what_changed = json.dumps({"heading": "What changed", "body": changed})
    if matters:
        topic_event.big_picture = json.dumps({"heading": "Why this matters", "body": matters})
        topic_event.why_it_matters = matters
    if angles_text:
        angles = _parse_angles(angles_text)
        # Only use AI angles if they have real country labels, not garbage like "Name"
        valid_angles = [a for a in angles if a.get("label") and a["label"] not in ("Name", "name", "", "Country")]
        if valid_angles and len(valid_angles) >= 2:
            topic_event.angles = json.dumps(valid_angles)
            topic_event.global_perspective = angles_text
    if timeline_text:
        timeline = _parse_timeline(timeline_text)
        if timeline:
            topic_event.timeline_json = json.dumps(timeline)
            topic_event.timeline = timeline_text
    if sources_text:
        notes = _parse_sources(sources_text)
        if notes:
            topic_event.source_notes = json.dumps(notes)


def _build_narrative_prompt(topic_event, source_packets, n_sources):
    """Separate prompt just for the long-form narrative. Small models do better with focused tasks."""
    category = topic_event.category or "World & Conflict"
    tone = CATEGORY_TONES.get(category, CATEGORY_TONES["World & Conflict"])

    headlines = "\n".join(
        f"- {p['headline']} (Source: {p['original_publisher']}, {p['country']}, angle: {p['angle_hint']})"
        for p in source_packets
    )

    if n_sources >= 6:
        length_instruction = """Write EXACTLY 8-10 paragraphs. Each paragraph MUST be 3-5 sentences and cover a DIFFERENT aspect:

Paragraph 1: The headline fact — what specifically happened according to the sources.
Paragraph 2: Why this is happening now — the trigger or cause.
Paragraph 3: The key actors — who is driving this, who is affected.
Paragraph 4: The economic or market impact — prices, exports, trade, jobs.
Paragraph 5: The consumer or public impact — bills, costs, food, daily life.
Paragraph 6: How different countries' media are framing this differently.
Paragraph 7: What remains uncertain — gaps in reporting, disputed claims, missing reactions.
Paragraph 8: What to watch next — upcoming events, decisions, or turning points.
Paragraphs 9-10: Additional details from remaining sources not yet covered.

IMPORTANT: Do NOT repeat the same point in multiple paragraphs. Each paragraph must add NEW information."""
    elif n_sources >= 4:
        length_instruction = """Write EXACTLY 6-7 paragraphs, each 3-4 sentences:

Paragraph 1: What happened.
Paragraph 2: Why now and who is involved.
Paragraph 3: The main impact on markets/consumers/public.
Paragraph 4: How different sources frame this.
Paragraph 5: What is uncertain.
Paragraph 6-7: What to watch next and broader context."""
    else:
        length_instruction = "Write 4-5 paragraphs, each 2-3 sentences."

    return f"""You are a senior journalist writing a long-form story briefing for Horizon News.

Topic: {topic_event.title}
Category: {category}
Style: {tone}

Sources:
{headlines}

STRICT RULES:
- Use ONLY facts from the sources above. Every claim must trace back to a source.
- Any number, ranking, "record," "world's largest," or prediction must be directly stated by a source. If not, soften it ("according to..." or "sources suggest...") or remove it.
- Do NOT invent sanctions, coalitions, military operations, government positions, quotes, or dates.
- A source from the UK/France/Australia means that country's MEDIA is covering it — NOT that the country's government is involved or took action.
- Do NOT use Google/Yahoo as a source name — use the original publisher.
- Do NOT write generic filler. Replace "significant implications" with the specific implication.

{length_instruction}

Write the story now. Plain text paragraphs separated by blank lines. No headings, no bullets, no JSON."""


def _is_relevant_article(article, topic_event):
    """Check if an article is actually about the story topic (not a misclustered article)."""
    skip_words = {"trump", "says", "news", "report", "could", "would", "after", "about", "their", "president", "breaking"}
    story_words = set(re.findall(r'\b[a-z]{4,}\b', topic_event.title.lower())) - skip_words
    article_words = set(re.findall(r'\b[a-z]{4,}\b', article.title.lower())) - skip_words
    if not story_words or not article_words:
        return True
    overlap = len(story_words & article_words)
    return overlap >= 2


def _try_scrape_snippet(url):
    """Try to get a short snippet from the article URL for richer context."""
    try:
        resp = requests.get(url, timeout=5, headers={"User-Agent": "Mozilla/5.0"})
        if resp.status_code != 200:
            return ""
        # Extract meta description
        match = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']', resp.text, re.IGNORECASE)
        if match:
            return match.group(1).strip()[:200]
        # Extract og:description
        match = re.search(r'<meta[^>]+property=["\']og:description["\'][^>]+content=["\'](.*?)["\']', resp.text, re.IGNORECASE)
        if match:
            return match.group(1).strip()[:200]
    except Exception:
        pass
    return ""


def generate_story_briefing(topic_event: TopicEvent, db: Session) -> None:
    all_articles = (
        db.query(Article)
        .filter(Article.topic_event_id == topic_event.id)
        .order_by(Article.trending_score.desc())
        .all()
    )
    if not all_articles:
        return

    # Filter out irrelevant articles (misclustered)
    relevant = [a for a in all_articles if _is_relevant_article(a, topic_event)]
    if not relevant:
        relevant = all_articles

    # Diverse sample: one article per country first, then fill with top-scored
    seen_countries = set()
    priority = []
    rest = []
    for a in relevant:
        try:
            country = a.source.country.name if a.source and a.source.country else "Unknown"
        except Exception:
            country = "Unknown"
        if country not in seen_countries and country != "Unknown":
            seen_countries.add(country)
            priority.append(a)
        else:
            rest.append(a)
    articles = (priority + rest)[:6]

    # Try to scrape snippets for top 3 articles that lack summaries
    for a in articles[:3]:
        if not a.summary or a.summary == a.title:
            snippet = _try_scrape_snippet(a.url)
            if snippet:
                a.summary = snippet
                db.commit()

    # Update counts from actual data
    actual_sources = set()
    actual_countries = set()
    for a in all_articles:
        try:
            if a.source:
                actual_sources.add(a.source.domain)
                if a.source.country:
                    actual_countries.add(a.source.country.name)
        except Exception:
            pass
    topic_event.source_count = len(actual_sources)
    topic_event.country_count = len(actual_countries)

    source_packets = build_source_packets(articles)
    countries = list({p["country"] for p in source_packets if p["country"] != "Unknown"})
    sources = list({p["original_publisher"] for p in source_packets if not p.get("is_aggregator")})
    n_sources = len(sources) or len(source_packets)

    # CALL 1: Fast fact extraction (cheap, ~200 output tokens)
    source_lines_short = "\n".join(
        f"• {p['headline']}" + (f" — {p['snippet'][:80]}" if p.get("snippet") and p["snippet"] != p["headline"] else "")
        for p in source_packets
    )
    fact_prompt = f"""Extract only the concrete facts from these headlines. List each fact once. No opinions, no analysis. Just facts.

{source_lines_short}

List facts as bullet points:"""

    facts_text = groq_call(fact_prompt, max_tokens=400)
    verified_facts = ""
    if facts_text:
        verified_facts = facts_text.strip()
        print(f"    Extracted {len(verified_facts.split(chr(10)))} facts")

    # Wait for token bucket
    import time
    time.sleep(2)

    # CALL 2: Write briefing using ONLY the verified facts
    prompt = build_briefing_prompt(topic_event, source_packets, verified_facts)

    try:
        content = groq_call(prompt, max_tokens=1800)
        if content and "===" in content:
            store_briefing_from_text(topic_event, content)
            db.commit()
            db.refresh(topic_event)
            return
    except Exception as e:
        print(f"    Briefing error: {type(e).__name__}: {e}")

    # Fallback
    _populate_fallback_content(topic_event, db)


def _generate_legacy_briefing(topic_event: TopicEvent, db: Session, source_text: str) -> None:
    prompt = f"""You are a senior journalist at Horizon News.

Write a story briefing about: {topic_event.title}
Category: {topic_event.category}

Sources:
{source_text}

Use ONLY facts from the sources. Use this EXACT format:

===HOOK===
[2 gripping sentences. 30-50 words.]
===WHAT_HAPPENED===
[3-4 paragraphs. What is happening. 200-250 words.]
===WHY_IT_MATTERS===
[2-3 paragraphs. The bigger picture. 150-200 words.]
===TIMELINE===
[3-5 bullet points. Format: "Time — Event". Only dates from sources.]
===GLOBAL_PERSPECTIVE===
[How different countries/outlets frame this. 2-3 paragraphs. 100-150 words.]"""

    content = groq_call(prompt, max_tokens=2048, temperature=0.5)
    if not content:
        return

    try:
        for key, field in [
            ("HOOK", "hook"),
            ("WHAT_HAPPENED", "what_happened"),
            ("WHY_IT_MATTERS", "why_it_matters"),
            ("TIMELINE", "timeline"),
            ("GLOBAL_PERSPECTIVE", "global_perspective"),
        ]:
            pattern = f'==={key}===\\s*(.+?)(?=\\s*===[A-Z_]|$)'
            match = re.search(pattern, content, re.DOTALL)
            if match:
                value = match.group(1).strip()
                value = re.sub(r'===.*?===\s*', '', value)
                setattr(topic_event, field, value)

        db.commit()
        db.refresh(topic_event)
    except Exception:
        pass


def _populate_fallback_content(topic_event: TopicEvent, db: Session) -> None:
    """When AI providers are all rate limited, build basic content from article titles."""
    articles = (
        db.query(Article)
        .filter(Article.topic_event_id == topic_event.id)
        .order_by(Article.trending_score.desc())
        .limit(8)
        .all()
    )
    if not articles:
        return

    # Build situation brief from article titles
    bullets = [a.title for a in articles[:5]]
    topic_event.quick_brief = json.dumps(bullets)

    # Build a basic hook
    topic_event.hook = f"{articles[0].title}. Multiple sources are covering this developing story."

    # Build basic what_happened from titles
    title_summary = " ".join(a.title + "." for a in articles[:4])
    topic_event.what_happened = title_summary

    # Build angles from actual country data if seed stubs are empty
    packets = build_source_packets(articles)
    countries = {}
    for p in packets:
        if p["country"] != "Unknown" and p["country"] not in countries:
            countries[p["country"]] = p["source"]
    if countries:
        topic_event.angles = json.dumps([
            {"label": name, "type": "country", "summary": f"Covered by {src}.", "source_names": [src]}
            for name, src in countries.items()
        ])

    db.commit()
    db.refresh(topic_event)


def get_topic_event_by_id(db: Session, topic_event_id: int) -> TopicEvent | None:
    topic_event = TopicEventRepository.get_by_id(db, topic_event_id)
    if not topic_event:
        return None

    needs_briefing = not topic_event.full_briefing and not topic_event.what_changed and not topic_event.what_happened

    if needs_briefing:
        # Populate fallback content immediately so the page isn't empty
        if not topic_event.hook:
            _populate_fallback_content(topic_event, db)

        # Try AI generation in a background thread so the response isn't blocked
        import threading
        def _bg_generate(event_id):
            from app.core.database import SessionLocal
            bg_db = SessionLocal()
            try:
                te = TopicEventRepository.get_by_id(bg_db, event_id)
                if te and not te.full_briefing and not te.what_changed:
                    generate_story_briefing(te, bg_db)
            finally:
                bg_db.close()

        thread = threading.Thread(target=_bg_generate, args=(topic_event_id,), daemon=True)
        thread.start()

    return topic_event
