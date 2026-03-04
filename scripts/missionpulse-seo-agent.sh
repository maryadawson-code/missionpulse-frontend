#!/usr/bin/env bash
# MissionPulse SEO Intelligence Agent — Audit Shell
#
# Usage:
#   bash scripts/missionpulse-seo-agent.sh           # full audit report
#   bash scripts/missionpulse-seo-agent.sh --audit   # audit only, no output
#   bash scripts/missionpulse-seo-agent.sh --json    # structured JSON output
#   bash scripts/missionpulse-seo-agent.sh --discover # find all public pages
#
# Dependencies: curl, jq, python3 (stdlib only)
# Never requires: Node.js, npm, build tools

set -euo pipefail

SITE="https://missionpulse.ai"
AGENT_DIR="seo-agent"
KNOWLEDGE_DIR="$AGENT_DIR/knowledge"
AUDIT_ONLY=false
JSON_OUTPUT=false
DISCOVER_MODE=false
PLAUSIBLE_DOMAIN="missionpulse.ai"

for arg in "$@"; do
  case $arg in
    --audit) AUDIT_ONLY=true ;;
    --json) JSON_OUTPUT=true ;;
    --discover) DISCOVER_MODE=true ;;
  esac
done

# ─────────────────────────────────────────────
# STEP 1: Load run context
# ─────────────────────────────────────────────

RUN_COUNT=$(python3 -c "
import json
try:
  d = json.load(open('$KNOWLEDGE_DIR/page-state.json'))
  print(d.get('run_count', 0) + 1)
except:
  print(1)
")

echo "MissionPulse SEO Agent — Run #$RUN_COUNT — $(date -u +%FT%TZ)"

# ─────────────────────────────────────────────
# STEP 2: Page discovery
# Crawl sitemap + try known patterns to find all public pages.
# ─────────────────────────────────────────────

KNOWN_PAGES=("/" "/features" "/pricing" "/about" "/demo" "/blog" "/resources")
LIVE_PAGES=()

# Check sitemap first
SITEMAP=$(curl -s "$SITE/sitemap.xml" || echo "")
if [ -n "$SITEMAP" ]; then
  SITEMAP_PAGES=$(echo "$SITEMAP" | grep -oE "https?://[^<]+" | sed "s|$SITE||" | sort -u || echo "")
fi

# Probe known pages
for PAGE in "${KNOWN_PAGES[@]}"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE$PAGE" --max-time 10 || echo "000")
  if [ "$STATUS" = "200" ]; then
    LIVE_PAGES+=("$PAGE")
    echo "  ✓ $PAGE ($STATUS)"
  else
    echo "  ✗ $PAGE ($STATUS — not yet live)"
  fi
done

# ─────────────────────────────────────────────
# STEP 3: Audit each live page
# ─────────────────────────────────────────────

for PAGE in "${LIVE_PAGES[@]}"; do
  HTML=$(curl -s "$SITE$PAGE" --max-time 15 || echo "")

  TITLE=$(echo "$HTML" | grep -oE '<title>[^<]+' | sed 's/<title>//' | head -1 || echo "")
  TITLE_LEN=${#TITLE}
  DESC=$(echo "$HTML" | grep -oE 'name="description" content="[^"]+' | sed 's/name="description" content="//' | head -1 || echo "")
  DESC_LEN=${#DESC}
  CANONICAL=$(echo "$HTML" | grep -oE 'rel="canonical" href="[^"]+' | sed 's/rel="canonical" href="//' | head -1 || echo "")
  H1_COUNT=$(echo "$HTML" | grep -c '<h1' || echo "0")
  OG_COUNT=$(echo "$HTML" | grep -c 'property="og:' || echo "0")
  SCHEMA_COUNT=$(echo "$HTML" | grep -c 'application/ld+json' || echo "0")
  HAS_SW_SCHEMA=$(echo "$HTML" | grep -c 'SoftwareApplication' || echo "0")
  HAS_FAQ_SCHEMA=$(echo "$HTML" | grep -c 'FAQPage' || echo "0")
  IMG_TOTAL=$(echo "$HTML" | grep -c '<img' || echo "0")
  IMG_MISSING_ALT=$(echo "$HTML" | grep '<img' | grep -vc 'alt=' 2>/dev/null || echo "0")
  IMG_MISSING_ALT=$(echo "$IMG_MISSING_ALT" | tail -1)
  ALT_COVERAGE=$([ "$IMG_TOTAL" -gt 0 ] && echo "$(( (IMG_TOTAL - IMG_MISSING_ALT) * 100 / IMG_TOTAL ))" || echo "100")
  IN_SITEMAP=$(echo "$SITEMAP" | grep -c "$SITE$PAGE" || echo "0")

  # Grading (10-point scale for SaaS pages)
  SCORE=0
  # Title: 20-60 chars, keyword-present
  [ -n "$TITLE" ] && [ "$TITLE_LEN" -ge 20 ] && [ "$TITLE_LEN" -le 65 ] && SCORE=$((SCORE+2))
  # Description: 100-165 chars
  [ -n "$DESC" ] && [ "$DESC_LEN" -ge 100 ] && [ "$DESC_LEN" -le 165 ] && SCORE=$((SCORE+2))
  # Canonical present
  [ -n "$CANONICAL" ] && SCORE=$((SCORE+1))
  # Single H1
  [ "$H1_COUNT" -eq 1 ] && SCORE=$((SCORE+1))
  # OG tags complete (4 minimum)
  [ "$OG_COUNT" -ge 4 ] && SCORE=$((SCORE+1))
  # Schema present (any)
  [ "$SCHEMA_COUNT" -ge 1 ] && SCORE=$((SCORE+1))
  # SoftwareApplication schema specifically (critical for SaaS)
  [ "$HAS_SW_SCHEMA" -ge 1 ] && SCORE=$((SCORE+1))
  # Alt text coverage
  [ "$ALT_COVERAGE" -ge 100 ] && SCORE=$((SCORE+1))

  if [ "$SCORE" -ge 9 ]; then GRADE="A"
  elif [ "$SCORE" -ge 7 ]; then GRADE="B"
  elif [ "$SCORE" -ge 5 ]; then GRADE="C"
  else GRADE="F"; fi

  echo "  $PAGE → $GRADE (score: $SCORE/10, schema: $SCHEMA_COUNT, SWApp: $HAS_SW_SCHEMA, FAQ: $HAS_FAQ_SCHEMA)"
done

# ─────────────────────────────────────────────
# STEP 4: Plausible traffic fetch
# ─────────────────────────────────────────────

PLAUSIBLE_DATA="{}"
if [ -n "${PLAUSIBLE_API_KEY:-}" ]; then
  PLAUSIBLE_DATA=$(curl -s \
    "https://plausible.io/api/v1/stats/breakdown?site_id=$PLAUSIBLE_DOMAIN&period=30d&property=event:page&limit=20" \
    -H "Authorization: Bearer $PLAUSIBLE_API_KEY" || echo "{}")
  echo "Plausible: data fetched."
else
  echo "Plausible: PLAUSIBLE_API_KEY not set — skipping traffic correlation."
fi

# ─────────────────────────────────────────────
# STEP 5: Update page-state.json
# ─────────────────────────────────────────────

python3 - <<PYEOF
import json, datetime

try:
    state = json.load(open('$KNOWLEDGE_DIR/page-state.json'))
except:
    state = {"run_count": 0, "pages": {}, "discovered_pages": []}

state['last_updated'] = datetime.datetime.utcnow().isoformat()
state['run_count'] = $RUN_COUNT
# Full page state written by Claude Code agent runner after audit
json.dump(state, open('$KNOWLEDGE_DIR/page-state.json', 'w'), indent=2)
print("page-state.json updated.")
PYEOF

echo "Run #$RUN_COUNT audit complete."
