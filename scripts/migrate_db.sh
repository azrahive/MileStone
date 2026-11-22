#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "🔄 Running Alembic Database Migrations..."
cd "$DIR/backend"

if [ -d ".venv" ]; then
    PYTHON_BIN=".venv/bin/python3"
else
    PYTHON_BIN="python3"
fi

$PYTHON_BIN -m alembic upgrade head
echo "✅ Database is up to date with head revision."
