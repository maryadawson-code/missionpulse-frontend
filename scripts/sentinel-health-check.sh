#!/usr/bin/env bash
# Sentinel Health Check — standalone monitoring script
# Usage: sentinel-health-check.sh [--json] [--quiet]
# Exit codes: 0 = healthy, 1 = degraded, 2 = critical

set -uo pipefail

# ─── Configuration ──────────────────────────────────────────
SITE_URL="${SITE_URL:-https://missionpulse.ai}"
SUPABASE_URL="${SUPABASE_URL:-https://djuviwarqdvlbgcfuupa.supabase.co}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-}"
STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-}"
NETLIFY_AUTH_TOKEN="${NETLIFY_AUTH_TOKEN:-}"
NETLIFY_SITE_ID="${NETLIFY_SITE_ID:-be6df6a6-5c9d-4a96-9d97-592bbce9eaec}"

JSON_MODE=false
QUIET_MODE=false

for arg in "$@"; do
  case "$arg" in
    --json) JSON_MODE=true ;;
    --quiet) QUIET_MODE=true ;;
  esac
done

log() {
  if ! $QUIET_MODE; then echo "$@" >&2; fi
}

# ─── Checks ─────────────────────────────────────────────────
OVERALL_STATUS="healthy"
SUMMARY=""
ALERTS="[]"
CHECKS="{}"

fail_check() {
  local name="$1" status="$2" msg="$3"
  if [ "$status" = "critical" ] && [ "$OVERALL_STATUS" != "critical" ]; then
    OVERALL_STATUS="critical"
  elif [ "$status" = "degraded" ] && [ "$OVERALL_STATUS" = "healthy" ]; then
    OVERALL_STATUS="degraded"
  fi
  SUMMARY="${SUMMARY}${SUMMARY:+; }$name: $msg"
  ALERTS=$(echo "$ALERTS" | jq --arg n "$name" --arg s "$status" --arg m "$msg" \
    '. + [{"subsystem": $n, "severity": $s, "message": $m}]' 2>/dev/null || echo "$ALERTS")
}

# 1. Site HTTP check
log "Checking site availability..."
SITE_START=$(date +%s%N 2>/dev/null || python3 -c 'import time; print(int(time.time()*1e9))')
SITE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 15 "$SITE_URL")
SITE_END=$(date +%s%N 2>/dev/null || python3 -c 'import time; print(int(time.time()*1e9))')
RESPONSE_TIME_MS=$(( (SITE_END - SITE_START) / 1000000 ))

SITE_STATUS="up"
if [ "$SITE_CODE" != "200" ]; then
  SITE_STATUS="down"
  fail_check "site" "critical" "HTTP $SITE_CODE"
fi

# 2. Health endpoint
log "Checking health endpoint..."
HEALTH_RAW=$(curl -s -m 15 "$SITE_URL/api/health" 2>/dev/null || echo '{}')
HEALTH_STATUS=$(echo "$HEALTH_RAW" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")
HEALTH_VERSION=$(echo "$HEALTH_RAW" | jq -r '.version // "unknown"' 2>/dev/null || echo "unknown")
HEALTH_CHECKS=$(echo "$HEALTH_RAW" | jq -c '.checks // {}' 2>/dev/null || echo '{}')

# Parse subsystem checks from health endpoint
for SUBSYSTEM in database auth redis storage stripe ai_gateway sam_gov; do
  SUB_STATUS=$(echo "$HEALTH_CHECKS" | jq -r ".$SUBSYSTEM.status // \"unknown\"" 2>/dev/null || echo "unknown")
  SUB_LATENCY=$(echo "$HEALTH_CHECKS" | jq -r ".$SUBSYSTEM.latency_ms // 0" 2>/dev/null || echo "0")

  if [ "$SUB_STATUS" = "unhealthy" ]; then
    # sam_gov degraded is non-critical
    if [ "$SUBSYSTEM" = "sam_gov" ] || [ "$SUBSYSTEM" = "redis" ]; then
      fail_check "$SUBSYSTEM" "degraded" "unhealthy (non-critical)"
    else
      fail_check "$SUBSYSTEM" "critical" "unhealthy"
    fi
  elif [ "$SUB_STATUS" = "degraded" ]; then
    fail_check "$SUBSYSTEM" "degraded" "degraded"
  fi
done

# 3. Supabase direct check
log "Checking Supabase connectivity..."
if [ -n "$SUPABASE_ANON_KEY" ]; then
  SB_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 10 \
    "$SUPABASE_URL/rest/v1/" \
    -H "apikey: $SUPABASE_ANON_KEY" 2>/dev/null)
  if [ "$SB_CODE" != "200" ]; then
    fail_check "supabase_direct" "critical" "REST API returned $SB_CODE"
  fi
fi

# 4. SSL certificate check
log "Checking SSL certificate..."
SSL_DOMAIN=$(echo "$SITE_URL" | sed 's|https://||;s|http://||' | sed 's|/.*||')
SSL_EXPIRY=$(echo | openssl s_client -servername "$SSL_DOMAIN" -connect "$SSL_DOMAIN:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | sed 's/notAfter=//')
SSL_STATUS="valid"
SSL_DAYS=0

if [ -n "$SSL_EXPIRY" ]; then
  SSL_EPOCH=$(python3 -c "
from datetime import datetime
try:
    dt = datetime.strptime('$SSL_EXPIRY'.strip(), '%b %d %H:%M:%S %Y %Z')
    print(int(dt.timestamp()))
except:
    print(0)
" 2>/dev/null || echo "0")
  NOW_EPOCH=$(date +%s)
  SSL_DAYS=$(( (SSL_EPOCH - NOW_EPOCH) / 86400 ))

  if [ "$SSL_DAYS" -lt 7 ]; then
    SSL_STATUS="critical"
    fail_check "ssl" "critical" "expires in ${SSL_DAYS} days"
  elif [ "$SSL_DAYS" -lt 14 ]; then
    SSL_STATUS="warning"
    fail_check "ssl" "degraded" "expires in ${SSL_DAYS} days"
  fi
else
  SSL_STATUS="unknown"
  fail_check "ssl" "degraded" "could not determine expiry"
fi

# 5. Netlify deploy status
log "Checking Netlify deploy status..."
DEPLOY_STATUS="unknown"
DEPLOY_COMMIT=""
if [ -n "$NETLIFY_AUTH_TOKEN" ]; then
  DEPLOY_RAW=$(curl -s -m 10 \
    -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
    "https://api.netlify.com/api/v1/sites/$NETLIFY_SITE_ID/deploys?per_page=1" 2>/dev/null)
  DEPLOY_STATUS=$(echo "$DEPLOY_RAW" | jq -r '.[0].state // "unknown"' 2>/dev/null || echo "unknown")
  DEPLOY_COMMIT=$(echo "$DEPLOY_RAW" | jq -r '.[0].commit_ref // "unknown"' 2>/dev/null | head -c 7)

  if [ "$DEPLOY_STATUS" = "error" ]; then
    fail_check "deploy" "critical" "latest deploy failed"
  fi
fi

# 6. Stripe check
log "Checking Stripe connectivity..."
STRIPE_STATUS="unknown"
STRIPE_PRODUCTS=0
STRIPE_PRICES=0
STRIPE_WEBHOOK="unknown"
if [ -n "$STRIPE_SECRET_KEY" ]; then
  STRIPE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 10 \
    "https://api.stripe.com/v1/balance" -u "$STRIPE_SECRET_KEY:" 2>/dev/null)
  if [ "$STRIPE_CODE" = "200" ]; then
    STRIPE_STATUS="healthy"
    STRIPE_PRODUCTS=$(curl -s -m 10 "https://api.stripe.com/v1/products?active=true&limit=100" \
      -u "$STRIPE_SECRET_KEY:" 2>/dev/null | jq '.data | length' 2>/dev/null || echo "0")
    STRIPE_PRICES=$(curl -s -m 10 "https://api.stripe.com/v1/prices?active=true&limit=100" \
      -u "$STRIPE_SECRET_KEY:" 2>/dev/null | jq '.data | length' 2>/dev/null || echo "0")
    WEBHOOK_DATA=$(curl -s -m 10 "https://api.stripe.com/v1/webhook_endpoints?limit=10" \
      -u "$STRIPE_SECRET_KEY:" 2>/dev/null)
    STRIPE_WEBHOOK=$(echo "$WEBHOOK_DATA" | jq -r '[.data[] | select(.url | contains("missionpulse"))][0].status // "not_found"' 2>/dev/null || echo "unknown")
  else
    STRIPE_STATUS="unhealthy"
    fail_check "stripe_direct" "critical" "API returned $STRIPE_CODE"
  fi
fi

# ─── Build JSON output ─────────────────────────────────────
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
NEXT_CHECK=$(date -u -v+6H +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d "+6 hours" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo "unknown")

OUTPUT=$(jq -n \
  --arg ts "$TIMESTAMP" \
  --arg status "$OVERALL_STATUS" \
  --argjson rt "${RESPONSE_TIME_MS:-0}" \
  --arg ver "$HEALTH_VERSION" \
  --arg summary "$SUMMARY" \
  --arg next "$NEXT_CHECK" \
  --arg site_status "$SITE_STATUS" \
  --argjson site_code "${SITE_CODE:-0}" \
  --argjson health_checks "$HEALTH_CHECKS" \
  --arg ssl_status "$SSL_STATUS" \
  --argjson ssl_days "${SSL_DAYS:-0}" \
  --arg deploy_status "$DEPLOY_STATUS" \
  --arg deploy_commit "$DEPLOY_COMMIT" \
  --arg stripe_status "$STRIPE_STATUS" \
  --argjson stripe_products "${STRIPE_PRODUCTS:-0}" \
  --argjson stripe_prices "${STRIPE_PRICES:-0}" \
  --arg stripe_webhook "$STRIPE_WEBHOOK" \
  --argjson alerts "$ALERTS" \
'{
  "timestamp": $ts,
  "agent": "sentinel",
  "status": $status,
  "response_time_ms": $rt,
  "version": $ver,
  "summary": $summary,
  "checks": {
    "site": { "status": $site_status, "http_code": $site_code },
    "database": ($health_checks.database // { "status": "unknown" }),
    "auth": ($health_checks.auth // { "status": "unknown" }),
    "storage": ($health_checks.storage // { "status": "unknown" }),
    "stripe": { "status": $stripe_status, "products": $stripe_products, "prices": $stripe_prices, "webhook": $stripe_webhook },
    "ssl": { "status": $ssl_status, "expires_in_days": $ssl_days },
    "deploy": { "status": $deploy_status, "commit": $deploy_commit }
  },
  "alerts": $alerts,
  "actions_taken": [],
  "next_check": $next
}')

if $JSON_MODE; then
  echo "$OUTPUT"
else
  log ""
  log "=== Sentinel Health Check ==="
  log "Status: $OVERALL_STATUS"
  log "Version: $HEALTH_VERSION"
  log "Response time: ${RESPONSE_TIME_MS}ms"
  log "SSL expires in: ${SSL_DAYS} days"
  log "Deploy: $DEPLOY_STATUS ($DEPLOY_COMMIT)"
  log "Stripe: $STRIPE_STATUS (${STRIPE_PRODUCTS} products, ${STRIPE_PRICES} prices)"
  if [ -n "$SUMMARY" ]; then
    log ""
    log "Issues: $SUMMARY"
  fi
  log ""
  echo "$OUTPUT"
fi

# ─── Exit code ──────────────────────────────────────────────
case "$OVERALL_STATUS" in
  healthy) exit 0 ;;
  degraded) exit 1 ;;
  critical) exit 2 ;;
  *) exit 1 ;;
esac
