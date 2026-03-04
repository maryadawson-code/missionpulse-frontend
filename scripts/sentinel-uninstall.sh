#!/bin/zsh
PLIST="$HOME/Library/LaunchAgents/com.missionpulse.sentinel.plist"
if [ -f "$PLIST" ]; then
  launchctl unload "$PLIST"
  rm "$PLIST"
  echo "Sentinel uninstalled."
else
  echo "Sentinel not installed."
fi
