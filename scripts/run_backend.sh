#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "🚀 Starting MileStone Backend..."
cd "$DIR/backend"

if [ -d ".venv" ]; then
    PYTHON_BIN=".venv/bin/python3"
    UVICORN_BIN=".venv/bin/uvicorn"
else
    PYTHON_BIN="python3"
    UVICORN_BIN="uvicorn"
fi

# Run database migrations to ensure schema is up to date
$PYTHON_BIN -m alembic upgrade head

# Start Uvicorn server on port 8000
echo "🌐 FastAPI listening on http://localhost:8000 (Docs: http://localhost:8000/docs)"
exec $UVICORN_BIN app.main:app --host 0.0.0.0 --port 8000 --reload
