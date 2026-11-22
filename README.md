# SmartTask — Personal Productivity & Task Management System

![SmartTask Banner](https://img.shields.io/badge/SmartTask-v1.0.0-indigo?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12+-blue?style=for-the-badge&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61dafb?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-Android-119eff?style=for-the-badge&logo=capacitor&logoColor=white)

> **SmartTask** is an enterprise-grade personal productivity and project/task management platform designed to operate seamlessly across desktop browsers, mobile browsers, and native Android (via Capacitor).

---

## 🚀 Key Features

- **📊 Dynamic Productivity Dashboard**: Dynamic KPIs (Total Projects, Total Tasks, Completed, Pending, In Progress, Overdue, Today's Focus, Completion Percentage) calculated directly from real database records.
- **📁 Comprehensive Project Management**: Unlimited projects with custom color accents, category tags, start and target deadlines, priorities, status lifecycle, archiving, and isolated task management pages.
- **⚡ The 3-View Task Architecture**:
  - **Pending Tasks**: High-velocity actionable tasks with real-time filters and search.
  - **Completed Tasks**: Automatically moved upon completion, recording timestamps, with one-click reopen.
  - **All Tasks**: Unified view with priority badges and status pills.
- **☀️ My Day (Daily Focus)**: Curated daily task prioritization with independent reset that never deletes your original tasks.
- **✅ Nested Subtask Tracking**: Multi-level subtasks with fractional progress indicators (e.g. `4/6 completed`) and visual progress bars.
- **📅 Interactive Calendar View**: Monthly, Weekly, and Daily calendar views with due date badges and click-any-date-to-schedule workflows.
- **⚠️ Overdue Task Engine**: Automatic detection of past-due tasks with warning badges and instant reschedule actions.
- **🔄 Recurring Tasks Automation**: Daily, Weekly, and Monthly recurring schedules that auto-spawn the next occurrence on task completion.
- **📈 Advanced Analytics (Recharts)**: Productivity velocity trend charts, status breakdown, priority distribution, and project completion leaderboards.
- **📴 Offline-First Sync Engine**: Client-side mutation queue and connection monitor that buffers changes when offline and safely syncs upon reconnection.
- **📱 Android APK with Configurable Endpoint**: Native Android app with hardware back-button handling, status bar theming, and an in-app setting to toggle backend URLs between `localhost`, `10.0.2.2`, LAN Wi-Fi, or cloud HTTPS.
- **💾 Data Portability**: Full JSON backup export, validated safe restoration with merge or replace options, and CSV task report downloads.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Python 3.12+, FastAPI, Uvicorn, SQLAlchemy 2.0, Alembic, Pydantic, JWT Authentication, Passlib (bcrypt) |
| **Database** | SQLite (Default for local development), configurable for PostgreSQL via `DATABASE_URL` |
| **Frontend** | React 18+, Vite, TypeScript, Tailwind CSS, Lucide React Icons, React Router, TanStack Query, Zustand, Recharts |
| **Mobile** | Capacitor 6+ Android wrapper, LocalNotifications, Hardware Back-Button & Status Bar plugins |

---

## 🏁 Quick Start (Local MacBook)

### Start Everything Concurrently:
```bash
./scripts/run_dev.sh
```
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Backend**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Run Automated Tests:
```bash
cd backend
.venv/bin/pytest -v
```

### Build Android APK:
```bash
./scripts/build_apk.sh
```

---

## 📂 Project Structure

```
SmartTask/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/  # Modular API routes (auth, projects, tasks, daily_focus, calendar, etc.)
│   │   ├── core/              # Config, database engine, JWT security, password hashing
│   │   ├── models/            # SQLAlchemy 2.0 relational models
│   │   ├── schemas/           # Pydantic request and response schemas
│   │   ├── repositories/      # Database queries and data access layer
│   │   ├── services/          # Core business logic and automation
│   │   └── main.py            # FastAPI application entrypoint
│   ├── alembic/               # Database migrations
│   ├── tests/                 # Comprehensive Pytest suite
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components (TaskCard, DetailModal, CreateModals, etc.)
│   │   ├── layouts/           # Sidebar, Header, MobileNav, and AppLayout
│   │   ├── pages/             # Dashboard, Tasks, DailyFocus, Projects, Calendar, Overdue, Analytics, Settings
│   │   ├── services/          # API client and background offline sync worker
│   │   ├── store/             # Zustand stores (Auth, Theme, Settings, Offline Queue)
│   │   └── utils/             # Helpers, formatters, and completion confetti
│   ├── android/               # Capacitor Android native wrapper project
│   └── package.json           # Node dependencies
├── android/                   # Root symlink to frontend/android
├── docs/                      # Comprehensive documentation
│   ├── ARCHITECTURE.md
│   ├── LOCAL_SETUP.md
│   ├── REMOTE_DEPLOYMENT.md
│   ├── ANDROID_SETUP.md
│   └── BACKUP_AND_RESTORE.md
├── scripts/                   # Shell scripts
│   ├── run_dev.sh             # Launch backend and frontend concurrently
│   ├── run_backend.sh         # Launch backend with migrations
│   ├── run_frontend.sh        # Launch frontend Vite dev server
│   ├── migrate_db.sh          # Apply database migrations
│   ├── build_apk.sh           # Compile Android Debug APK
│   └── backup.sh              # Automated database snapshot script
└── README.md
```

---

## 📚 Documentation Links
- [Detailed System Architecture](docs/ARCHITECTURE.md)
- [Local MacBook Setup Guide](docs/LOCAL_SETUP.md)
- [Remote Server & Secure Cloud Deployment Guide](docs/REMOTE_DEPLOYMENT.md)
- [Android APK Build & Installation Guide](docs/ANDROID_SETUP.md)
- [Database Backup & Restore Guide](docs/BACKUP_AND_RESTORE.md)
