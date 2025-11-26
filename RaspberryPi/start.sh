#!/bin/bash
# Safe startup script for Plant Monitoring System
# This script kills any existing processes and cleans GPIO before starting

echo "=========================================="
echo "Plant Monitoring System - Safe Startup"
echo "=========================================="

# Navigate to script directory
cd "$(dirname "$0")"

# Kill any existing main.py processes
echo "1. Checking for existing processes..."
if pgrep -f "python.*main.py" > /dev/null; then
    echo "   Found existing process, killing..."
    sudo pkill -f "python.*main.py"
    sleep 2
    echo "   ✓ Processes killed"
else
    echo "   ✓ No existing processes found"
fi

# Clean up GPIO
echo "2. Cleaning up GPIO pins..."
python3 cleanup_gpio.py
if [ $? -eq 0 ]; then
    echo "   ✓ GPIO cleanup successful"
else
    echo "   ⚠ GPIO cleanup had issues (may be normal)"
fi

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "3. Activating virtual environment..."
    source venv/bin/activate
    echo "   ✓ Virtual environment activated"
else
    echo "3. No virtual environment found, using system Python"
fi

# Start the monitoring system
echo "4. Starting Plant Monitoring System..."
echo "=========================================="
echo ""

python3 main.py

# Cleanup on exit
echo ""
echo "=========================================="
echo "Shutting down..."
python3 cleanup_gpio.py
echo "=========================================="
