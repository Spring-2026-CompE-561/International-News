"""
Direct CRUD tests for the repository layer.
These test database operations independently of the API layer.
"""
from datetime import datetime

from app.repository.article import ArticleRepository
from app.repository.country import CountryRepository
from app.repository.region import RegionRepository
from app.repository.user import UserRepository
from app.repository.bookmark import BookmarkRepository
from app.core.auth import get_password_hash
from app.schemas.user import UserDb


# ── User Repository ────────────────────────────────────────────────────────────

def test_create_user(db):
    user_db = UserDb(email="repo@example.com", username="repouser", hashed_password=get_password_hash("pass"))
    user = UserRepository.create(db, user_db)
    assert user.id is not None
    assert user.email == "repo@example.com"
    assert user.username == "repouser"


def test_get_user_by_email(db):
    user_db = UserDb(email="find@example.com", username="finduser", hashed_password=get_password_hash("pass"))
    UserRepository.create(db, user_db)

    found = UserRepository.get_by_mail(db, "find@example.com")
    assert found is not None
    assert found.email == "find@example.com"


def test_get_user_by_email_not_found(db):
    result = UserRepository.get_by_mail(db, "ghost@example.com")
    assert result is None


def test_get_user_by_id(db):
    user_db = UserDb(email="byid@example.com", username="byiduser", hashed_password=get_password_hash("pass"))
    created = UserRepository.create(db, user_db)

    found = UserRepository.get_by_id(db, created.id)
    assert found is not None
    assert found.id == created.id


def test_delete_user(db):
    user_db = UserDb(email="delete@example.com", username="deleteuser", hashed_password=get_password_hash("pass"))
    user = UserRepository.create(db, user_db)

    UserRepository.delete(db, user)
    assert UserRepository.get_by_id(db, user.id) is None


# ── Country Repository ─────────────────────────────────────────────────────────

def test_create_country(db):
    from app.schemas.country import CountryCreate

    country_in = CountryCreate(code="DE", name="Germany", language="de")
    country = CountryRepository.create(db, country_in)
    assert country.id is not None
    assert country.code == "DE"
    assert country.name == "Germany"


def test_get_country_by_code(db):
    from app.schemas.country import CountryCreate

    CountryRepository.create(db, CountryCreate(code="JP", name="Japan", language="ja"))
    found = CountryRepository.get_by_code(db, "JP")
    assert found is not None
    assert found.name == "Japan"


def test_get_country_by_code_not_found(db):
    assert CountryRepository.get_by_code(db, "ZZ") is None


def test_get_all_countries(db):
    from app.schemas.country import CountryCreate

    CountryRepository.create(db, CountryCreate(code="CA", name="Canada", language="en"))
    CountryRepository.create(db, CountryCreate(code="MX", name="Mexico", language="es"))
    countries = CountryRepository.get_all(db)
    assert len(countries) == 2


def test_delete_country(db):
    from app.schemas.country import CountryCreate

    country = CountryRepository.create(db, CountryCreate(code="BR", name="Brazil", language="pt"))
    CountryRepository.delete(db, country)
    assert CountryRepository.get_by_code(db, "BR") is None


# ── Region Repository ──────────────────────────────────────────────────────────

def test_create_region(db):
    region = RegionRepository.create(db, name="Middle East", description="Middle Eastern region")
    assert region.id is not None
    assert region.name == "Middle East"


def test_get_region_by_name(db):
    RegionRepository.create(db, name="Africa")
    found = RegionRepository.get_by_name(db, "Africa")
    assert found is not None
    assert found.name == "Africa"


def test_get_all_regions(db):
    RegionRepository.create(db, name="Latin America")
    RegionRepository.create(db, name="Southeast Asia")
    regions = RegionRepository.get_all(db)
    assert len(regions) == 2


# ── Article Repository ─────────────────────────────────────────────────────────

def _seed_source(db):
    from app.models.country import Country
    from app.models.region import Region
    from app.models.source import Source

    country = Country(code="AU", name="Australia", language="en")
    db.add(country)
    db.commit()
    db.refresh(country)

    region = Region(name="Oceania")
    db.add(region)
    db.commit()
    db.refresh(region)

    source = Source(name="AU News", domain="aunews.com", country_id=country.id, region_id=region.id)
    db.add(source)
    db.commit()
    db.refresh(source)
    return source


def test_create_article(db):
    from app.schemas.article import ArticleCreate

    source = _seed_source(db)
    article_in = ArticleCreate(
        title="Breaking News",
        url="https://aunews.com/breaking",
        summary="Big event happened.",
        source_id=source.id,
        published_at=datetime(2024, 6, 1),
    )
    article = ArticleRepository.create(db, article_in)
    assert article.id is not None
    assert article.title == "Breaking News"
    assert article.source_id == source.id


def test_get_article_by_id(db):
    from app.schemas.article import ArticleCreate

    source = _seed_source(db)
    article_in = ArticleCreate(
        title="Find Me",
        url="https://aunews.com/find-me",
        source_id=source.id,
    )
    created = ArticleRepository.create(db, article_in)
    found = ArticleRepository.get_by_id(db, created.id)
    assert found is not None
    assert found.id == created.id


def test_get_article_by_id_not_found(db):
    assert ArticleRepository.get_by_id(db, 99999) is None


def test_get_article_by_url(db):
    from app.schemas.article import ArticleCreate

    source = _seed_source(db)
    ArticleRepository.create(db, ArticleCreate(title="URL Test", url="https://aunews.com/url-test", source_id=source.id))
    found = ArticleRepository.get_by_url(db, "https://aunews.com/url-test")
    assert found is not None
    assert found.title == "URL Test"


def test_delete_article(db):
    from app.schemas.article import ArticleCreate

    source = _seed_source(db)
    article = ArticleRepository.create(db, ArticleCreate(title="Delete Me", url="https://aunews.com/delete", source_id=source.id))
    ArticleRepository.delete(db, article)
    assert ArticleRepository.get_by_id(db, article.id) is None


# ── Bookmark Repository ────────────────────────────────────────────────────────

def _seed_user_and_article(db):
    user_db = UserDb(email="bm@example.com", username="bmuser", hashed_password=get_password_hash("pass"))
    user = UserRepository.create(db, user_db)
    source = _seed_source(db)
    from app.schemas.article import ArticleCreate
    article = ArticleRepository.create(db, ArticleCreate(title="BM Article", url="https://aunews.com/bm", source_id=source.id))
    return user, article


def test_create_bookmark(db):
    from app.schemas.bookmark import BookmarkCreate

    user, article = _seed_user_and_article(db)
    bm_in = BookmarkCreate(article_id=article.id)
    bookmark = BookmarkRepository.create(db, user_id=user.id, bookmark_in=bm_in)
    assert bookmark.id is not None
    assert bookmark.user_id == user.id
    assert bookmark.article_id == article.id


def test_get_bookmarks_by_user(db):
    from app.schemas.bookmark import BookmarkCreate

    user, article = _seed_user_and_article(db)
    BookmarkRepository.create(db, user_id=user.id, bookmark_in=BookmarkCreate(article_id=article.id))
    bookmarks = BookmarkRepository.get_by_user(db, user.id)
    assert len(bookmarks) == 1


def test_delete_bookmark(db):
    from app.schemas.bookmark import BookmarkCreate

    user, article = _seed_user_and_article(db)
    bookmark = BookmarkRepository.create(db, user_id=user.id, bookmark_in=BookmarkCreate(article_id=article.id))
    BookmarkRepository.delete(db, bookmark)
    assert BookmarkRepository.get_by_id(db, bookmark.id) is None
