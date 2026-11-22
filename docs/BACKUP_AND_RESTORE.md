# MileStone — Database Backup & Restore Guide

MileStone provides built-in data backup and disaster recovery tools to safeguard all projects, tasks, subtasks, categories, and tags.

---

## 1. Exporting Data

### 1.1 JSON Full Database Archive (GUI or API)
The JSON export contains complete relational hierarchy including all categories, tags, projects, tasks, and subtasks.
- **In UI**: Go to **Settings** > **Data Portability** > Click **Export Full Backup (JSON)**.
- **Via API**:
  ```bash
  curl -H "Authorization: Bearer <TOKEN>" http://localhost:8000/api/v1/backup/export/json -o backup.json
  ```

### 1.2 CSV Task Report (Spreadsheet Friendly)
Generates a CSV report with columns for: Task ID, Title, Project, Priority, Status, Due Date, Completion Date, Estimated Minutes, Actual Minutes, and Notes.
- **In UI**: Go to **Settings** > Click **Export Task Report (CSV)**.
- **Via API**:
  ```bash
  curl -H "Authorization: Bearer <TOKEN>" http://localhost:8000/api/v1/backup/export/csv -o tasks.csv
  ```

---

## 2. Automated SQLite File Backup Script
You can schedule automated database file snapshots using the provided shell script:
```bash
./scripts/backup.sh
```
This copies `backend/smarttask.db` with a timestamp into `backups/smarttask_backup_YYYYMMDD_HHMMSS.db`.
You can add this to your crontab to run daily:
```bash
0 2 * * * /Users/mdazizurrahim/Desktop/SmartTask/scripts/backup.sh >/dev/null 2>&1
```

---

## 3. Restoring Data

### Merge vs Replace Strategy:
- **`merge` (Safe Default)**: Preserves existing records in your database while importing new ones from the backup. If an entity with the same ID already exists, it is updated; non-conflicting items are kept intact.
- **`replace`**: Safely clears existing user projects, tasks, and subtasks before restoring the exact snapshot from the backup file.

### How to Restore in the UI:
1. Navigate to **Settings** > **Data Portability**.
2. Click **Choose File** and select your `.json` backup file.
3. Choose your merge strategy (`Merge` or `Replace`).
4. Click **Restore Backup**. The system validates the schema, imports all entities, and automatically reloads the workspace!
