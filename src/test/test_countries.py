from fastapi import status


def test_get_countries_empty(client):
    response = client.get("/api/v1/countries")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


def test_get_countries(client, test_country):
    response = client.get("/api/v1/countries")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 1
    assert data[0]["code"] == test_country.code
    assert data[0]["name"] == test_country.name
    assert data[0]["language"] == test_country.language


def test_get_countries_multiple(client, db):
    from app.models.country import Country

    db.add(Country(code="GB", name="United Kingdom", language="en"))
    db.add(Country(code="FR", name="France", language="fr"))
    db.commit()

    response = client.get("/api/v1/countries")
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 2
