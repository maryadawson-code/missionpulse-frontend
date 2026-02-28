# MissionPulse v1.4 Roadmap — Production Hardening

**From Feature-Complete to Production-Ready**
4 Sprints • 19 Tickets • Phase K

Supersedes nothing — extends ROADMAP_v1_3_DOC_COLLAB.md (S29–S31)
Sprint numbering continues from S31. Ticket numbering continues from T-31.4.
Depends on: All prior sprints complete. Build: 0 errors, 0 type errors.

**PROPRIETARY — Mission Meets Tech, LLC — February 2026**

---

## 1. Strategic Overview

### 1.1 Where We Are

v1.3 is complete. All 16 modules, 8 AI agents, multi-model gateway, track-changes UX, document collaboration loop, and 3 GTM sprints are shipped. 31 sprints + 3 GTM sprints delivered. Build passes with 0 errors, 0 type errors, 37 lint warnings. Both `v2-development` and `main` branches are synced.

HEAD: 791e8be on main. Build: CLEAR.

A production audit before onboarding paid pilot customers handling CUI data revealed critical gaps:

| Gap | Current State | Risk |
|-----|--------------|------|
| Error monitoring | Zero. No Sentry, no APM, no error reporting. Production errors are invisible. | Blind to failures. CUI data incidents go undetected. |
| Rate limiting | In-memory `Map` on 3 of 13 API routes. Not effective in serverless deployment (per-instance maps). | DDoS exposure. Brute force attacks. Webhook abuse. |
| Unit tests | Zero. 20 Playwright E2E specs exist but no unit or component tests. No Vitest, no Jest. | Regressions ship undetected. RBAC logic untested. Billing logic untested. |
| Code splitting | Zero `next/dynamic` usage. Every component loads synchronously. | Slow initial page load. Wasted bandwidth. |
| Accessibility | 19 `aria-*` attributes across 15 files. Dozens of interactive components lack ARIA. | Section 508 non-compliance. Federal customers require WCAG 2.1 AA. |
| CSP | `'unsafe-eval'` and `'unsafe-inline'` in script-src/style-src. No nonce strategy. No violation reporting. | XSS protection defeated. CMMC SC-13 weakness. |
| Security headers | Missing `object-src 'none'`, sends `X-Powered-By: Next.js`, no `reactStrictMode`. | Information disclosure. Attack surface exposure. |
| Health checks | Single `/api/health` endpoint. No Redis, no storage, no external API checks. | Partial observability. Silent degradation of subsystems. |
| Web Vitals | Zero runtime collection. ESLint `next/core-web-vitals` is lint-time only. | No performance baseline. No regression detection. |
| Input sanitization | No DOMPurify or equivalent. User-generated content rendered without sanitization. | Stored XSS risk in proposal content, comments, activity feeds. |

These gaps are blockers for onboarding paying customers who handle CUI data under NIST 800-171 / CMMC requirements.

### 1.2 Where We're Going

Production-hardened MissionPulse v1.4 that satisfies:
- **Observability:** Every error captured, every performance metric tracked, every health check passing
- **Security:** All API routes rate-limited via Redis, CSP hardened with nonces, input sanitized, brute force protection distributed
- **Testing:** RBAC, billing, and UI components covered by 75+ unit tests with >80% critical-path coverage
- **Performance:** Bundle split, images optimized, N+1 queries eliminated, Lighthouse CI enforcing budgets
- **Accessibility:** WCAG 2.1 AA compliance across all interactive components

### 1.3 Phase Map

| Phase | Sprints | What Ships |
|-------|---------|------------|
| K: Production Hardening (v1.4) | S32–S35 | Sentry, structured logging, Web Vitals, health expansion, Redis rate limiting, CSP nonces, input sanitization, Vitest + 75 unit tests, accessibility audit, bundle splitting, image optimization, Lighthouse CI |

### 1.4 Sprint Cadence

| Parameter | Value |
|-----------|-------|
| Sprint Length | Maximize delivery per sprint. No fixed time constraint. |
| Tickets per Sprint | 4–5 (packed for throughput) |
| Validation | npm run build must pass for every ticket |
| Branch | All work on v2-development. Merge to main per release. |
| Deploy | Staging auto-deploys on push. Production = manual merge. |
| v1.4 Target | Q2 2026 |

### 1.5 Execution Rules

Same as v1.1/v1.2/v1.3. Additionally:
- All new dependencies must be justified by a production gap (no "nice to have" packages)
- Security changes require before/after CSP violation testing
- Test files follow the pattern `__tests__/[module].test.ts` or co-located `[component].test.tsx`
- Lighthouse scores must not regress — CI enforces budget after T-35.5
- No `as any` in test files — tests use the same strict TypeScript config as production code

---

## 2. PHASE K: Production Hardening (v1.4)

Goal: Close every gap identified in the production audit. Make MissionPulse safe to deploy for paying customers handling CUI data. Every error visible, every route protected, every critical path tested, every page fast and accessible.

---

### SPRINT 32 — Observability & Error Monitoring

*Sentry SDK integration. Structured logging. Web Vitals collection. Health check expansion with alerting.*

#### T-32.1 Sentry SDK Integration

Zero error monitoring exists in production. Errors are invisible — no alerts, no stack traces, no breadcrumbs. When a CUI-handling proposal workflow fails, nobody knows until the customer reports it (if they report it). Sentry provides error capture, performance tracing, and session replay for Next.js App Router with server component support.

**Acceptance Criteria:**
- [ ] `@sentry/nextjs` installed and configured via `npx @sentry/wizard@latest -i nextjs`
- [ ] `sentry.client.config.ts` — client-side error capture with 1.0 sample rate, 0.1 traces sample rate
- [ ] `sentry.server.config.ts` — server-side error capture for Server Components, Server Actions, and API routes
- [ ] `sentry.edge.config.ts` — edge runtime capture for middleware
- [ ] `instrumentation.ts` — Next.js instrumentation hook initializing Sentry
- [ ] `app/global-error.tsx` — global error boundary wrapping Sentry.ErrorBoundary, displays branded error page
- [ ] Environment-aware DSN: `SENTRY_DSN` env var, disabled in development unless `SENTRY_DEBUG=true`
- [ ] Source maps uploaded to Sentry on build (via `@sentry/nextjs` webpack plugin, maps NOT served publicly)
- [ ] User context attached: user ID, role, company ID (NO email, NO name — CUI privacy)
- [ ] Custom tags: `module` (pipeline, warroom, shredder, etc.), `action_type` (crud, ai, sync)
- [ ] Sensitive data scrubbed: `beforeSend` filter strips request bodies containing CUI markers
- [ ] Test: trigger intentional error → verify appears in Sentry dashboard within 30s
- [ ] npm run build passes

**Depends on:** None (first ticket in phase)
**Files:** sentry.client.config.ts, sentry.server.config.ts, sentry.edge.config.ts, instrumentation.ts, app/global-error.tsx, next.config.mjs (modify — wrap with `withSentryConfig`)

---

#### T-32.2 Structured Logging Library

Console.log statements scattered across the codebase provide no structure, no levels, no correlation IDs. In production, logs are noise. A structured logging library provides JSON-formatted logs with severity levels, request correlation, and module context — making production debugging possible without Sentry (for non-error operational visibility).

**Acceptance Criteria:**
- [ ] `lib/logging/logger.ts` — structured logger with `info`, `warn`, `error`, `debug` levels
- [ ] JSON output format: `{ timestamp, level, message, module, correlationId, userId, ...metadata }`
- [ ] Correlation ID: generated per request in middleware, threaded through Server Actions and API routes via `AsyncLocalStorage`
- [ ] Module context: each logger instance scoped to a module (`logger('pipeline')`, `logger('billing')`, `logger('ai')`)
- [ ] Log level controlled by `LOG_LEVEL` env var (default: `info` in production, `debug` in development)
- [ ] Sentry integration: `error` level logs auto-sent to Sentry as breadcrumbs
- [ ] Sensitive data redaction: auto-redact fields matching `password`, `token`, `secret`, `key`, `authorization`
- [ ] Replace `console.log` in all Server Actions (`lib/actions/*.ts`) with structured logger calls
- [ ] npm run build passes

**Depends on:** T-32.1 (Sentry integration for breadcrumb forwarding)
**Files:** lib/logging/logger.ts, lib/logging/correlation.ts, middleware.ts (modify — inject correlation ID), lib/actions/*.ts (modify — replace console.log)

---

#### T-32.3 Web Vitals Collection

No runtime Web Vitals measurement exists. ESLint's `next/core-web-vitals` is lint-time only — it checks code patterns, not actual user experience. Without LCP, FID, CLS, FCP, and TTFB data from real users, there's no baseline for performance optimization and no way to detect regressions.

**Acceptance Criteria:**
- [ ] `web-vitals` package installed
- [ ] `lib/monitoring/web-vitals.ts` — collector using `onCLS`, `onFID`, `onINP`, `onLCP`, `onFCP`, `onTTFB`
- [ ] Metrics reported to Sentry Performance via `Sentry.metrics` (no separate analytics endpoint needed)
- [ ] Route-level attribution: each metric tagged with the current route path
- [ ] `app/layout.tsx` — `<WebVitalsReporter />` client component mounted at root
- [ ] Development overlay: when `NEXT_PUBLIC_SHOW_VITALS=true`, display vitals badge in bottom-right corner
- [ ] Baseline capture: document initial CWV scores in `docs/performance-baseline.md` after first production deploy
- [ ] npm run build passes

**Depends on:** T-32.1 (Sentry as metrics backend)
**Files:** lib/monitoring/web-vitals.ts, components/monitoring/WebVitalsReporter.tsx, app/layout.tsx (modify), docs/performance-baseline.md

---

#### T-32.4 Health Check Expansion + Alerting

The existing `/api/health` endpoint checks database, auth, and AI gateway config. It does not check Redis, Supabase Storage, external API connectivity (SAM.gov, Stripe), or any v1.1+ subsystems. A comprehensive health check is required for uptime monitoring and automated alerting.

**Acceptance Criteria:**
- [ ] Expand `app/api/health/route.ts` with additional subsystem checks:
  - Redis connectivity (Upstash ping + latency)
  - Supabase Storage (list buckets, verify `rfp-documents` bucket exists)
  - Stripe API connectivity (retrieve balance, verify key validity)
  - SAM.gov API reachability (HEAD request to endpoint)
  - Microsoft Graph API token validity (if M365 configured)
  - Google API token validity (if Google Workspace configured)
- [ ] Each check returns: `status` (healthy/degraded/unhealthy), `latency_ms`, `last_checked`
- [ ] Overall health: healthy if all critical checks pass, degraded if non-critical fails, unhealthy if any critical fails
- [ ] Critical subsystems: database, auth, redis. Non-critical: storage, stripe, sam, m365, google
- [ ] `/api/health/detailed` endpoint for full subsystem breakdown (admin RBAC required)
- [ ] `/api/health` (public) returns only overall status + version (no subsystem details)
- [ ] Structured log entry on every health check with all subsystem results
- [ ] `Retry-After` header returned on 503 responses
- [ ] npm run build passes

**Depends on:** T-32.2 (structured logging)
**Files:** app/api/health/route.ts (modify), app/api/health/detailed/route.ts, lib/monitoring/health-checks.ts

---

### SPRINT 33 — Security Hardening

*Redis-backed rate limiting. Brute force protection. CSP nonces. Input sanitization. Dependency audit.*

#### T-33.1 Redis Rate Limiting Library

All 3 existing rate limiters use in-memory `Map<string, {count, resetAt}>`. In Vercel's serverless deployment, each function invocation gets its own memory space — rate limits reset on every cold start and are not shared across instances. An attacker can bypass every rate limit by simply hitting different instances. Redis-backed rate limiting via Upstash provides distributed, persistent enforcement.

**Acceptance Criteria:**
- [ ] `@upstash/ratelimit` installed
- [ ] `lib/security/rate-limiter.ts` — rate limiter factory using existing Upstash Redis connection (from `lib/cache/redis.ts`)
- [ ] Three rate limit tiers:
  - `strict`: 5 requests / 60s (auth endpoints, password reset)
  - `standard`: 30 requests / 60s (API routes, form submissions)
  - `relaxed`: 100 requests / 60s (read-heavy endpoints, health checks)
- [ ] Sliding window algorithm (not fixed window — prevents burst-at-boundary attacks)
- [ ] Rate limit headers on all responses: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- [ ] 429 response includes `Retry-After` header with seconds until reset
- [ ] Rate limit key: IP address + route path (prevents cross-route exhaustion)
- [ ] Fallback: if Redis unavailable, allow request through with structured log warning (fail open for availability, log for visibility)
- [ ] Remove all in-memory `Map` rate limiters from middleware.ts and newsletter route
- [ ] npm run build passes

**Depends on:** T-19.1 (Redis/Upstash already configured in lib/cache/redis.ts)
**Files:** lib/security/rate-limiter.ts, middleware.ts (modify — remove in-memory rate limiter), app/api/newsletter/route.ts (modify — remove in-memory rate limiter)

---

#### T-33.2 Rate Limit All API Routes

Only 3 of 13 API routes have any rate limiting (and those use broken in-memory Maps). The remaining 10 routes — including Stripe webhooks, integration callbacks, cron endpoints, and section version APIs — are completely unprotected. Every public-facing route must be rate-limited.

**Acceptance Criteria:**
- [ ] All 13 API routes protected by Redis rate limiter from T-33.1:
  - `POST /api/auth/callback` — `strict` (5/min)
  - `POST /api/newsletter` — `strict` (5/hr per IP — custom window)
  - `POST /api/webhooks/stripe` — `standard` (30/min — Stripe retries need headroom)
  - `GET /api/health` — `relaxed` (100/min — uptime monitors poll frequently)
  - `GET /api/metrics` — `standard` (30/min)
  - `GET|POST /api/section-versions` — `standard` (30/min)
  - `GET /api/cron/daily` — `strict` (5/min — cron should fire once, not flood)
  - All 5 integration callbacks (`/api/integrations/*/callback`) — `standard` (30/min)
- [ ] Rate limiter applied via middleware (single enforcement point, not per-route code)
- [ ] Webhook routes (Stripe, integration callbacks): rate limit by source IP, not by webhook signature (signature validation is separate concern)
- [ ] Structured log on every rate limit hit: IP, route, limit tier, remaining
- [ ] Rate limit bypass for internal health checks from known monitoring IPs (configurable via `RATE_LIMIT_ALLOWLIST` env var)
- [ ] npm run build passes

**Depends on:** T-33.1
**Files:** middleware.ts (modify — add route-to-tier mapping and enforcement), lib/security/rate-limiter.ts (modify — add route config)

---

#### T-33.3 Auth Brute Force Protection

The existing in-memory rate limit on `/login` POST (10/min) is ineffective in serverless. Beyond rate limiting, brute force protection requires progressive delays and account-level lockout — not just IP-level throttling. An attacker trying credential stuffing from rotating IPs bypasses IP-only rate limits.

**Acceptance Criteria:**
- [ ] `lib/security/brute-force.ts` — brute force protection using Redis
- [ ] IP-level: after 5 failed login attempts from same IP in 15 minutes, block IP for 30 minutes
- [ ] Account-level: after 10 failed login attempts to same email in 1 hour, lock account for 1 hour (regardless of IP)
- [ ] Progressive delay: 1st-3rd attempt = immediate, 4th = 2s delay, 5th = 5s delay (server-side sleep before response)
- [ ] Lockout notification: send email to account owner on account lockout (via Supabase Auth email)
- [ ] Admin unlock: executive/admin role can unlock accounts from user management page
- [ ] Failed attempt counter stored in Redis with TTL (auto-expires, no manual cleanup)
- [ ] Successful login resets IP counter (not account counter — account counter decays by TTL only)
- [ ] Structured log on every lockout event: IP, email (hashed), lockout duration, attempt count
- [ ] npm run build passes

**Depends on:** T-33.1 (Redis rate limiter infrastructure)
**Files:** lib/security/brute-force.ts, middleware.ts (modify — integrate brute force check on auth routes), app/(dashboard)/admin/users/page.tsx (modify — add unlock action)

---

#### T-33.4 CSP Hardening + Security Headers

Current CSP allows `'unsafe-eval'` and `'unsafe-inline'` in script-src, defeating XSS protection. The `X-Powered-By: Next.js` header discloses the framework. No `object-src 'none'` directive. No CSP violation reporting. These are exploitable weaknesses that must be closed before handling CUI data.

**Acceptance Criteria:**
- [ ] Remove `'unsafe-eval'` from CSP script-src (Next.js production builds do not require it — only dev mode does)
- [ ] Replace `'unsafe-inline'` in script-src with nonce-based strategy:
  - Generate per-request nonce in middleware
  - Pass nonce to `<Script>` and inline scripts via Next.js `nonce` prop
  - CSP script-src becomes `'self' 'nonce-{random}'`
- [ ] `style-src`: keep `'unsafe-inline'` (required by Tailwind's runtime styles and shadcn) but document this as accepted risk
- [ ] Add `object-src 'none'` to CSP (prevents Flash/Java plugin exploitation)
- [ ] Add `upgrade-insecure-requests` directive
- [ ] CSP `report-uri` pointing to Sentry CSP reporting endpoint (`SENTRY_CSP_REPORT_URI` env var)
- [ ] Remove `X-Powered-By` header: add `poweredByHeader: false` to `next.config.mjs`
- [ ] Add `reactStrictMode: true` to `next.config.mjs`
- [ ] Tighten `img-src`: replace blanket `https:` with specific allowed origins (Supabase Storage URL, Gravatar, `data:`, `blob:`)
- [ ] CSP is environment-aware: development allows `'unsafe-eval'` (HMR needs it), production does not
- [ ] Verify no inline scripts break after CSP tightening (test all pages with CSP reporting enabled)
- [ ] npm run build passes

**Depends on:** T-32.1 (Sentry for CSP violation reporting)
**Files:** next.config.mjs (modify), middleware.ts (modify — generate and inject nonce), app/layout.tsx (modify — pass nonce to Script components)

---

#### T-33.5 Input Sanitization + Dependency Audit

User-generated content (proposal text, comments, activity descriptions, playbook entries) is rendered without HTML sanitization. If any content contains `<script>` tags or event handlers, it could execute in other users' browsers — a stored XSS vulnerability. Additionally, no dependency audit has been run since initial setup.

**Acceptance Criteria:**
- [ ] `isomorphic-dompurify` installed (works in both server and client environments)
- [ ] `lib/security/sanitize.ts` — sanitization utility:
  - `sanitizeHtml(input)`: strips all scripts, event handlers, dangerous attributes
  - `sanitizeMarkdown(input)`: sanitize after markdown rendering
  - `sanitizePlainText(input)`: strips all HTML tags entirely
- [ ] Sanitization applied at write boundary (Server Actions) for:
  - Proposal section content
  - Activity log descriptions
  - Comment bodies
  - Playbook entries
  - Team member notes
- [ ] Output encoding verified: all `dangerouslySetInnerHTML` usages audited (find all, verify sanitized input)
- [ ] `npm audit` run, all critical and high vulnerabilities resolved or documented with justification
- [ ] `npm audit --production` shows 0 critical vulnerabilities
- [ ] Dependabot or equivalent automated dependency scanning configured (`.github/dependabot.yml`)
- [ ] npm run build passes

**Depends on:** None (independent of other S33 tickets)
**Files:** lib/security/sanitize.ts, lib/actions/*.ts (modify — add sanitization to write actions), .github/dependabot.yml

---

### SPRINT 34 — Testing Foundation

*Vitest infrastructure. RBAC unit tests. Billing + AI router tests. Component tests. Accessibility audit.*

#### T-34.1 Vitest Setup + Infrastructure

Zero unit tests exist. The only test infrastructure is Playwright for E2E. Unit and component tests are needed for fast feedback on RBAC logic, billing calculations, and UI component behavior — things too slow and fragile to test via browser automation. Vitest is the modern choice for Next.js projects (native ESM, TypeScript, fast HMR).

**Acceptance Criteria:**
- [ ] `vitest`, `@vitejs/plugin-react`, `vite-tsconfig-paths` installed as dev dependencies
- [ ] `vitest.config.ts` at project root:
  - `environment: 'jsdom'` for component tests
  - `include: ['**/*.test.ts', '**/*.test.tsx']`
  - Path aliases matching `tsconfig.json` (`@/` → `./`)
  - Coverage provider: `v8`
  - Coverage thresholds: 0% initially (will increase as tests are added)
- [ ] `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` installed as dev dependencies
- [ ] `tests/setup.ts` — test setup file:
  - Import `@testing-library/jest-dom/vitest` for DOM matchers
  - Mock `next/navigation` (`useRouter`, `usePathname`, `useSearchParams`)
  - Mock `@supabase/ssr` (prevent real DB calls in unit tests)
- [ ] `package.json` scripts: `"test": "vitest"`, `"test:coverage": "vitest --coverage"`, `"test:ui": "vitest --ui"`
- [ ] Smoke test: one trivial test (`lib/utils.test.ts` testing `cn()` helper) passes via `npm test`
- [ ] CI-compatible: `vitest run` exits with code 0 on success, non-zero on failure
- [ ] Coexists with Playwright: Vitest runs unit/component tests, Playwright runs E2E (separate commands, no conflicts)
- [ ] npm run build passes

**Depends on:** None (independent infrastructure setup)
**Files:** vitest.config.ts, tests/setup.ts, lib/utils.test.ts, package.json (modify — add test scripts)

---

#### T-34.2 RBAC Unit Tests (30+ test cases)

RBAC is the security backbone — 12 roles × 14 modules × 4 permission levels. Zero unit tests cover this logic. A single bug in `resolveRole()` or `getModulePermission()` could expose CUI data to unauthorized roles or hide critical modules from authorized users. This is the highest-priority test target.

**Acceptance Criteria:**
- [ ] `lib/rbac/__tests__/config.test.ts` — tests for `resolveRole()`:
  - Returns correct role for each of 12 role slugs
  - Returns default role for unknown slug
  - Handles null/undefined input gracefully
- [ ] `lib/rbac/__tests__/permissions.test.ts` — tests for `getModulePermission()`:
  - Executive role has full access to all 14 modules
  - Author role has read-only access to admin modules
  - Each sensitive role (executive, operations, admin, CEO, COO, FIN) correctly resolves elevated permissions
  - Module visibility: `shouldRender` returns false when role has no access
- [ ] `lib/rbac/__tests__/hooks.test.ts` — tests for `useRole()`, `useModuleAccess()`, `useVisibleNav()`:
  - Hooks return correct values for mocked Supabase user with each role
  - `useVisibleNav()` returns filtered nav items matching role permissions
  - Hooks handle loading/error states
- [ ] `lib/rbac/__tests__/gate.test.ts` — tests for `<RBACGate>` component:
  - Renders children when user has permission
  - Renders nothing when user lacks permission (invisible RBAC pattern)
  - Renders fallback when provided and user lacks permission
- [ ] Minimum 30 test cases across all RBAC test files
- [ ] All tests pass via `npm test`
- [ ] npm run build passes

**Depends on:** T-34.1 (Vitest infrastructure)
**Files:** lib/rbac/__tests__/config.test.ts, lib/rbac/__tests__/permissions.test.ts, lib/rbac/__tests__/hooks.test.ts, lib/rbac/__tests__/gate.test.ts

---

#### T-34.3 Billing + AI Router Unit Tests (25+ test cases)

The billing system (token ledger, token gate, engagement scoring, burn rate projection) and AI router (provider selection, classification-aware routing, circuit breaker) contain complex business logic with financial and security implications. Zero tests cover this logic. A token gate bug could either block paying customers or let free users consume unlimited AI tokens.

**Acceptance Criteria:**
- [ ] `lib/billing/__tests__/token-gate.test.ts` — tests for token enforcement:
  - Allow request when tokens remaining > 0
  - Soft-block at 100% consumed (return limit-reached response)
  - Hard-block at 120% consumed (return disabled response)
  - Grace period: allow requests for proposals with gate activity in last 48hr
  - Correctly debit tokens after response
- [ ] `lib/billing/__tests__/engagement.test.ts` — tests for engagement scoring:
  - Score calculation with all factors at 100% → score = 100
  - Score calculation with all factors at 0% → score = 0
  - Weighted factors sum to 100%
  - Score clamps to 0-100 range
- [ ] `lib/billing/__tests__/burn-rate.test.ts` — tests for burn rate projection:
  - Linear extrapolation: 50% consumed in 15 days → projected exhaustion at day 30
  - Zero consumption → no exhaustion date
  - Over-consumption rate → exhaustion date in past (already exceeded)
- [ ] `lib/ai/__tests__/router.test.ts` — tests for AI routing:
  - CUI-classified requests → always route to AskSage
  - UNCLASSIFIED requests → route to primary provider
  - Primary provider degraded → fallback to secondary
  - Both providers degraded → return error (not silent failure)
- [ ] Minimum 25 test cases across all billing + AI test files
- [ ] All tests pass via `npm test`
- [ ] npm run build passes

**Depends on:** T-34.1 (Vitest infrastructure)
**Files:** lib/billing/__tests__/token-gate.test.ts, lib/billing/__tests__/engagement.test.ts, lib/billing/__tests__/burn-rate.test.ts, lib/ai/__tests__/router.test.ts

---

#### T-34.4 Component Tests — DataTable, FormModal, KanbanView (20+ test cases)

The shared component library (DataTable, FormModal, KanbanView) is used across every module. Zero component tests exist. A regression in DataTable pagination or FormModal validation breaks every module that depends on them. Testing Library provides user-centric testing that verifies behavior, not implementation.

**Acceptance Criteria:**
- [ ] `components/ui/__tests__/DataTable.test.tsx` — tests for DataTable<T>:
  - Renders column headers from config
  - Renders data rows
  - Search filters rows by text content
  - Sort toggles ascending/descending on column click
  - Pagination shows correct page count and navigates between pages
  - Empty state renders when data is empty array
  - Skeleton loading state renders during loading
- [ ] `components/ui/__tests__/FormModal.test.tsx` — tests for FormModal:
  - Renders form fields from Zod schema
  - Validates required fields on submit (shows error messages)
  - Calls onSubmit with valid data
  - Does not call onSubmit with invalid data
  - Close button dismisses modal
  - Reset clears form state
- [ ] `components/features/__tests__/KanbanView.test.tsx` — tests for KanbanView:
  - Renders columns for each pipeline phase
  - Renders opportunity cards in correct columns
  - Empty column renders placeholder
  - Card click triggers navigation callback
- [ ] Minimum 20 test cases across all component test files
- [ ] All tests pass via `npm test`
- [ ] npm run build passes

**Depends on:** T-34.1 (Vitest + Testing Library infrastructure)
**Files:** components/ui/__tests__/DataTable.test.tsx, components/ui/__tests__/FormModal.test.tsx, components/features/__tests__/KanbanView.test.tsx

---

#### T-34.5 Accessibility Audit + WCAG 2.1 AA Fixes

19 `aria-*` attributes across 15 files for a codebase with 50+ interactive components. Federal customers require Section 508 compliance (WCAG 2.1 AA). Missing ARIA labels, roles, and keyboard navigation make MissionPulse unusable for assistive technology users and non-compliant for government procurement.

**Acceptance Criteria:**
- [ ] `@axe-core/playwright` installed as dev dependency (automated accessibility scanning)
- [ ] Accessibility audit script: Playwright test that runs axe-core on every major page:
  - Dashboard, Pipeline, War Room, RFP Shredder, Compliance Matrix, Iron Dome
  - All public pages (pricing, 8a-toolkit)
  - Login, signup, forgot-password
- [ ] Fix all critical and serious axe-core violations:
  - All interactive elements (buttons, links, inputs) have accessible names
  - All form inputs have associated labels (visible or `aria-label`)
  - All images have alt text (or `aria-hidden` if decorative)
  - Color contrast meets 4.5:1 ratio for normal text, 3:1 for large text
  - Focus indicators visible on all interactive elements (not just browser default)
  - Keyboard navigation: Tab order follows visual order, no focus traps
- [ ] ARIA landmarks: `<main>`, `<nav>`, `<aside>` on dashboard layout
- [ ] Skip navigation link: "Skip to main content" as first focusable element
- [ ] Data tables: `<th scope="col">` headers, `aria-sort` on sortable columns (DataTable component)
- [ ] Modal accessibility: focus trap, Escape to close, `aria-modal="true"`, return focus to trigger on close (FormModal, ConfirmModal)
- [ ] Accessibility statement page at `/accessibility` documenting conformance level
- [ ] npm run build passes

**Depends on:** T-34.1 (Vitest for component-level a11y checks)
**Files:** tests/e2e/accessibility.spec.ts, components/ui/DataTable.tsx (modify), components/ui/FormModal.tsx (modify), components/ui/ConfirmModal.tsx (modify), app/(dashboard)/layout.tsx (modify — landmarks, skip nav), app/(public)/accessibility/page.tsx, components/layout/SkipNav.tsx

---

### SPRINT 35 — Performance Optimization

*Bundle analysis + code splitting. Image optimization. Data fetching optimization. Loading states. Lighthouse CI.*

#### T-35.1 Bundle Analysis + Code Splitting (next/dynamic)

Zero `next/dynamic` usage in the entire codebase. Every component loads synchronously on initial page load — including heavy components like KanbanView (drag-and-drop library), PDF parser, chart libraries, and code editors that are only needed on specific pages. This inflates the JavaScript bundle and slows initial load time.

**Acceptance Criteria:**
- [ ] `@next/bundle-analyzer` installed as dev dependency
- [ ] `next.config.mjs` modified: wrap config with `withBundleAnalyzer` when `ANALYZE=true`
- [ ] `package.json` script: `"analyze": "ANALYZE=true next build"`
- [ ] Bundle analysis run, baseline documented in `docs/bundle-analysis.md` (total JS size, top 10 largest chunks)
- [ ] Code split with `next/dynamic` (lazy load) for these heavy components:
  - `KanbanView` — loaded only on pipeline page (includes `@hello-pangea/dnd`)
  - `SwimlaneBoard` — loaded only on War Room page (includes `@hello-pangea/dnd`)
  - `GanttTimeline` — loaded only on proposal timeline page
  - `WorkBreakdownMatrix` — loaded only on breakdown page
  - `ActivityLog` — loaded only when activity tab is active
  - PDF upload/parser components — loaded only on RFP Shredder page
  - Chart components (analytics pages) — loaded only on analytics pages
- [ ] Each dynamically imported component has a loading skeleton (consistent with T-35.4 patterns)
- [ ] Verify: no flash of unstyled content (FOUC) after code splitting
- [ ] Post-split bundle analysis: document reduction in initial JS payload
- [ ] npm run build passes

**Depends on:** None (independent infrastructure)
**Files:** next.config.mjs (modify — add bundle analyzer), package.json (modify — add analyze script), app/(dashboard)/pipeline/page.tsx (modify), app/(dashboard)/war-room/[id]/page.tsx (modify), docs/bundle-analysis.md

---

#### T-35.2 Image Optimization (next/image)

No `next/image` configuration exists. `next.config.mjs` has no `images.remotePatterns`. Any user-uploaded images or external avatar images are served unoptimized — no responsive sizing, no format conversion (WebP/AVIF), no lazy loading beyond browser defaults.

**Acceptance Criteria:**
- [ ] `next.config.mjs` — add `images.remotePatterns` for:
  - Supabase Storage (`${SUPABASE_URL}/storage/v1/object/public/*`)
  - Gravatar (`*.gravatar.com`)
  - Any other external image sources used in the app
- [ ] Audit all `<img>` tags in the codebase — replace with `next/image` `<Image>`:
  - User avatars (Sidebar, presence indicators, team views)
  - Company logos
  - Document thumbnails
  - Marketing page images
- [ ] Each `<Image>` has explicit `width` and `height` (or `fill` with parent container) to prevent CLS
- [ ] `priority` prop set on above-the-fold images (hero images, dashboard KPI icons)
- [ ] `loading="lazy"` (default) for below-the-fold images
- [ ] Format: Next.js auto-serves WebP/AVIF when browser supports it (default behavior, verify not disabled)
- [ ] Placeholder: `blur` placeholder for large images (prevents layout shift during load)
- [ ] npm run build passes

**Depends on:** None (independent optimization)
**Files:** next.config.mjs (modify — add images config), components/layout/Sidebar.tsx (modify), components/layout/PresenceIndicator.tsx (modify), components/features/collaboration/ArtifactStatusGrid.tsx (modify)

---

#### T-35.3 Data Fetching Optimization (Promise.all, N+1 elimination)

Server Components and Server Actions that make sequential database queries when they could be parallel. N+1 query patterns in list views (fetch opportunities, then fetch each opportunity's team separately). These add unnecessary latency that compounds on every page load.

**Acceptance Criteria:**
- [ ] Audit all Server Components and Server Actions for sequential Supabase queries that could be parallel
- [ ] Convert sequential independent queries to `Promise.all()` or `Promise.allSettled()`:
  - Dashboard page: KPI queries (opportunity count, active proposals, team size, compliance %) → parallel
  - Pipeline page: opportunities + filter options → parallel
  - War Room page: proposal + sections + team + activity → parallel
  - Admin pages: multiple aggregate queries → parallel
- [ ] Eliminate N+1 patterns:
  - Pipeline list: use Supabase `.select('*, profiles(*)')` joins instead of per-row profile fetches
  - Compliance matrix: batch requirement lookups instead of per-row
  - Team views: single query with join instead of per-member profile fetch
- [ ] Supabase query helper: `lib/supabase/query-utils.ts` with `parallelQueries()` utility for consistent parallel fetch pattern
- [ ] Measure: document before/after latency for top 5 pages in `docs/performance-baseline.md`
- [ ] npm run build passes

**Depends on:** None (independent optimization)
**Files:** lib/supabase/query-utils.ts, app/(dashboard)/page.tsx (modify), app/(dashboard)/pipeline/page.tsx (modify), app/(dashboard)/war-room/[id]/page.tsx (modify), docs/performance-baseline.md (modify)

---

#### T-35.4 Loading State + Skeleton Audit

Inconsistent loading states across the application. Some pages show nothing during load, some show a spinner, some show skeleton loaders. Users see blank screens or layout shifts as data loads. Every data-dependent view should show a consistent skeleton loader that matches the final layout.

**Acceptance Criteria:**
- [ ] Audit all pages with data fetching — categorize current loading behavior:
  - No loading state (blank screen)
  - Spinner only (no layout hint)
  - Skeleton loader (layout-preserving)
- [ ] Create `loading.tsx` files for all dashboard routes that lack them:
  - `app/(dashboard)/loading.tsx` — dashboard skeleton
  - `app/(dashboard)/pipeline/loading.tsx` — pipeline table/kanban skeleton
  - `app/(dashboard)/war-room/[id]/loading.tsx` — war room skeleton
  - `app/(dashboard)/analytics/loading.tsx` — analytics charts skeleton
  - `app/(dashboard)/admin/loading.tsx` — admin page skeleton
- [ ] Each skeleton matches the layout of the loaded page (same widths, heights, spacing)
- [ ] Skeleton components use `animate-pulse` from Tailwind (consistent with shadcn patterns)
- [ ] `Suspense` boundaries around dynamic-imported components (from T-35.1) with skeleton fallbacks
- [ ] No Cumulative Layout Shift (CLS): skeleton dimensions match loaded content dimensions
- [ ] npm run build passes

**Depends on:** T-35.1 (code splitting introduces Suspense boundaries)
**Files:** app/(dashboard)/loading.tsx, app/(dashboard)/pipeline/loading.tsx, app/(dashboard)/war-room/[id]/loading.tsx, app/(dashboard)/analytics/loading.tsx, app/(dashboard)/admin/loading.tsx

---

#### T-35.5 Lighthouse CI + Performance Budget

No automated performance regression detection. Lighthouse scores are manually checked (if at all). After optimizations in T-35.1–T-35.4, lock in the gains by enforcing performance budgets in CI. Any PR that regresses Lighthouse scores below the budget threshold fails the build.

**Acceptance Criteria:**
- [ ] `@lhci/cli` installed as dev dependency
- [ ] `.lighthouserc.js` configuration:
  - URLs to test: `/login`, `/dashboard`, `/dashboard/pipeline`, `/dashboard/war-room` (with auth cookie injection)
  - Assertions:
    - Performance score ≥ 80
    - Accessibility score ≥ 90
    - Best Practices score ≥ 90
    - SEO score ≥ 90
  - Budget:
    - Total JS ≤ 500KB (compressed)
    - Total CSS ≤ 100KB (compressed)
    - LCP ≤ 2.5s
    - CLS ≤ 0.1
    - FID/INP ≤ 200ms
- [ ] `package.json` script: `"lighthouse": "lhci autorun"`
- [ ] Lighthouse runs against local `next start` build (not dev server)
- [ ] CI integration: Lighthouse runs on every PR, results posted as PR comment
- [ ] Baseline scores documented in `docs/performance-baseline.md` after first run
- [ ] npm run build passes

**Depends on:** T-35.1 (code splitting), T-35.2 (image optimization), T-35.3 (data fetching), T-35.4 (loading states)
**Files:** .lighthouserc.js, package.json (modify — add lighthouse script), docs/performance-baseline.md (modify)

---

## 3. New Dependencies

All dependencies are justified by specific production gaps.

| Package | Sprint | Purpose | Dev Only? |
|---------|--------|---------|-----------|
| `@sentry/nextjs` | S32 | Error monitoring, performance tracing, CSP reporting | No |
| `web-vitals` | S32 | Core Web Vitals runtime measurement | No |
| `@upstash/ratelimit` | S33 | Distributed Redis-backed rate limiting | No |
| `isomorphic-dompurify` | S33 | HTML sanitization (XSS prevention) | No |
| `vitest` | S34 | Unit + component test runner | Yes |
| `@vitejs/plugin-react` | S34 | React JSX transform for Vitest | Yes |
| `vite-tsconfig-paths` | S34 | Path alias resolution in Vitest | Yes |
| `@testing-library/react` | S34 | Component test utilities | Yes |
| `@testing-library/jest-dom` | S34 | DOM assertion matchers | Yes |
| `@testing-library/user-event` | S34 | User interaction simulation | Yes |
| `@axe-core/playwright` | S34 | Automated accessibility scanning | Yes |
| `@next/bundle-analyzer` | S35 | Bundle size analysis + visualization | Yes |
| `@lhci/cli` | S35 | Lighthouse CI for performance budgets | Yes |

Total: 13 new dependencies (5 production, 8 dev-only).

---

## 4. Dependency Chain

| Ticket | Blocks | Risk |
|--------|--------|------|
| T-32.1 (Sentry) | T-32.2 (logging breadcrumbs), T-32.3 (Web Vitals reporting), T-33.4 (CSP violation reporting) | Foundation for all observability. Build first. |
| T-32.2 (Structured Logging) | T-32.4 (health check logging) | Health checks need structured log output. |
| T-33.1 (Redis Rate Limiter) | T-33.2 (all routes), T-33.3 (brute force) | Core library used by all rate limiting and brute force protection. |
| T-33.2 (Rate Limit All Routes) | None downstream | Can ship independently after T-33.1. |
| T-34.1 (Vitest Setup) | T-34.2 (RBAC tests), T-34.3 (billing tests), T-34.4 (component tests), T-34.5 (a11y component checks) | All unit tests depend on test infrastructure. Build first in S34. |
| T-35.1 (Code Splitting) | T-35.4 (loading states — Suspense fallbacks), T-35.5 (Lighthouse baseline) | Code splitting changes bundle sizes that Lighthouse measures. |
| T-35.1–T-35.4 (All optimizations) | T-35.5 (Lighthouse CI) | Performance budget must be set AFTER all optimizations are applied. |
| T-19.1 (Redis — from v1.1) | T-33.1 (rate limiter uses existing Redis) | Redis must already be configured. Already shipped in S19. |

---

## 5. Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Sentry SDK increases bundle size | Larger JS payload, slower load | Medium | Sentry tree-shakes aggressively. Verify with bundle analyzer (T-35.1). Sentry lazy-loads replay/tracing. Target <50KB added. |
| CSP nonce strategy breaks inline scripts | Pages fail to render in production | High | Test every page with CSP reporting mode first (report-only). Gradually enforce. Keep `'unsafe-inline'` as fallback during rollout. |
| Rate limiting too aggressive for legitimate users | Customers locked out during heavy proposal work | Medium | Start with generous limits (30/min standard). Monitor 429 rates in Sentry. Adjust thresholds based on real usage data. Admin override for whitelisted IPs. |
| Vitest + Next.js App Router compatibility | Server Components difficult to test in jsdom | Medium | Test logic (functions, hooks) rather than Server Components directly. Use Playwright for Server Component integration tests. Mock `next/navigation` and Supabase in test setup. |
| Code splitting increases perceived latency | Loading spinners appear where content was instant | Low | Skeleton loaders match final layout (T-35.4). Prefetch commonly navigated routes. Only split genuinely heavy components (>50KB). |
| `isomorphic-dompurify` sanitization strips legitimate content | Proposal content containing HTML formatting loses formatting | Medium | Configure DOMPurify with allowed tags list (p, strong, em, ul, ol, li, h1-h6, table). Test with real proposal content samples. Provide "preview sanitized" step before save. |
| Lighthouse CI flaky in CI environment | False failures block PRs | Medium | Use 3-run median (not single run). Allow 5% score variance. Skip Lighthouse on draft PRs. Run against `next start` (not dev server). |
| Accessibility fixes alter visual design | UI changes surprise stakeholders | Low | Changes are additive (ARIA attributes, focus styles, skip nav). Visual changes limited to focus indicators and contrast adjustments. Before/after screenshots for review. |

---

## 6. Sprint Summary

| Sprint | Theme | Tickets | New Files | Modified Files | New Dependencies |
|--------|-------|---------|-----------|----------------|-----------------|
| S32 | Observability | 4 (T-32.1–T-32.4) | 12 | 8 | 2 (@sentry/nextjs, web-vitals) |
| S33 | Security | 5 (T-33.1–T-33.5) | 5 | 9 | 2 (@upstash/ratelimit, isomorphic-dompurify) |
| S34 | Testing | 5 (T-34.1–T-34.5) | 12 | 7 | 7 (vitest, @vitejs/plugin-react, vite-tsconfig-paths, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, @axe-core/playwright) |
| S35 | Performance | 5 (T-35.1–T-35.5) | 9 | 12 | 2 (@next/bundle-analyzer, @lhci/cli) |
| **Total** | | **19** | **38** | **36** | **13** |

---

## 7. What Phase K Is NOT

To prevent scope creep, these capabilities are explicitly **out of scope** for v1.4:

| Capability | Why Not v1.4 | When |
|------------|-------------|------|
| Full SIEM integration (Splunk, Elastic) | Sentry + structured logging is sufficient for initial production. SIEM is enterprise-scale. | v2.0 |
| WAF (Web Application Firewall) | Vercel/Cloudflare edge WAF is a deployment concern, not application code. | Infrastructure sprint |
| 100% test coverage | Diminishing returns. 75+ tests on critical paths (RBAC, billing, AI routing) provides the safety net. Comprehensive coverage is ongoing. | Continuous |
| SSR → SSG conversion | Server Components are correct for dynamic data. Static generation only applies to marketing pages (already static). | Not needed |
| Database query profiling / pgBouncer tuning | Already addressed in T-19.2 (v1.1). Phase K focuses on frontend and API layer. | Already done |
| Mobile app performance | Phase K optimizes web. React Native / mobile is a separate product. | v2.0 |
| Penetration testing execution | Phase K prepares the security posture. Actual pen testing requires a third-party firm. | Post-v1.4 engagement |
| CMMC Level 2 certification | Phase K closes specific gaps (CSP, input sanitization, audit logging). Certification is an organizational process, not a code sprint. | Organizational milestone |

---

**PROPRIETARY — Mission Meets Tech, LLC — February 2026**
