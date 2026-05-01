from fastapi import status


def test_signup_success(client):
    response = client.post(
        "/api/v1/auth/signup",
        json={"email": "newuser@example.com", "username": "newuser", "password": "secret123"},
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["username"] == "newuser"
    assert "id" in data
    assert "password" not in data


def test_signup_duplicate_email(client, test_user):
    response = client.post(
        "/api/v1/auth/signup",
        json={"email": "test@example.com", "username": "other", "password": "secret123"},
    )
    assert response.status_code == status.HTTP_409_CONFLICT


def test_signup_duplicate_username(client, test_user):
    response = client.post(
        "/api/v1/auth/signup",
        json={"email": "other@example.com", "username": "testuser", "password": "secret123"},
    )
    assert response.status_code == status.HTTP_409_CONFLICT


def test_login_success(client, test_user):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "password123"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, test_user):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_login_nonexistent_user(client):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "nobody@example.com", "password": "password123"},
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
