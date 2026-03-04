# MissionPulse Monitoring Setup Guide

## 1. UptimeRobot (Free — 50 monitors, 5-min intervals)

Create account at https://uptimerobot.com

### Monitors to create

| Name | URL | Type | Interval | Alert |
|------|-----|------|----------|-------|
| MP - Homepage | https://missionpulse.ai | HTTP(s) | 5 min | Email |
| MP - Health API | https://missionpulse.ai/api/health | Keyword ("healthy" OR "degraded") | 5 min | Email |
| MP - Login Page | https://missionpulse.ai/login | HTTP(s) | 5 min | Email |
| MP - Plans Page | https://missionpulse.ai/plans | HTTP(s) | 5 min | Email |
| MP - API Auth Gate | https://missionpulse.ai/api/v1/opportunities | HTTP(s) - expect 307 | 5 min | Email |
| MP - Staging | https://missionpulsefrontend.netlify.app | HTTP(s) | 15 min | Email |
| MP - Supabase API | https://djuviwarqdvlbgcfuupa.supabase.co/rest/v1/ | HTTP(s) | 5 min | Email |
| MP - SSL Check | https://missionpulse.ai | Port 443 | 60 min | Email |

### Webhook integration (optional)

Set up a webhook alert contact pointing to:
`https://missionpulse.ai/api/monitoring/webhook`
with header `x-monitoring-secret: <your MONITORING_WEBHOOK_SECRET>`

## 2. Sentry Setup

1. Create free account at https://sentry.io
2. Create org: `mission-meets-tech`
3. Create project: `missionpulse` (platform: Next.js)
4. Copy the DSN (looks like `https://xxx@yyy.ingest.us.sentry.io/zzz`)
5. Generate an auth token at https://sentry.io/settings/auth-tokens/
6. Set in Netlify (both sites):
   - `NEXT_PUBLIC_SENTRY_DSN` = your DSN
   - `SENTRY_AUTH_TOKEN` = your auth token
   - `SENTRY_ORG` = mission-meets-tech
   - `SENTRY_PROJECT` = missionpulse

## 3. GitHub Actions Secrets

Add these in repo Settings > Secrets > Actions:

| Secret | Source |
|--------|--------|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | .env.local |
| `SUPABASE_SERVICE_ROLE_KEY` | .env.local |
| `STRIPE_SECRET_KEY` | .env.local |
| `NETLIFY_AUTH_TOKEN` | ~/Library/Preferences/netlify/config.json (the "token" field) |
| `MONITORING_WEBHOOK_SECRET` | Run: `openssl rand -hex 32` |
| `ANTHROPIC_API_KEY` | (optional, for PR review) console.anthropic.com |

## 4. Local Sentinel (macOS)

```bash
# Install
bash scripts/sentinel-install.sh

# Uninstall
bash scripts/sentinel-uninstall.sh

# Manual run
bash scripts/sentinel-cron-runner.sh

# View logs
ls -la .sentinel/logs/

# Check status
launchctl list | grep sentinel
```

## 5. Cost Summary

| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Sentry | Developer (free) | $0 |
| UptimeRobot | Free | $0 |
| GitHub Actions | Free tier (2000 min/mo) | $0 |
| Claude Code (local sentinel) | Included in Claude Max | $0 |
| **Total** | | **$0/month** |
