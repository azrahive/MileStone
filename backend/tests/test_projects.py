def test_project_crud_and_archive(client, auth_headers, second_user_headers):
    # Create project
    create_resp = client.post(
        "/api/v1/projects",
        headers=auth_headers,
        json={
            "title": "Software Development",
            "description": "Full-stack web application development",
            "color": "#6366f1",
            "icon": "code",
            "priority": "HIGH"
        }
    )
    assert create_resp.status_code == 201
    proj = create_resp.json()
    proj_id = proj["id"]
    assert proj["title"] == "Software Development"
    assert proj["priority"] == "HIGH"
    assert proj["total_tasks"] == 0

    # Get project
    get_resp = client.get(f"/api/v1/projects/{proj_id}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == proj_id

    # Data isolation: second user should not see this project
    iso_resp = client.get(f"/api/v1/projects/{proj_id}", headers=second_user_headers)
    assert iso_resp.status_code == 404

    # Update project
    update_resp = client.put(
        f"/api/v1/projects/{proj_id}",
        headers=auth_headers,
        json={"title": "Software Development v2", "priority": "MEDIUM"}
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["title"] == "Software Development v2"
    assert update_resp.json()["priority"] == "MEDIUM"

    # Archive project
    arch_resp = client.post(f"/api/v1/projects/{proj_id}/archive", headers=auth_headers)
    assert arch_resp.status_code == 200
    assert arch_resp.json()["is_archived"] is True

    # Main list should exclude archived by default
    list_resp = client.get("/api/v1/projects", headers=auth_headers)
    assert len(list_resp.json()) == 0

    # Include archived
    list_arch_resp = client.get("/api/v1/projects?include_archived=true", headers=auth_headers)
    assert len(list_arch_resp.json()) == 1

    # Restore project
    restore_resp = client.post(f"/api/v1/projects/{proj_id}/restore", headers=auth_headers)
    assert restore_resp.status_code == 200
    assert restore_resp.json()["is_archived"] is False
