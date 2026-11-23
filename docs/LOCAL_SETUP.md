# MileStone — Local MacBook Setup Guide

This guide walks through configuring and running MileStone locally on macOS.

---

## Prerequisites
- **macOS** with Homebrew installed.
- **Python 3.12+**
- **Node.js 18+ & npm**
- **Java 17+ or 21** (bundled inside Android Studio or via Homebrew)
- **Android Studio** (for building the Android APK)

---

## 1. Quick Start (Automated Script)
To start both backend and frontend concurrently with a single command:
```bash
cd /Users/mdazizurrahim/Desktop/MileStone
./scripts/run_dev.sh
```
This script will:
1. Apply the latest database migrations with Alembic.
2. Launch the FastAPI server on `http://localhost:8000`.
3. Launch the Vite React development server on `http://localhost:5173`.

---

## 2. Manual Step-by-Step Execution

### Backend Setup:
```bash
cd /Users/mdazizurrahim/Desktop/MileStone/backend

# Activate virtual environment
source .venv/bin/activate

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Optional standalone cleanup for archived projects and stale task data
python3 -m scripts.cleanup_orphaned_project_tasks

# Run migrations (also cleans stale tasks and enforces project ownership)
python3 -m alembic upgrade head

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The cleanup permanently deletes archived projects and their tasks, tasks with a
missing or mismatched project, and stale project/task/subtask activity logs.
- API Base: `http://localhost:8000`
- Interactive Swagger UI Docs: `http://localhost:8000/docs`
- Redoc Documentation: `http://localhost:8000/redoc`

### Frontend Setup:
```bash
cd /Users/mdazizurrahim/Desktop/MileStone/frontend

# Install dependencies (if not already installed)
npm install

# Start Vite dev server
npm run dev -- --host 0.0.0.0 --port 5173
```
- Web Application URL: `http://localhost:5173`

---

## 3. Running Backend Tests
To verify all unit and integration tests across Auth, Projects, Tasks, Subtasks, Analytics, and Backups:
```bash
cd /Users/mdazizurrahim/Desktop/MileStone/backend
.venv/bin/pytest -v
```

---

## 4. Default Demo Account
When accessing the application for the first time, click **"Quick-fill demo credentials"** on the login page or register a new account:
- **Email**: `demo@milestone.local`
- **Password**: `MileStone2026!`
