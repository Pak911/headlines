#!/bin/bash

echo "========================================"
echo "  Headlines - Crossword Game Launcher"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null
then
    echo "ERROR: Python is not installed!"
    echo ""
    echo "Please install Python:"
    echo "  Mac: brew install python3"
    echo "  Linux: sudo apt-get install python3"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

echo "Starting Headlines server..."
echo ""
echo "The game will open in your browser automatically."
echo "Keep this window open while playing."
echo ""
echo "Press Ctrl+C to stop the server when done."
echo "========================================"
echo ""

# Determine Python command (python3 or python)
if command -v python3 &> /dev/null
then
    PYTHON_CMD="python3"
else
    PYTHON_CMD="python"
fi

# Kill any existing Python server on port 8033
pkill -f "python.*http.server.*8033" || true

# Open browser after a short delay
if command -v xdg-open &> /dev/null; then
    (sleep 2 && xdg-open http://localhost:8033) &
elif command -v open &> /dev/null; then
    (sleep 2 && open http://localhost:8033) &
elif command -v start &> /dev/null; then
    (sleep 2 && start http://localhost:8033) &
fi

# Start Python server
$PYTHON_CMD -m http.server 8033