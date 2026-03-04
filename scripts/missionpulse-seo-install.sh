#!/bin/zsh
set -euo pipefail

PLIST_SRC="$(cd "$(dirname "$0")" && pwd)/com.missionpulse.seo-agent.plist"
PLIST_DST="$HOME/Library/LaunchAgents/com.missionpulse.seo-agent.plist"

echo "Installing MissionPulse SEO Intelligence Agent..."

which claude   || { echo "ERROR: claude CLI not in PATH. Install Claude Code first."; exit 1; }
which jq       || { echo "ERROR: jq not installed. Run: brew install jq"; exit 1; }
which python3  || { echo "ERROR: python3 not in PATH."; exit 1; }

mkdir -p "$(dirname "$0")/../.seo-agent/logs"

if [ -z "${PLAUSIBLE_API_KEY:-}" ]; then
  echo ""
  echo "Plausible API key not set."
  echo "Get it at: https://plausible.io/settings → API Keys"
  read -r "key?Enter Plausible API key (Enter to skip): "
  if [ -n "$key" ]; then
    sed -i '' "s/REPLACE_WITH_YOUR_KEY/$key/" "$PLIST_SRC"
    echo "Key set."
  fi
fi

cp "$PLIST_SRC" "$PLIST_DST"
launchctl load "$PLIST_DST"

echo ""
echo "MissionPulse SEO Agent installed."
echo "   Schedule: every Monday 8am local time"
echo "   Logs: .seo-agent/logs/"
echo "   Status: launchctl list | grep missionpulse.seo"
echo "   Manual run: bash scripts/missionpulse-seo-runner.sh"
echo "   Audit only: bash scripts/missionpulse-seo-agent.sh --audit"
echo "   Uninstall: bash scripts/missionpulse-seo-uninstall.sh"
