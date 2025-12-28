#!/bin/bash
# Emergency Kiro Stop Script
# Use this if Kiro agent becomes unresponsive to normal cancellation

echo "🚨 EMERGENCY STOP: Killing all Kiro processes..."

# Find and display Kiro processes
echo "Current Kiro processes:"
ps aux | grep -E "(kiro|Kiro)" | grep -v grep

# Kill Kiro processes (graceful first)
echo "Attempting graceful shutdown..."
pkill -TERM -f kiro
pkill -TERM -f Kiro

# Wait a moment
sleep 2

# Force kill if still running
echo "Force killing any remaining processes..."
pkill -9 -f kiro
pkill -9 -f Kiro

# Kill any electron processes that might be Kiro
pkill -9 -f "electron.*kiro"

# Check if any processes remain
echo "Remaining Kiro processes:"
ps aux | grep -E "(kiro|Kiro)" | grep -v grep

echo "✅ Emergency stop complete. Check above for any remaining processes."
echo "If processes remain, you may need to restart your system."