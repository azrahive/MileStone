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
    token = login_resp.json()["access_token"]

    # Profile me
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "alice@example.com"

    # Login incorrect password
    bad_login = client.post(
        "/api/v1/auth/login",
        json={"email": "alice@example.com", "password": "wrongpassword"}
    )
    assert bad_login.status_code == 401
