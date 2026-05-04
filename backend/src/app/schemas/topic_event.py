import json
from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator


class TopicEventBase(BaseModel):
    title: str
    query: str
    summary: str | None = None
    category: str | None = None


class TopicEventCreate(TopicEventBase):
    pass


class AngleItem(BaseModel):
    label: str
    angle: str | None = None
    summary: str | None = None
    type: str | None = None
    source_names: list[str] | None = None


class TimelineItem(BaseModel):
    date: str | None = None
    label: str | None = None
    event: str


class RabbitHoleItem(BaseModel):
    title: str
    description: str


class SourceNoteItem(BaseModel):
    source: str
    contribution: str
    country: str | None = None
    publisher_type: str | None = None


class SectionItem(BaseModel):
    heading: str
    body: str


class SideSayingItem(BaseModel):
    side: str
    position: str


class BurningQuestionItem(BaseModel):
    question: str
    answer: str


class TopicEventResponse(TopicEventBase):
    id: int
    hook: str | None = None
    what_happened: str | None = None
    why_it_matters: str | None = None
    timeline: str | None = None
    global_perspective: str | None = None
    image_url: str | None = None

    # New briefing fields
    dek: str | None = None
    quick_brief: list[str] | None = None
    full_briefing: SectionItem | None = None
    what_changed: SectionItem | None = None
    big_picture: SectionItem | None = None
    angles: list[AngleItem] | None = None
    sides_saying: list[SideSayingItem] | None = None
    burning_questions: list[BurningQuestionItem] | None = None
    rabbit_holes: list[RabbitHoleItem] | None = None
    uncertainty: list[str] | None = None
    source_notes: list[SourceNoteItem] | None = None
    timeline_json: list[TimelineItem] | None = None

    trending_score: int = 0
    article_count: int = 0
    source_count: int = 0
    country_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator(
        "quick_brief", "uncertainty",
        mode="before",
    )
    @classmethod
    def parse_string_list(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v

    @field_validator(
        "full_briefing", "what_changed", "big_picture",
        mode="before",
    )
    @classmethod
    def parse_section(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v

    @field_validator(
        "angles", "rabbit_holes", "source_notes",
        "sides_saying", "burning_questions", "timeline_json",
        mode="before",
    )
    @classmethod
    def parse_json_array(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v
