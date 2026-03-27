from fastapi import status


def test_get_user_by_id(client, test_user):
    response = client.get(f"/api/v1/users/{test_user.id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == test_user.id
    assert data["email"] == test_user.email
    assert data["username"] == test_user.username


def test_get_user_not_found(client):
    response = client.get("/api/v1/users/99999")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_get_current_user(client, test_user, auth_headers):
    response = client.get("/api/v1/users/me", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["email"] == test_user.email
    assert data["username"] == test_user.username


def test_get_current_user_unauthorized(client):
    response = client.get("/api/v1/users/me")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_update_user(client, test_user, auth_headers):
    response = client.put(
        f"/api/v1/users/{test_user.id}",
        headers=auth_headers,
        json={"email": "updated@example.com", "username": "updateduser", "password": "newpass123"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["email"] == "updated@example.com"
    assert data["username"] == "updateduser"


def test_delete_user(client, test_user, auth_headers):
    response = client.delete(f"/api/v1/users/{test_user.id}", headers=auth_headers)
    assert response.status_code == status.HTTP_204_NO_CONTENT

    response = client.get(f"/api/v1/users/{test_user.id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND
