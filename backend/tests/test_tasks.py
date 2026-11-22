from datetime import datetime, timezone, timedelta


def test_task_lifecycle_and_views(client, auth_headers):
    # Create project
    proj_resp = client.post(
        "/api/v1/projects",
        headers=auth_headers,
        json={"title": "Test Project"}
    )
    proj_id = proj_resp.json()["id"]

    # Create task
    task_resp = client.post(
        "/api/v1/tasks",
        headers=auth_headers,
        json={
            "title": "Build Architecture Plan",
            "project_id": proj_id,
            "priority": "HIGH",
            "status": "PENDING",
            "estimated_minutes": 60
        }
    )
    assert task_resp.status_code == 201
    task = task_resp.json()
    task_id = task["id"]
    assert task["title"] == "Build Architecture Plan"
    assert task["status"] == "PENDING"
    assert task["completion_date"] is None

    # Check Pending View
    pending_resp = client.get("/api/v1/tasks?status_mode=pending", headers=auth_headers)
    assert any(t["id"] == task_id for t in pending_resp.json())

    # Check Completed View (should not be in completed)
    completed_resp = client.get("/api/v1/tasks?status_mode=completed", headers=auth_headers)
    assert not any(t["id"] == task_id for t in completed_resp.json())

    # Complete Task
    comp_resp = client.post(f"/api/v1/tasks/{task_id}/complete", headers=auth_headers)
    assert comp_resp.status_code == 200
    comp_data = comp_resp.json()
    assert comp_data["status"] == "COMPLETED"
    assert comp_data["completion_date"] is not None

    # Verify task moved from Pending to Completed
    pending_after = client.get("/api/v1/tasks?status_mode=pending", headers=auth_headers)
    assert not any(t["id"] == task_id for t in pending_after.json())

    completed_after = client.get("/api/v1/tasks?status_mode=completed", headers=auth_headers)
    assert any(t["id"] == task_id for t in completed_after.json())

    # Project progress should now be 100%
    proj_get = client.get(f"/api/v1/projects/{proj_id}", headers=auth_headers)
    assert proj_get.json()["progress_percentage"] == 100.0

    # Reopen Task
    reopen_resp = client.post(f"/api/v1/tasks/{task_id}/reopen", headers=auth_headers)
    assert reopen_resp.status_code == 200
    reopen_data = reopen_resp.json()
    assert reopen_data["status"] == "PENDING"
    assert reopen_data["completion_date"] is None

    # Duplicate Task
    dup_resp = client.post(f"/api/v1/tasks/{task_id}/duplicate", headers=auth_headers)
    assert dup_resp.status_code == 200
    dup_data = dup_resp.json()
    assert dup_data["id"] != task_id
    assert "Copy" in dup_data["title"]


def test_overdue_detection(client, auth_headers):
    past_due = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
    task_resp = client.post(
        "/api/v1/tasks",
        headers=auth_headers,
        json={
            "title": "Overdue Report",
            "due_date": past_due,
            "status": "PENDING"
        }
    )
    assert task_resp.status_code == 201
    task = task_resp.json()
    assert task["is_overdue"] is True

    # Query overdue endpoint
    overdue_resp = client.get("/api/v1/overdue", headers=auth_headers)
    assert overdue_resp.status_code == 200
    assert any(t["id"] == task["id"] for t in overdue_resp.json())
