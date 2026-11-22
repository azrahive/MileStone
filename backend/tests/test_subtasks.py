def test_subtask_workflow(client, auth_headers):
    # Create task
    task_resp = client.post(
        "/api/v1/tasks",
        headers=auth_headers,
        json={"title": "Master Task"}
    )
    task_id = task_resp.json()["id"]

    # Add subtasks
    s1_resp = client.post(
        f"/api/v1/subtasks/task/{task_id}",
        headers=auth_headers,
        json={"title": "Design Database Schema"}
    )
    assert s1_resp.status_code == 201
    s1 = s1_resp.json()
    assert s1["is_completed"] is False

    s2_resp = client.post(
        f"/api/v1/subtasks/task/{task_id}",
        headers=auth_headers,
        json={"title": "Implement API Endpoints"}
    )
    s2 = s2_resp.json()

    # Verify task subtask progress is 0/2
    task_get = client.get(f"/api/v1/tasks/{task_id}", headers=auth_headers)
    assert task_get.json()["total_subtasks"] == 2
    assert task_get.json()["completed_subtasks"] == 0

    # Toggle complete on s1
    toggle_resp = client.post(f"/api/v1/subtasks/{s1['id']}/toggle", headers=auth_headers)
    assert toggle_resp.status_code == 200
    assert toggle_resp.json()["is_completed"] is True

    # Verify task subtask progress is now 1/2
    task_get_after = client.get(f"/api/v1/tasks/{task_id}", headers=auth_headers)
    assert task_get_after.json()["completed_subtasks"] == 1
