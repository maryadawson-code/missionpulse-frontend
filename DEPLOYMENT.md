# MissionPulse Deployment Guide

This document covers environment configuration, deployment workflows, monitoring, and operational procedures for MissionPulse.

---

## Environment Variables

All environment variables are managed via the Vercel dashboard (or `.env.local` for local development). Never commit `.env` files to the repository.

### Supabase

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public, used client-side) | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key (client-side) | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for admin operations (server-only) | Yes |
| `SUPABASE_URL` | Server-side Supabase URL fallback | Optional |
| `SUPABASE_ANON_KEY` | Server-side anon key fallback | Optional |
| `SUPABASE_POOLER_URL` | Connection pooler URL (preferred for server client) | Optional |

### Sentry

| Variable | Description | Required |
|---|---|---|
| `SENTRY_DSN` | Sentry DSN for server-side error tracking | Yes |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for client-side error tracking | Yes |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source map uploads | Yes |
| `SENTRY_CSP_REPORT_URI` | CSP report-uri endpoint for Content Security Policy violations | Optional |

### Stripe

| Variable | Description | Required |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key for server-side API calls | Yes |
| `STRIPE_WEBHOOK_SECRET` | Webhook endpoint signing secret | Yes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (client-side) | Yes |

### Redis (Upstash)

| Variable | Description | Required |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST API URL | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST API token | Yes |

### AI Providers

| Variable | Description | Required |
|---|---|---|
| `ASKSAGE_API_KEY` | AskSage API key (primary AI provider) | Yes |
| `ASKSAGE_API_URL` | AskSage API base URL (defaults to `https://api.asksage.ai/v1`) | Optional |
| `OPENAI_API_KEY` | OpenAI API key (fallback provider) | Optional |
| `ANTHROPIC_API_KEY` | Anthropic API key (fallback provider) | Optional |
| `AI_PRIMARY_PROVIDER` | Primary AI provider routing (defaults to `asksage`) | Optional |
| `AI_FALLBACK_PROVIDER` | Fallback AI provider routing (defaults to `anthropic`) | Optional |
| `AI_MONTHLY_BUDGET_USD` | Monthly AI spend budget in USD (defaults to `500`) | Optional |

### Integrations — Salesforce

| Variable | Description | Required |
|---|---|---|
| `SALESFORCE_CLIENT_ID` | Salesforce Connected App client ID | Optional |
| `SALESFORCE_CLIENT_SECRET` | Salesforce Connected App client secret | Optional |
| `SALESFORCE_REDIRECT_URI` | OAuth callback URL (defaults to `https://missionpulse.ai/api/integrations/salesforce/callback`) | Optional |
| `SALESFORCE_LOGIN_URL` | Salesforce login URL (defaults to `https://login.salesforce.com`) | Optional |

### Integrations — GovWin

| Variable | Description | Required |
|---|---|---|
| `GOVWIN_CLIENT_ID` | GovWin OAuth client ID | Optional |
| `GOVWIN_CLIENT_SECRET` | GovWin OAuth client secret | Optional |
| `GOVWIN_REDIRECT_URI` | OAuth callback URL | Optional |
| `GOVWIN_BASE_URL` | GovWin API base URL (defaults to `https://api.govwin.com/v2`) | Optional |
| `GOVWIN_AUTH_URL` | GovWin auth URL (defaults to `https://auth.govwin.com/oauth2`) | Optional |

### Integrations — Microsoft 365

| Variable | Description | Required |
|---|---|---|
| `M365_CLIENT_ID` | Azure AD application client ID | Optional |
| `M365_CLIENT_SECRET` | Azure AD application client secret | Optional |
| `M365_REDIRECT_URI` | OAuth callback URL | Optional |
| `M365_TENANT_ID` | Azure AD tenant ID (defaults to `common`) | Optional |

### Integrations — Google Workspace

| Variable | Description | Required |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Optional |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Optional |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL | Optional |

### Integrations — DocuSign

| Variable | Description | Required |
|---|---|---|
| `DOCUSIGN_CLIENT_ID` | DocuSign integration key | Optional |
| `DOCUSIGN_CLIENT_SECRET` | DocuSign client secret | Optional |
| `DOCUSIGN_REDIRECT_URI` | OAuth callback URL | Optional |
| `DOCUSIGN_ACCOUNT_ID` | DocuSign account ID | Optional |
| `DOCUSIGN_ENV` | Set to `production` for production DocuSign environment | Optional |

### Integrations — Slack

| Variable | Description | Required |
|---|---|---|
| `SLACK_CLIENT_ID` | Slack app client ID | Optional |
| `SLACK_CLIENT_SECRET` | Slack app client secret | Optional |
| `SLACK_REDIRECT_URI` | OAuth callback URL | Optional |
| `SLACK_SIGNING_SECRET` | Slack request signing secret for webhook verification | Optional |

### Integrations — SAM.gov

| Variable | Description | Required |
|---|---|---|
| `SAM_GOV_API_KEY` | SAM.gov Entity Management API key | Optional |

### Analytics

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_GA4_ID` | Google Analytics 4 measurement ID | Optional |

### Application

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Public site URL (defaults to `https://missionpulse.ai`) | Optional |
| `NEXT_PUBLIC_APP_URL` | Application URL used in billing redirects (defaults to `https://missionpulse.io`) | Optional |
| `NEXT_PUBLIC_SHOW_VITALS` | Set to `true` to show Web Vitals overlay in browser | Optional |
| `CRON_SECRET` | Secret for authenticating cron job requests | Yes |

### Performance Tuning

| Variable | Description | Required |
|---|---|---|
| `PERF_P95_ALERT_THRESHOLD_MS` | P95 latency alert threshold in ms (defaults to `2000`) | Optional |
| `SLOW_QUERY_THRESHOLD_MS` | Slow query logging threshold in ms (defaults to `500`) | Optional |

### Security

| Variable | Description | Required |
|---|---|---|
| `RATE_LIMIT_ALLOWLIST` | Comma-separated IP addresses exempt from rate limiting | Optional |

### Testing / CI

| Variable | Description | Required |
|---|---|---|
| `CI` | Set automatically in CI environments; controls Sentry verbosity | Auto |
| `ANALYZE` | Set to `true` to enable Webpack bundle analyzer | Optional |
| `E2E_TEST_EMAIL` | Email address for E2E test authentication | Optional |
| `E2E_TEST_PASSWORD` | Password for E2E test authentication | Optional |
| `PRODUCTION_URL` | Production URL for Playwright production smoke tests | Optional |

---

## NPM Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest unit tests |
| `npm run test:coverage` | Run tests with v8 coverage |
| `npm run test:ui` | Open Vitest UI |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:prod` | Run production smoke tests |
| `npm run analyze` | Build with bundle analyzer |
| `npm run lighthouse` | Run Lighthouse CI audit |

---

## Staging Deployment

MissionPulse uses Vercel for hosting with automatic preview deployments.

1. **Push to a feature branch** or open a pull request against `main`.
2. Vercel automatically creates a **preview deployment** with a unique URL.
3. Preview deployments use staging environment variables configured in the Vercel dashboard (Settings > Environment Variables > Preview).
4. GitHub Actions CI runs on every PR: build, lint, test, and Lighthouse audit.
5. Review the preview URL and CI results before merging.

---

## Production Deployment

1. **Merge to `main`** triggers an automatic Vercel production deployment.
2. Vercel builds the project (`next build`), uploads source maps to Sentry, and deploys.
3. **Post-deploy verification:**
   - Check `https://missionpulse.ai/api/health` for system health status.
   - Check Sentry for any new errors in the latest release.
   - Verify Lighthouse scores have not regressed (CI runs `lhci autorun`).

### Next.js Configuration Highlights

- **React Strict Mode:** Enabled
- **`poweredByHeader`:** Disabled (security hardening)
- **Instrumentation Hook:** Enabled (Sentry server-side init)
- **Source maps:** Hidden in production (`hideSourceMaps: true`)
- **Sentry tunnel:** Routed through `/monitoring` to bypass ad blockers
- **Security headers:** X-Frame-Options (DENY), HSTS, X-Content-Type-Options (nosniff), Referrer-Policy, Permissions-Policy, X-XSS-Protection
- **CSP:** Set dynamically per-request via middleware with nonce-based script tags
- **Image optimization:** Remote patterns configured for `*.supabase.co` and `*.gravatar.com`

---

## Monitoring

### Error Tracking — Sentry

- Client errors via `instrumentation-client.ts` (Turbopack-compatible)
- Server errors via `sentry.server.config.ts`
- Edge errors via `sentry.edge.config.ts`
- CUI data scrubbed from Sentry payloads before transmission
- Source maps uploaded on build for readable stack traces

### Health Check — `/api/health`

Returns JSON status of all critical dependencies:

- Supabase connectivity
- Stripe API reachability
- SAM.gov API status
- AI provider availability (AskSage / Anthropic / OpenAI)
- Application version

### Metrics — `/api/metrics`

System metrics endpoint for operational dashboards.

### Performance — Web Vitals

- `WebVitalsReporter` component captures CLS, FID, LCP, FCP, TTFB
- Performance budget enforced via Lighthouse CI in GitHub Actions
- P95 latency alerts configurable via `PERF_P95_ALERT_THRESHOLD_MS`
- Slow query logging via `SLOW_QUERY_THRESHOLD_MS`

### Lighthouse CI

Runs in GitHub Actions on every PR. Configuration in `.lighthouserc.js` or CI workflow.

---

## Rollback

### Application Rollback (Vercel)

Vercel maintains immutable deployments for every commit. To rollback:

1. Open the Vercel dashboard > Deployments.
2. Find the last known-good deployment.
3. Click the three-dot menu and select **Promote to Production**.
4. The rollback is instant (DNS repoint, no rebuild required).

### Database Rollback (Supabase)

Supabase provides point-in-time recovery (PITR) for Pro plan and above:

1. Open the Supabase dashboard > Database > Backups.
2. Select a recovery point before the incident.
3. Restore to a new project or in-place (depending on plan).

**Note:** Database rollbacks do not roll back the application. Coordinate application and database rollbacks together when schema changes are involved.

---

## Security Checklist

- [ ] Rotate all secrets (Supabase, Stripe, Sentry, AI keys) quarterly
- [ ] Never commit `.env`, `.env.local`, or `.env.production` files
- [ ] Use Vercel environment variable management for all secrets
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is server-only; never expose to the client
- [ ] All `NEXT_PUBLIC_*` variables are safe for client-side exposure
- [ ] CSP headers enforced via middleware with per-request nonces
- [ ] Rate limiting enabled via Upstash Redis (`@upstash/ratelimit`)
- [ ] Input sanitization via `isomorphic-dompurify` on all user content
- [ ] RLS enabled on all 200 Supabase tables
- [ ] Audit logs are immutable (AU-9 compliance)
- [ ] CUI data scrubbed from Sentry events (SC-13 compliance)
