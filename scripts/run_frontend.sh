#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "⚡ Starting MileStone Frontend..."
cd "$DIR/frontend"

# Start Vite dev server on port 5173
echo "💻 Frontend UI available at http://localhost:5173"
exec npm run dev -- --host 0.0.0.0 --port 5173
