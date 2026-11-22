def test_dashboard_analytics(client, auth_headers):
    # Create project and tasks
    proj_resp = client.post(
        "/api/v1/projects",
        headers=auth_headers,
        json={"title": "Analytics Project"}
    )
    proj_id = proj_resp.json()["id"]

    # Create 1 high pending, 1 completed
    client.post(
        "/api/v1/tasks",
        headers=auth_headers,
        json={"title": "Pending Task", "project_id": proj_id, "priority": "HIGH", "status": "PENDING"}
    )
    t2 = client.post(
        "/api/v1/tasks",
        headers=auth_headers,
        json={"title": "Task To Complete", "project_id": proj_id, "priority": "MEDIUM", "status": "PENDING"}
    ).json()
    client.post(f"/api/v1/tasks/{t2['id']}/complete", headers=auth_headers)

    # Get analytics
    stats_resp = client.get("/api/v1/analytics/dashboard", headers=auth_headers)
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["total_projects"] == 1
    assert stats["total_tasks"] == 2
    assert stats["completed_tasks"] == 1
    assert stats["pending_tasks"] == 1
    assert stats["overall_completion_percentage"] == 50.0
    assert len(stats["weekly_productivity"]) == 7
