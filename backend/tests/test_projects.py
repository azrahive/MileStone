from app.models.activity import ActivityLog
from app.models.project import Project
from app.models.task import Task
from scripts.cleanup_orphaned_project_tasks import (
    cleanup_orphaned_project_tasks,
    purge_archived_projects_and_stale_logs
)


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


def test_permanent_project_delete_removes_tasks_and_task_activity(client, auth_headers, db):
    project_id = client.post(
        "/api/v1/projects",
        headers=auth_headers,
        json={"title": "Project to delete"}
    ).json()["id"]
    task = client.post(
        "/api/v1/tasks",
        headers=auth_headers,
        json={"title": "Task to delete", "project_id": project_id}
    ).json()
    client.post(
        f"/api/v1/tasks/{task['id']}/complete",
        headers=auth_headers
    )

    response = client.delete(
        f"/api/v1/projects/{project_id}",
        headers=auth_headers
    )

    assert response.status_code == 204
    assert db.query(Task).filter(Task.id == task["id"]).count() == 0
    assert db.query(ActivityLog).filter(
        ActivityLog.entity_type == "TASK",
        ActivityLog.entity_id == task["id"]
    ).count() == 0
    assert db.query(ActivityLog).filter(
        ActivityLog.entity_type == "PROJECT",
        ActivityLog.entity_id == project_id
    ).count() == 0


def test_cleanup_removes_tasks_and_logs_from_archived_projects(client, auth_headers, db):
    project_id = client.post(
        "/api/v1/projects",
        headers=auth_headers,
        json={"title": "Archived task project"}
    ).json()["id"]
    task = client.post(
        "/api/v1/tasks",
        headers=auth_headers,
        json={"title": "Orphaned by archive", "project_id": project_id}
    ).json()
    db.add(ActivityLog(
        user_id=task["user_id"],
        entity_type="TASK",
        entity_id=task["id"],
        action="COMPLETED"
    ))
    db.commit()
    client.post(f"/api/v1/projects/{project_id}/archive", headers=auth_headers)

    deleted_count = cleanup_orphaned_project_tasks(db)

    assert deleted_count == 1
    assert db.query(Task).filter(Task.id == task["id"]).count() == 0
    assert db.query(ActivityLog).filter(
        ActivityLog.entity_type == "TASK",
        ActivityLog.entity_id == task["id"]
    ).count() == 0


def test_purge_archived_projects_removes_projects_tasks_and_logs(client, auth_headers, db):
    project_id = client.post(
        "/api/v1/projects",
        headers=auth_headers,
        json={"title": "Project to purge"}
    ).json()["id"]
    task = client.post(
        "/api/v1/tasks",
        headers=auth_headers,
        json={"title": "Task to purge", "project_id": project_id}
    ).json()
    client.post(f"/api/v1/projects/{project_id}/archive", headers=auth_headers)

    deleted_projects, deleted_tasks, deleted_logs = purge_archived_projects_and_stale_logs(db)

    assert deleted_projects == 1
    assert deleted_tasks == 1
    assert deleted_logs > 0
    assert db.query(Project).filter(Project.id == project_id).count() == 0
    assert db.query(Task).filter(Task.id == task["id"]).count() == 0
    assert db.query(ActivityLog).filter(ActivityLog.entity_id.in_([project_id, task["id"]])).count() == 0
