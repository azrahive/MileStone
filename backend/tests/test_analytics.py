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


def test_dashboard_analytics_excludes_tasks_from_deleted_projects(client, auth_headers):
    project_id = client.post(
        "/api/v1/projects",
        headers=auth_headers,
        json={"title": "Archived Project"}
    ).json()["id"]

    completed_task = client.post(
        "/api/v1/tasks",
        headers=auth_headers,
        json={"title": "Completed project task", "project_id": project_id, "priority": "HIGH"}
    ).json()
    client.post(
        "/api/v1/tasks",
        headers=auth_headers,
        json={"title": "Pending project task", "project_id": project_id, "priority": "MEDIUM"}
    )
    active_project_id = client.post(
        "/api/v1/projects",
        headers=auth_headers,
        json={"title": "Active Project"}
    ).json()["id"]
    active_task = client.post(
        "/api/v1/tasks",
        headers=auth_headers,
        json={"title": "Active project task", "project_id": active_project_id, "priority": "LOW"}
    ).json()
    client.post(
        f"/api/v1/tasks/{completed_task['id']}/complete",
        headers=auth_headers
    )

    before_delete = client.get(
        "/api/v1/analytics/dashboard",
        headers=auth_headers
    ).json()
    assert before_delete["total_tasks"] == 3
    assert before_delete["completed_tasks"] == 1
    assert before_delete["pending_tasks"] == 2
    assert before_delete["weekly_productivity"][-1]["created"] == 3
    assert before_delete["weekly_productivity"][-1]["completed"] == 1

    delete_response = client.delete(
        f"/api/v1/projects/{project_id}",
        headers=auth_headers
    )
    assert delete_response.status_code == 204

    after_delete = client.get(
        "/api/v1/analytics/dashboard",
        headers=auth_headers
    ).json()
    assert after_delete["total_projects"] == 1
    assert after_delete["total_tasks"] == 1
    assert after_delete["completed_tasks"] == 0
    assert after_delete["pending_tasks"] == 1
    assert after_delete["overdue_tasks"] == 0
    assert [item["count"] for item in after_delete["priority_distribution"]] == [0, 0, 1]
    assert after_delete["weekly_productivity"][-1]["created"] == 1
    assert after_delete["weekly_productivity"][-1]["completed"] == 0

    client.delete(f"/api/v1/tasks/{active_task['id']}", headers=auth_headers)
    after_task_delete = client.get(
        "/api/v1/analytics/dashboard",
        headers=auth_headers
    ).json()
    assert after_task_delete["total_tasks"] == 0
    assert after_task_delete["completed_tasks"] == 0
    assert after_task_delete["pending_tasks"] == 0
    assert [item["count"] for item in after_task_delete["priority_distribution"]] == [0, 0, 0]
    assert after_task_delete["weekly_productivity"][-1]["created"] == 0
    assert after_task_delete["weekly_productivity"][-1]["completed"] == 0
