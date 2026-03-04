#!/bin/zsh
# Sentinel Cron Runner — invokes Claude Code for autonomous health monitoring
# Designed for macOS launchd or crontab

set -euo pipefail

PROJECT_DIR="$HOME/Desktop/missionpulse-frontend"
LOG_DIR="$PROJECT_DIR/.sentinel/logs"
LOCK_FILE="$PROJECT_DIR/.sentinel/sentinel.lock"

mkdir -p "$LOG_DIR"

# Prevent concurrent runs
if [ -f "$LOCK_FILE" ]; then
  LOCK_AGE=$(( $(date +%s) - $(stat -f %m "$LOCK_FILE") ))
  if [ "$LOCK_AGE" -lt 300 ]; then
    echo "$(date -u +%FT%TZ) Sentinel already running (lock age: ${LOCK_AGE}s). Skipping." >> "$LOG_DIR/sentinel.log"
    exit 0
  fi
  rm -f "$LOCK_FILE"
fi

trap 'rm -f "$LOCK_FILE"' EXIT
touch "$LOCK_FILE"

LOGFILE="$LOG_DIR/sentinel-$(date -u +%Y%m%d-%H%M%S).json"

cd "$PROJECT_DIR"

# Run Claude Code in headless mode with tight constraints
claude -p \
  --output-format json \
  --max-turns 15 \
  "You are Sentinel, the MissionPulse monitoring agent. Run a full health check:
1. Execute scripts/sentinel-health-check.sh --json
2. Analyze the results
3. If any subsystem is unhealthy or critical, assess severity using the decision tree in CLAUDE.md
4. If L2 auto-remediation is appropriate (e.g., transient deploy failure), take the approved action
5. If L3 escalation is needed, output the alert details so they can be routed to a GitHub issue
6. Output the full monitoring report in the Sentinel JSON format specified in CLAUDE.md" \
  > "$LOGFILE" 2>&1

# Parse result and check for critical alerts
if command -v jq &> /dev/null; then
  RESULT=$(cat "$LOGFILE" | jq -r '.result // empty' 2>/dev/null || echo "")
  if echo "$RESULT" | grep -qi '"severity".*"critical"'; then
    echo "$(date -u +%FT%TZ) CRITICAL alert detected. Check $LOGFILE" >> "$LOG_DIR/sentinel.log"
  fi
fi

echo "$(date -u +%FT%TZ) Health check complete. Log: $LOGFILE" >> "$LOG_DIR/sentinel.log"

# Prune logs older than 30 days
find "$LOG_DIR" -name "sentinel-*.json" -mtime +30 -delete 2>/dev/null || true
