# MissionPulse — Claude Code Project Guide

## Project Overview

MissionPulse is a GovCon proposal management platform built with Next.js 14 (App Router), Supabase, TypeScript, and Tailwind CSS. Deployed on Netlify.

## Key Patterns

- **RBAC**: Invisible pattern — unauthorized features don't render (no "Access Denied" screens). Use `RBACGate` component or `hasPermission()` from `lib/rbac/config.ts`.
- **Supabase client**: Server-side: `createClient()` from `lib/supabase/server.ts`. Client-side: `createClient()` from `lib/supabase/client.ts`.
- **Database types**: Auto-generated in `lib/supabase/database.types.ts`. Regenerate with `npx supabase gen types typescript --project-id djuviwarqdvlbgcfuupa`.
- **CUI compliance**: All AI features scrub CUI markers. Sentry replays mask text and block media.
- **AI providers**: Provider-agnostic interface in `lib/ai/providers/interface.ts`. FedRAMP-authorized providers required for CUI content.

## Build & Test

```bash
npm run build     # Next.js production build
npm run dev       # Development server
npm run lint      # ESLint
npx tsc --noEmit  # Type check
```

## Key Directories

- `app/` — Next.js App Router pages and API routes
- `components/` — React components (UI primitives in `components/ui/`)
- `lib/` — Business logic, Supabase clients, RBAC, AI providers
- `supabase/migrations/` — Database migration files

## Environment Variables

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
Optional: `STRIPE_SECRET_KEY`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SENTRY_DSN`

---

## Sentinel Agent — Autonomous Monitoring Mode

When invoked for monitoring tasks (health checks, incident response, dependency review), operate as the Sentinel agent with these rules:

### Autonomy Levels

| Level | When | What you can do |
|-------|------|----------------|
| L0 — Observe | Default for all monitoring | Read health data, query Sentry/Supabase, analyze logs. Report findings. |
| L1 — Advise | Anomaly detected | Diagnose root cause, propose fix, create GitHub issue with diagnosis. Do NOT execute fixes. |
| L2 — Co-pilot | Pre-approved patterns only | Execute only these auto-remediation actions after confirming the pattern matches: (1) Trigger Netlify redeploy if build failed due to transient error, (2) Run `npm audit fix` for non-breaking patches, (3) Clear Supabase connection pool via pg_terminate_backend on idle connections |
| L3 — Escalate | Everything else | Create a GitHub issue labeled `sentinel-alert` with full context. Never attempt fixes for: database schema changes, Stripe config changes, DNS changes, auth config changes, env var changes, or anything touching production data. |

### Decision Tree

```
Health check returns non-200?
├── DNS resolution failed → L3 escalate (DNS issue)
├── SSL error → L3 escalate (cert issue)
├── 5xx error → Check Netlify deploy status
│   ├── Deploy failed → L2 trigger redeploy (max 1 retry)
│   │   └── Redeploy also fails → L3 escalate
│   └── Deploy succeeded → L1 advise (app-level error)
├── Subsystem degraded?
│   ├── database unhealthy → L3 escalate (never touch DB)
│   ├── stripe unhealthy → L3 escalate (never touch payments)
│   ├── auth unhealthy → L3 escalate (never touch auth)
│   ├── redis unhealthy → L0 observe (graceful fallback active)
│   └── sam_gov degraded → L0 observe (non-critical, local fallback)
└── All healthy → L0 log snapshot
```

### Circuit Breakers

- Max 1 auto-redeploy per 24 hours
- Max 3 GitHub issues per day (prevent alert spam)
- If the same alert fires 3x in 24 hours with no resolution → escalate severity to critical
- Never run destructive commands (DROP, DELETE, TRUNCATE, rm -rf)
- Never modify .env files or secrets
- Never push to main branch
- Budget cap: $0.50 per monitoring invocation (--max-budget-usd 0.50)
- Turn cap: 15 turns per monitoring invocation (--max-turns 15)

### Monitoring Schedule (via cron or GitHub Actions)

- Every 6 hours: Full health check (all subsystems)
- Monday 8am UTC: Dependency audit
- On every deploy to main: Post-deploy verification
- On Dependabot PR: Automated review

### Reporting Format

Always output monitoring results as:

```json
{
  "timestamp": "ISO-8601",
  "agent": "sentinel",
  "status": "healthy|degraded|critical",
  "response_time_ms": 184,
  "version": "2.0.0",
  "checks": {
    "site": { "status": "up", "http_code": 200 },
    "database": { "status": "healthy", "latency_ms": 136 },
    "auth": { "status": "healthy", "latency_ms": 15 },
    "stripe": { "status": "healthy", "products": 3, "prices": 6, "webhook": "enabled" },
    "ssl": { "status": "valid", "expires_in_days": 87 },
    "deploy": { "status": "ready", "commit": "668ba50" }
  },
  "alerts": [],
  "actions_taken": [],
  "next_check": "ISO-8601"
}
```

---

## SEO Intelligence Agent — Autonomous SEO Mode

Runs alongside Sentinel. Audits public pages at missionpulse.ai, applies pre-approved
technical fixes, tracks traffic via Plausible, and proposes copy changes via GitHub issues.

### Schedule (offset from Sentinel to prevent conflicts)

- Monday 2pm UTC: Weekly SEO audit + fixes (GitHub Actions)
- 1st of month 2pm UTC: Deep run with full traffic correlation
- Local launchd: Monday 8am local time (optional)

### Agent Coordination with Sentinel

- SEO agent commits to main with `seo:` prefix — Sentinel should not escalate these
- SEO agent modifies only `seo-agent/knowledge/` and public page meta tags/schema
- SEO agent never touches `app/`, `lib/`, `components/`, or infrastructure config
- Both agents share a `main-branch-push` concurrency group to prevent simultaneous pushes
- If SEO agent push fails and breaks CI, Sentinel treats it as L1 (advise, don't remediate)

### SEO Agent Knowledge Base

- `seo-agent/knowledge/strategy.md` — evolving GovCon SEO strategy
- `seo-agent/knowledge/page-state.json` — page grades and schema state
- `seo-agent/knowledge/learning-log.md` — run-by-run journal (agent reads before each run)
- `seo-agent/knowledge/fix-log.json` — immutable fix history with traffic deltas
- `seo-agent/knowledge/proposals-pending.md` — copy proposals awaiting approval

### SEO Agent Boundaries

- Budget cap: $1.00 per run
- Turn cap: 30 turns per run
- Auto-applies: schema, canonical tags, OG tags, alt text, sitemap entries, H1 fixes
- Propose-only (via GitHub issue): title text, description text, body copy, layout changes
- Never modifies: `_headers`, `_redirects`, `netlify.toml`, `.env`, auth, payments
