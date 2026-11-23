from datetime import datetime, timezone, timedelta
from app.models.activity import ActivityLog
from app.models.daily_focus import DailyFocus
from app.models.task import Task


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
    project_id = client.post(
        "/api/v1/projects",
        headers=auth_headers,
        json={"title": "Overdue Project"}
    ).json()["id"]
    task_resp = client.post(
        "/api/v1/tasks",
        headers=auth_headers,
        json={
            "title": "Overdue Report",
            "project_id": project_id,
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


def test_archived_project_tasks_are_hidden_from_all_active_views(client, auth_headers):
    past_due = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
    project_id = client.post(
        "/api/v1/projects",
        headers=auth_headers,
        json={"title": "Archived Task Project"}
    ).json()["id"]
    task = client.post(
        "/api/v1/tasks",
        headers=auth_headers,
        json={
            "title": "Hidden with project",
            "project_id": project_id,
            "due_date": past_due,
            "status": "PENDING"
        }
    ).json()
    focus = client.post(
        "/api/v1/daily-focus/add",
        headers=auth_headers,
        json={"task_id": task["id"]}
    )
    assert focus.status_code == 201

    client.post(f"/api/v1/projects/{project_id}/archive", headers=auth_headers)

    assert client.get("/api/v1/tasks?status_mode=pending", headers=auth_headers).json() == []
    assert client.get("/api/v1/overdue", headers=auth_headers).json() == []
    assert client.get("/api/v1/daily-focus", headers=auth_headers).json()["items"] == []
    assert client.get("/api/v1/analytics/dashboard", headers=auth_headers).json()["total_tasks"] == 0

    start = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    end = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    calendar = client.get(
        "/api/v1/calendar",
        headers=auth_headers,
        params={"start": start, "end": end}
    )
    assert calendar.status_code == 200
    assert calendar.json() == []


def test_task_creation_requires_active_project(client, auth_headers):
    missing_project = client.post(
        "/api/v1/tasks",
        headers=auth_headers,
        json={"title": "Task without project"}
    )
    assert missing_project.status_code == 422


def test_permanent_task_delete_removes_it_from_all_views(client, auth_headers, db):
    project_id = client.post(
        "/api/v1/projects",
        headers=auth_headers,
        json={"title": "Task deletion project"}
    ).json()["id"]
    task = client.post(
        "/api/v1/tasks",
        headers=auth_headers,
        json={"title": "Permanently deleted task", "project_id": project_id}
    ).json()
    client.post(
        "/api/v1/daily-focus/add",
        headers=auth_headers,
        json={"task_id": task["id"]}
    )
    client.post(f"/api/v1/tasks/{task['id']}/complete", headers=auth_headers)

    response = client.delete(
        f"/api/v1/tasks/{task['id']}?permanent=true",
        headers=auth_headers
    )

    assert response.status_code == 204
    assert db.query(Task).filter(Task.id == task["id"]).count() == 0
    assert db.query(DailyFocus).filter(DailyFocus.task_id == task["id"]).count() == 0
    assert db.query(ActivityLog).filter(ActivityLog.entity_id == task["id"]).count() == 0
    assert client.get("/api/v1/analytics/dashboard", headers=auth_headers).json()["total_tasks"] == 0
