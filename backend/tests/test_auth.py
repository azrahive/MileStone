def test_register_and_login(client):
    # Register
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={"email": "alice@example.com", "password": "SecretPassword123", "full_name": "Alice Wonderland"}
    )
    assert reg_resp.status_code == 201
    data = reg_resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "alice@example.com"
    assert data["user"]["full_name"] == "Alice Wonderland"

    # Duplicate register should fail
    dup_resp = client.post(
        "/api/v1/auth/register",
        json={"email": "alice@example.com", "password": "SecretPassword123"}
    )
    assert dup_resp.status_code == 400

    # Login correct password
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "alice@example.com", "password": "SecretPassword123"}
    )
    assert login_resp.status_code == 200
    assert login_resp.json()["user"]["avatar_url"] is None
    token = login_resp.json()["access_token"]

    # Profile me
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "alice@example.com"
    assert me_resp.json()["avatar_url"] is None

    # Login incorrect password
    bad_login = client.post(
        "/api/v1/auth/login",
        json={"email": "alice@example.com", "password": "wrongpassword"}
    )
    assert bad_login.status_code == 401

    # Update profile
    update_resp = client.put(
        "/api/v1/auth/profile",
        json={"full_name": "Alice Cooper"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["full_name"] == "Alice Cooper"

    # Change password
    pwd_resp = client.put(
        "/api/v1/auth/password",
        json={"current_password": "SecretPassword123", "new_password": "NewSecretPassword456"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert pwd_resp.status_code == 200

    # Login with new password
    new_login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "alice@example.com", "password": "NewSecretPassword456"}
    )
    assert new_login_resp.status_code == 200


def test_avatar_profile_persists_and_can_be_cleared(client, auth_headers):
    avatar_url = "data:image/jpeg;base64," + ("a" * 50_000)

    update_resp = client.put(
        "/api/v1/auth/profile",
        json={"avatar_url": avatar_url},
        headers=auth_headers,
    )
    assert update_resp.status_code == 200, update_resp.text
    assert update_resp.json()["avatar_url"] == avatar_url

    unrelated_update = client.put(
        "/api/v1/auth/profile",
        json={"full_name": "Updated Name"},
        headers=auth_headers,
    )
    assert unrelated_update.json()["avatar_url"] == avatar_url

    me_resp = client.get("/api/v1/auth/me", headers=auth_headers)
    assert me_resp.json()["avatar_url"] == avatar_url

    login_with_avatar = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "password123"}
    )
    assert login_with_avatar.json()["user"]["avatar_url"] == avatar_url

    remove_resp = client.put(
        "/api/v1/auth/profile",
        json={"avatar_url": None},
        headers=auth_headers,
    )
    assert remove_resp.status_code == 200
    assert remove_resp.json()["avatar_url"] is None
