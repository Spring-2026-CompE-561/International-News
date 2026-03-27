from fastapi import status


def test_get_regions_empty(client):
    response = client.get("/api/v1/regions")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


def test_get_regions(client, test_region):
    response = client.get("/api/v1/regions")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == test_region.name
    assert data[0]["description"] == test_region.description


def test_get_regions_multiple(client, db):
    from app.models.region import Region

    db.add(Region(name="Europe", description="European region"))
    db.add(Region(name="Asia", description="Asian region"))
    db.commit()

    response = client.get("/api/v1/regions")
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 2
