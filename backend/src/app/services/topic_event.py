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

def build_briefing_prompt(topic_event: TopicEvent, source_packets: list) -> str:
    category = topic_event.category or "World & Conflict"
    tone = CATEGORY_TONES.get(category, CATEGORY_TONES["World & Conflict"])
    packets_json = json.dumps(source_packets, indent=2)

    countries = list({p["country"] for p in source_packets if p["country"] != "Unknown"})
    sources = list({p["original_publisher"] for p in source_packets if not p.get("is_aggregator")})
    if not sources:
        sources = list({p["source"] for p in source_packets})
    n_sources = len(sources)
    n_countries = len(countries)

    sides_title = SIDES_SECTION_NAMES.get(category, "Who's Affected")

    return f"""You are Horizon News's story architect. Extract facts from the sources, then write each section.

RULES:
- ONLY use facts from the source packets. Never invent sanctions, coalitions, operations, positions, quotes, or dates.
- Any sentence with a number, ranking, "record," "world's largest," or prediction MUST be directly in a source packet. If not, remove or soften it.
- Country in source ≠ that country's government is involved. It means that country's MEDIA frames the story a certain way.
- Do NOT use Google/Yahoo/MSN as source names.
- Do NOT write "raised concerns" or "significant implications" — name the specific concern.

SECTION JOBS (each must be unique — NO repeating the same facts):
- situation_brief: only key facts, no analysis
- what_changed: ONLY the single newest development (not a recap)
- why_it_matters: ONLY consequences/stakes (not what happened)
- angles: what each country's MEDIA emphasizes differently
- "{sides_title}": who benefits, who is hurt, what each actor faces — only source-backed
- burning_questions: 5-7 questions readers actually want answered, with source-backed answers or "unclear from current reporting"

BEFORE RETURNING: Compare what_changed and why_it_matters. If they say the same thing, rewrite one.

STYLE: {tone}
STORY: {topic_event.title} | {category} | {n_sources} sources | {n_countries} countries ({', '.join(countries)})

SOURCE PACKETS:
{packets_json}

Return ONLY valid JSON:

{{
  "dek": "One sentence, the stakes.",
  "hook": "Two sharp factual sentences. 30-50 words.",
  "situation_brief": ["4-6 concrete fact bullets"],
  "what_changed": {{
    "heading": "What changed",
    "body": "ONLY newest development. 100-180 words. No recap."
  }},
  "why_it_matters": {{
    "heading": "Why this matters",
    "body": "ONLY consequences. 200-350 words. No recap of what happened."
  }},
  "angles": [
    {{
      "label": "Country or topic",
      "type": "country | market | consumer | legal | military | food_security | energy",
      "summary": "2-4 sentences. What this media/perspective adds. Source-backed.",
      "source_names": ["Sources"]
    }}
  ],
  "what_each_side_is_saying": [
    {{
      "side": "Actor/group/sector",
      "position": "Source-backed impact or position. If unsupported: 'Current sources do not clearly show [actor]'s position.'"
    }}
  ],
  "burning_questions": [
    {{"question": "Specific reader question", "answer": "Source-backed answer or 'This remains unclear from current reporting.'"}},
    {{"question": "Second question", "answer": "..."}},
    {{"question": "Third question", "answer": "..."}},
    {{"question": "Fourth question", "answer": "..."}},
    {{"question": "Fifth question", "answer": "..."}}
  ],
  "timeline": [
    {{"label": "Latest/Earlier/date if in sources", "event": "Source-supported only."}}
  ],
  "uncertainty": ["What is unclear or missing."],
  "rabbit_holes": [
    {{"title": "Related angle", "description": "Why it connects."}}
  ],
  "source_intelligence": [
    {{
      "source": "Publisher (not Google)",
      "country": "Country",
      "publisher_type": "reporting | analysis | opinion | aggregator",
      "contribution": "What THIS source specifically adds — not just the headline."
    }}
  ]
}}"""


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
    """Try Groq, then OpenRouter. One shot each — no long waits."""
    return _call_groq(prompt, max_tokens, temperature) or _call_openrouter(prompt, max_tokens, temperature)


def parse_json_response(content):
    if not content:
        return None
    if content.startswith("```"):
        content = content.split("\n", 1)[1] if "\n" in content else content[3:]
    if content.endswith("```"):
        content = content[:-3]
    content = content.strip()
    return json.loads(content)


def store_briefing(topic_event, briefing):
    topic_event.hook = briefing.get("hook", topic_event.hook or "")
    topic_event.dek = briefing.get("dek", "")

    if briefing.get("situation_brief"):
        topic_event.quick_brief = json.dumps(briefing["situation_brief"])

    if briefing.get("full_briefing"):
        topic_event.full_briefing = json.dumps(briefing["full_briefing"])
        topic_event.what_happened = briefing["full_briefing"].get("body", "")

    if briefing.get("what_changed"):
        topic_event.what_changed = json.dumps(briefing["what_changed"])

    if briefing.get("why_it_matters"):
        topic_event.big_picture = json.dumps(briefing["why_it_matters"])
        topic_event.why_it_matters = briefing["why_it_matters"].get("body", "")

    if briefing.get("angles"):
        topic_event.angles = json.dumps(briefing["angles"])
        perspectives = []
        for ang in briefing["angles"]:
            label = ang.get("label", "")
            summary = ang.get("summary", ang.get("angle", ""))
            src_names = ", ".join(ang.get("source_names", []))
            perspectives.append(f"{label}: {summary}" + (f" [{src_names}]" if src_names else ""))
        topic_event.global_perspective = "\n\n".join(perspectives)

    if briefing.get("what_each_side_is_saying"):
        topic_event.sides_saying = json.dumps(briefing["what_each_side_is_saying"])

    if briefing.get("burning_questions"):
        topic_event.burning_questions = json.dumps(briefing["burning_questions"])

    if briefing.get("timeline"):
        topic_event.timeline_json = json.dumps(briefing["timeline"])
        lines = [f"{t.get('label', t.get('date', 'Update'))} — {t['event']}" for t in briefing["timeline"]]
        topic_event.timeline = "\n".join(lines)

    if briefing.get("rabbit_holes"):
        topic_event.rabbit_holes = json.dumps(briefing["rabbit_holes"])

    if briefing.get("uncertainty"):
        topic_event.uncertainty = json.dumps(briefing["uncertainty"])

    if briefing.get("source_intelligence"):
        topic_event.source_notes = json.dumps(briefing["source_intelligence"])


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


def generate_story_briefing(topic_event: TopicEvent, db: Session) -> None:
    all_articles = (
        db.query(Article)
        .filter(Article.topic_event_id == topic_event.id)
        .order_by(Article.trending_score.desc())
        .all()
    )
    if not all_articles:
        return

    # Diverse sample: one article per country first, then fill with top-scored
    seen_countries = set()
    priority = []
    rest = []
    for a in all_articles:
        try:
            country = a.source.country.name if a.source and a.source.country else "Unknown"
        except Exception:
            country = "Unknown"
        if country not in seen_countries and country != "Unknown":
            seen_countries.add(country)
            priority.append(a)
        else:
            rest.append(a)
    articles = (priority + rest)[:8]

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

    # Single call — Groq free tier is 6K tokens/min, so we can't do two calls
    prompt = build_briefing_prompt(topic_event, source_packets)

    try:
        content = groq_call(prompt, max_tokens=1800)
        briefing = parse_json_response(content)
        if briefing:
            store_briefing(topic_event, briefing)
            db.commit()
            db.refresh(topic_event)
            return
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        print(f"    Briefing JSON failed ({type(e).__name__}: {e}), using legacy")
    except Exception as e:
        print(f"    Briefing error: {type(e).__name__}: {e}")

    # Legacy fallback
    source_text = "\n".join(
        f"- {p['headline']} (Source: {p['original_publisher']}, {p['country']})"
        for p in source_packets
    )
    _generate_legacy_briefing(topic_event, db, source_text)


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

    if not topic_event.full_briefing and not topic_event.what_changed and not topic_event.what_happened:
        generate_story_briefing(topic_event, db)

        # If AI generation failed entirely, populate basic fallback content
        if not topic_event.full_briefing and not topic_event.what_happened and not topic_event.hook:
            _populate_fallback_content(topic_event, db)

    return topic_event
