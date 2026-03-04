#!/bin/zsh
PLIST="$HOME/Library/LaunchAgents/com.missionpulse.seo-agent.plist"
[ -f "$PLIST" ] && launchctl unload "$PLIST" && rm "$PLIST" \
  && echo "Uninstalled." || echo "Not installed."
