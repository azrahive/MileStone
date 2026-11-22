#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=================================================="
echo "🌟 SmartTask: Personal Productivity Management"
echo "=================================================="

# Function to clean up background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down SmartTask services..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Start backend
echo "▶️ Launching Backend..."
"$DIR/scripts/run_backend.sh" &
BACKEND_PID=$!

# Wait a moment for backend to initialize
sleep 2

# Start frontend
echo "▶️ Launching Frontend..."
"$DIR/scripts/run_frontend.sh" &
FRONTEND_PID=$!

echo "=================================================="
echo "✅ Both services running concurrently!"
echo "   • Frontend: http://localhost:5173"
echo "   • Backend:  http://localhost:8000"
echo "   • API Docs: http://localhost:8000/docs"
echo "=================================================="
echo "Press Ctrl+C to stop all services."

wait
