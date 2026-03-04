#!/bin/zsh
set -euo pipefail

PLIST_SRC="$(cd "$(dirname "$0")" && pwd)/com.missionpulse.sentinel.plist"
PLIST_DST="$HOME/Library/LaunchAgents/com.missionpulse.sentinel.plist"
SENTINEL_DIR="$HOME/Desktop/missionpulse-frontend/.sentinel/logs"

echo "Installing MissionPulse Sentinel..."
mkdir -p "$SENTINEL_DIR"
cp "$PLIST_SRC" "$PLIST_DST"
launchctl load "$PLIST_DST"
echo "Sentinel installed. Health checks will run every 6 hours."
echo "   Logs: $SENTINEL_DIR"
echo "   To check status: launchctl list | grep sentinel"
echo "   To uninstall: bash scripts/sentinel-uninstall.sh"
