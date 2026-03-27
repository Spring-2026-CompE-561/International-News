from fastapi import status


def test_get_articles_empty(client):
    response = client.get("/api/v1/articles")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["total"] == 0
    assert data["articles"] == []


def test_get_articles(client, test_article):
    response = client.get("/api/v1/articles")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["total"] == 1
    assert len(data["articles"]) == 1
    assert data["articles"][0]["title"] == test_article.title


def test_get_article_by_id(client, test_article):
    response = client.get(f"/api/v1/articles/{test_article.id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == test_article.id
    assert data["title"] == test_article.title


def test_get_article_not_found(client):
    response = client.get("/api/v1/articles/99999")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_search_articles_by_query(client, test_article):
    response = client.get("/api/v1/articles?q=Climate")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["total"] == 1
    assert data["articles"][0]["title"] == test_article.title


def test_search_articles_no_match(client, test_article):
    response = client.get("/api/v1/articles?q=zzznomatch")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["total"] == 0
    assert data["articles"] == []


def test_filter_articles_by_region(client, test_article, test_region):
    response = client.get(f"/api/v1/articles?region_id={test_region.id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["total"] == 0

    response = client.get("/api/v1/articles?region_id=99999")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["total"] == 0


def test_filter_articles_by_country_code(client, test_article, test_country):
    response = client.get(f"/api/v1/articles?country_code={test_country.code}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["total"] == 1


def test_articles_pagination(client, test_article):
    response = client.get("/api/v1/articles?skip=0&limit=10")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["articles"]) <= 10
