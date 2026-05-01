import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401 — registers all models with Base
from app.core.auth import get_password_hash
from app.core.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite://"  # in-memory SQLite, wiped after each test


@pytest.fixture
def db():
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db):
    from app.models.user import User

    user = User(
        email="test@example.com",
        username="testuser",
        hashed_password=get_password_hash("password123"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_headers(client, test_user):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_country(db):
    from app.models.country import Country

    country = Country(code="US", name="United States", language="en")
    db.add(country)
    db.commit()
    db.refresh(country)
    return country


@pytest.fixture
def test_region(db):
    from app.models.region import Region

    region = Region(name="North America", description="North American region")
    db.add(region)
    db.commit()
    db.refresh(region)
    return region


@pytest.fixture
def test_source(db, test_country, test_region):
    from app.models.source import Source

    source = Source(
        name="Test News",
        domain="testnews.com",
        country_id=test_country.id,
        region_id=test_region.id,
    )
    db.add(source)
    db.commit()
    db.refresh(source)
    return source


@pytest.fixture
def test_article(db, test_source):
    from app.models.article import Article
    from datetime import datetime

    article = Article(
        title="Test Article About Climate",
        url="https://testnews.com/article-1",
        summary="A test article summary about climate change.",
        source_id=test_source.id,
        published_at=datetime(2024, 1, 1),
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    return article
