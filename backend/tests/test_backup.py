def test_backup_export_and_restore(client, auth_headers):
    # Create test data
    proj_resp = client.post(
        "/api/v1/projects",
        headers=auth_headers,
        json={"title": "Export Project"}
    )
    proj_id = proj_resp.json()["id"]

    client.post(
        "/api/v1/tasks",
        headers=auth_headers,
        json={"title": "Export Task", "project_id": proj_id, "priority": "HIGH"}
    )

    # Export JSON
    json_export = client.get("/api/v1/backup/export/json", headers=auth_headers)
    assert json_export.status_code == 200
    export_data = json_export.json()
    assert "version" in export_data
    assert len(export_data["projects"]) >= 1
    assert len(export_data["tasks"]) >= 1

    # Export CSV
    csv_export = client.get("/api/v1/backup/export/csv", headers=auth_headers)
    assert csv_export.status_code == 200
    assert "Task ID,Title,Project" in csv_export.text
    assert "Export Task" in csv_export.text

    # Restore JSON
    restore_resp = client.post(
        "/api/v1/backup/restore",
        headers=auth_headers,
        json={"backup_data": export_data, "merge_strategy": "merge"}
    )
    assert restore_resp.status_code == 200
    assert restore_resp.json()["status"] == "success"
