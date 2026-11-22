#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$DIR/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_FILE="$DIR/backend/smarttask.db"

mkdir -p "$BACKUP_DIR"

if [ -f "$DB_FILE" ]; then
    cp "$DB_FILE" "$BACKUP_DIR/smarttask_backup_${TIMESTAMP}.db"
    echo "✅ Database backup created at: $BACKUP_DIR/smarttask_backup_${TIMESTAMP}.db"
else
    echo "⚠️ Database file $DB_FILE does not exist yet. Run backend first."
fi
