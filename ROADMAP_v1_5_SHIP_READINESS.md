# MissionPulse v1.5 Roadmap — Ship-Readiness

**From Production-Hardened to Ship-Ready**
4 Sprints • 17 Tickets • Phase L

Supersedes nothing — extends ROADMAP_v1_4_PRODUCTION_HARDENING.md (S32–S35)
Sprint numbering continues from S35. Ticket numbering continues from T-35.5.
Depends on: All prior sprints complete. Build: 0 errors, 0 type errors. `/verify` returns CLEAR.

**PROPRIETARY — Mission Meets Tech, LLC — February 2026**

---

## 1. Strategic Overview

### 1.1 Where We Are

v1.4 is complete. Observability (Sentry, structured logging, Web Vitals, expanded health checks), security hardening (Redis rate limiting, brute force protection, CSP nonces, input sanitization), testing foundation (Vitest + 140 unit tests + 24 E2E specs), performance optimization (code splitting, image optimization, data fetching, Lighthouse CI), and accessibility (WCAG 2.1 AA) are all shipped. 35 sprints delivered. Build passes with 0 errors, 0 type errors. `/verify` returns CLEAR. Both `v2-development` and `main` branches are synced.

HEAD: cd1e67b on main. Build: CLEAR.

A ship-readiness review before onboarding the first paid pilot customers revealed remaining gaps:

| Gap | Current State | Risk |
|-----|--------------|------|
| CI/CD pipeline | No GitHub Actions CI. Build, lint, and test are manual. PRs merge without automated checks. | Regressions ship undetected. No gating on lint or test failures. |
| Lint warnings | 48 ESLint warnings (unused params, `let`→`const`, exhaustive-deps). Not zero-warning enforced. | Warnings accumulate. CI can't enforce `--max-warnings 0` until existing warnings are fixed. |
| Sentry deprecation | `sentry.client.config.ts` uses deprecated config pattern. Turbopack requires `instrumentation-client.ts`. | Build warning today, build failure after Next.js upgrade. Blocks Turbopack adoption. |
| Route boundaries | 9 deeply nested routes missing own `loading.tsx` and `error.tsx`. Fall through to parent boundaries. | Users see parent-level loading/error states instead of contextual ones. Poor UX on slow connections. |
| Server action tests | Zero tests for CRUD server actions (opportunities, audit, dashboard). | Regressions in core write paths ship undetected. Audit trail integrity unverified. |
| Security module tests | Zero tests for rate-limiter, brute-force, sanitize modules. | Security logic assumed correct but never verified. Fail-open behavior untested. |
| API route tests | Zero tests for health, metrics, newsletter, stripe webhook, section-versions. | External-facing endpoints untested. Webhook signature validation unverified. |
| Middleware tests | Zero tests for auth redirect, CSP nonce, rate limiting, correlation ID. 216-line middleware untested. | Most complex single file in codebase has zero coverage. Silent breakage risk. |
| AI module tests | Zero tests for AI router, model-selector, pipeline, intent-classifier. | CUI routing logic untested. Provider fallback unverified. Token gating assumed correct. |
| Test coverage reporting | No lcov, no badge, no thresholds, no Codecov. Coverage is 0% reported. | No visibility into what's tested. No CI enforcement of coverage floors. |
| Developer documentation | Zero architecture docs, zero contributing guide, zero deployment guide, zero changelog. | New developers can't onboard. Deployment is tribal knowledge. No release history. |
| Console statements in AI modules | 7 `console.log`/`console.error` in AI modules bypassing structured logger. | Production logs are noisy and unstructured for AI module debugging. |

These gaps are blockers for confident, repeatable shipping to paying customers.

### 1.2 Where We're Going

Ship-ready MissionPulse v1.5 that satisfies:
- **CI/CD:** Every PR gated by build + lint (zero warnings) + test + Lighthouse. Dependabot for dependency freshness.
- **Testing:** 250+ unit tests, 34+ E2E specs, 60% line coverage enforced in CI. All critical modules covered.
- **Documentation:** Architecture, contributing, deployment, and changelog docs for developer onboarding.
- **Polish:** Zero lint warnings, zero deprecated APIs, zero ungated console statements, complete route boundaries.

### 1.3 Phase Map

| Phase | Sprints | What Ships |
|-------|---------|------------|
| L: Ship-Readiness (v1.5) | S36–S39 | GitHub Actions CI, lint zero-warning, Sentry migration, route boundaries, 110+ new unit tests, coverage reporting + thresholds, E2E expansion, ARCHITECTURE.md, CONTRIBUTING.md, DEPLOYMENT.md, CHANGELOG.md, final audit |

### 1.4 Sprint Cadence

| Parameter | Value |
|-----------|-------|
| Sprint Length | Maximize delivery per sprint. No fixed time constraint. |
| Tickets per Sprint | 4–5 (packed for throughput) |
| Validation | npm run build must pass for every ticket |
| Branch | All work on v2-development. Merge to main per release. |
| Deploy | Staging auto-deploys on push. Production = manual merge. |
| v1.5 Target | Q2 2026 |

### 1.5 Execution Rules

Same as v1.1/v1.2/v1.3/v1.4. Additionally:
- Zero new npm dependencies — all required tooling is already installed from v1.4
- Test files follow the pattern `__tests__/[module].test.ts` or co-located `[component].test.tsx`
- All new tests use the same strict TypeScript config as production code — no `as any`
- Lint must reach zero warnings before CI pipeline is enforced
- Documentation must be accurate to current codebase — no aspirational content
- AI module console statements must migrate to structured logger (`lib/logging/logger.ts`)

---

## 2. PHASE L: Ship-Readiness (v1.5)

Goal: Close every gap between "production-hardened" and "confidently shippable." Automated CI gating on every PR. Full test coverage of critical modules. Zero lint warnings. Complete developer documentation. When Phase L is done, any engineer can clone, build, test, deploy, and contribute — and every PR is automatically validated before merge.

---

### SPRINT 36 — CI/CD Pipeline + Lint Cleanup

*GitHub Actions CI with parallel jobs. Lint zero-warning enforcement. Sentry config migration. Route boundary completion.*

#### T-36.1 GitHub Actions CI Pipeline

No CI pipeline exists. Build, lint, and test are manual processes. PRs merge to main without automated checks — a developer can push a broken build, failing tests, or lint violations and nothing stops it. GitHub Actions provides free CI for public repos and generous minutes for private repos, with native PR integration.

**Acceptance Criteria:**
- [ ] `.github/workflows/ci.yml` — GitHub Actions workflow triggered on push to `main` and `v2-development`, and on all PRs
- [ ] Parallel job matrix:
  - `build` — `npm ci && npm run build` (verifies compilation, type checking, no build errors)
  - `lint` — `npm run lint -- --max-warnings 0` (zero-warning enforcement)
  - `test` — `npm test -- --run` (Vitest unit tests, exit on failure)
  - `lighthouse` — `npm run lighthouse` (Lighthouse CI budget enforcement, runs against `next start`)
- [ ] Each job runs in its own container with Node 20 LTS
- [ ] `npm ci` with dependency caching (`actions/cache` on `~/.npm`) for fast installs
- [ ] Job-level `timeout-minutes: 10` to prevent hung builds
- [ ] PR status checks: all 4 jobs must pass before merge is allowed
- [ ] `.github/dependabot.yml` — Dependabot configuration:
  - `npm` ecosystem, weekly schedule
  - Auto-merge patch updates for dev dependencies via `dependabot-auto-merge` label
  - Group minor updates into single PR per week
- [ ] Build status badge in README (optional, if README exists)
- [ ] npm run build passes

**Depends on:** T-36.2 (lint warnings must be zero before `--max-warnings 0` enforcement)
**Files:** .github/workflows/ci.yml, .github/dependabot.yml

---

#### T-36.2 Lint Warning Cleanup

48 ESLint warnings exist across the codebase. These are not errors — the build passes — but they indicate code quality issues: unused variables, `let` where `const` suffices, missing dependencies in `useEffect` hooks. Until these are fixed, CI cannot enforce `--max-warnings 0`. Every new warning added by a developer would be invisible noise in a sea of 48 existing warnings.

**Acceptance Criteria:**
- [ ] Run `npm run lint` — document all 48 warnings by category:
  - Unused variables/params → prefix with `_` (e.g., `_unused`)
  - `let` declarations never reassigned → change to `const`
  - `react-hooks/exhaustive-deps` → add missing deps or document suppression with `// eslint-disable-next-line` and justification comment
  - Any other warning categories → fix per ESLint rule docs
- [ ] All 48 warnings resolved — `npm run lint` reports 0 warnings
- [ ] No new `eslint-disable` comments without justification
- [ ] No functional changes — only lint fixes (variable renames, const/let, dependency arrays)
- [ ] Verify no runtime behavior changes by running existing test suite
- [ ] npm run build passes

**Depends on:** None (first ticket to unblock CI)
**Files:** Multiple files across codebase (lint-only changes, no functional modifications)

---

#### T-36.3 Sentry Instrumentation Migration

`sentry.client.config.ts` uses the deprecated Sentry configuration pattern. Next.js is moving to `instrumentation-client.ts` as the standard client instrumentation hook, and Turbopack (the next-generation bundler replacing Webpack in Next.js) requires this new pattern. The current file works but generates a deprecation warning and will break when the team upgrades to Turbopack.

**Acceptance Criteria:**
- [ ] Create `instrumentation-client.ts` at project root with the contents of `sentry.client.config.ts`
- [ ] Adapt initialization to use the `instrumentation-client.ts` pattern per Sentry Next.js v8+ docs
- [ ] Verify `instrumentation.ts` (server) remains unchanged (already uses correct pattern)
- [ ] Delete `sentry.client.config.ts` after migration
- [ ] Update `next.config.mjs` if Sentry webpack plugin references the old file
- [ ] Verify Sentry error capture still works: trigger intentional client-side error → confirm it appears in Sentry
- [ ] Verify no deprecation warnings in build output related to Sentry config
- [ ] npm run build passes

**Depends on:** None (independent migration)
**Files:** instrumentation-client.ts (new), sentry.client.config.ts (delete), next.config.mjs (modify if needed)

---

#### T-36.4 Route Boundary Completion

9 deeply nested routes are missing their own `loading.tsx` and `error.tsx` boundary files. These routes fall through to parent-level boundaries, which show generic loading/error states that don't match the page context. Users on slow connections see a dashboard-level skeleton when they should see a page-specific skeleton. Error recovery is coarse-grained — a single component error resets the entire parent layout.

**Acceptance Criteria:**
- [ ] Audit all routes under `app/(dashboard)/` — identify routes missing `loading.tsx` or `error.tsx`
- [ ] Create 5 new `loading.tsx` files for deeply nested routes missing own loading boundaries:
  - Each skeleton matches the layout of the loaded page (same widths, heights, spacing)
  - Skeleton components use `animate-pulse` from Tailwind (consistent with existing patterns)
  - No Cumulative Layout Shift between skeleton and loaded content
- [ ] Create 5 new `error.tsx` files for deeply nested routes missing own error boundaries:
  - Each error boundary is a `'use client'` component (Next.js requirement)
  - Displays contextual error message (not generic "Something went wrong")
  - Includes "Try again" button that calls `reset()` to retry the route segment
  - Logs error to Sentry via `Sentry.captureException(error)` in `useEffect`
  - Does NOT expose error details in production (only in development)
- [ ] Verify: navigate to each route with simulated slow connection → see page-specific skeleton
- [ ] Verify: navigate to each route with simulated error → see page-specific error boundary
- [ ] npm run build passes

**Depends on:** None (independent route work)
**Files:** 5 new loading.tsx files, 5 new error.tsx files across deeply nested dashboard routes

---

### SPRINT 37 — Test Coverage Expansion I

*Server action tests. Security module tests. API route tests. Middleware tests. 60+ new test cases.*

#### T-37.1 Server Action Tests (20+ test cases)

Server actions are the primary write path for all CRUD operations — creating opportunities, updating proposals, logging audit events, managing team members. Zero tests cover these actions. A regression in `createOpportunity` or `logAuditEvent` silently breaks the core workflow and compromises audit trail integrity.

**Acceptance Criteria:**
- [ ] `lib/actions/__tests__/opportunities.test.ts` — tests for opportunity CRUD:
  - `createOpportunity`: valid input → returns success with new ID
  - `createOpportunity`: missing required fields → returns validation error
  - `createOpportunity`: unauthorized role → returns permission error
  - `updateOpportunity`: valid update → returns success, audit log written
  - `deleteOpportunity`: valid delete → soft-deletes, audit log written
  - Input sanitization: XSS payload in title → sanitized before insert
- [ ] `lib/actions/__tests__/audit.test.ts` — tests for audit logging:
  - `logAuditEvent`: writes to both `audit_logs` and `activity_log`
  - `logAuditEvent`: includes user ID, action, entity type, entity ID, timestamp
  - Audit log immutability: verify no UPDATE or DELETE operations exist in audit actions
- [ ] `lib/actions/__tests__/dashboard.test.ts` — tests for dashboard data:
  - KPI queries return expected shape (count, active, team size, compliance %)
  - Empty database returns zero-state (not errors)
  - Parallel fetch (Promise.all) does not fail if one query errors (Promise.allSettled behavior)
- [ ] Mock Supabase client using Vitest mocks — no real database calls
- [ ] Minimum 20 test cases across all server action test files
- [ ] All tests pass via `npm test`
- [ ] npm run build passes

**Depends on:** T-34.1 (Vitest infrastructure — already shipped in v1.4)
**Files:** lib/actions/__tests__/opportunities.test.ts, lib/actions/__tests__/audit.test.ts, lib/actions/__tests__/dashboard.test.ts

---

#### T-37.2 Security Module Tests (15+ test cases)

The security modules (rate limiter, brute force protection, input sanitization) are the most critical code in the application — they protect CUI data and prevent abuse. Zero tests cover this logic. A bug in `rateLimiter.check()` that always returns "allowed" would silently disable all rate limiting. A bug in `sanitize()` that passes through `<script>` tags would create stored XSS.

**Acceptance Criteria:**
- [ ] `lib/security/__tests__/rate-limiter.test.ts` — tests for Redis rate limiter:
  - Request within limit → allowed
  - Request exceeding limit → blocked with 429
  - Rate limit headers present on response (X-RateLimit-Limit, Remaining, Reset)
  - Sliding window: requests spread across window boundary → correctly counted
  - Redis unavailable → fail open (allow request, log warning)
  - Different tiers (strict/standard/relaxed) enforce different limits
- [ ] `lib/security/__tests__/brute-force.test.ts` — tests for brute force protection:
  - Under threshold → login allowed
  - 5 failed attempts from same IP → IP blocked
  - 10 failed attempts to same email → account locked
  - Progressive delay: 4th attempt → 2s delay, 5th → 5s delay
  - Successful login → resets IP counter
  - Account counter decays by TTL (not reset by success)
- [ ] `lib/security/__tests__/sanitize.test.ts` — tests for input sanitization:
  - Plain text → passes through unchanged
  - `<script>alert('xss')</script>` → stripped
  - Event handlers (`onload`, `onerror`) → stripped
  - Allowed HTML tags (p, strong, em, ul, ol, li) → preserved
  - Nested XSS (`<img src=x onerror=alert(1)>`) → stripped
- [ ] Mock Redis client using Vitest mocks — no real Redis calls
- [ ] Minimum 15 test cases across all security test files
- [ ] All tests pass via `npm test`
- [ ] npm run build passes

**Depends on:** T-34.1 (Vitest infrastructure — already shipped in v1.4)
**Files:** lib/security/__tests__/rate-limiter.test.ts, lib/security/__tests__/brute-force.test.ts, lib/security/__tests__/sanitize.test.ts

---

#### T-37.3 API Route Tests (15+ test cases)

13 API routes handle external traffic — health checks from uptime monitors, Stripe webhook events, integration callbacks, metrics endpoints. Zero tests cover these routes. A broken health endpoint returns false positives. A broken Stripe webhook silently drops payment events. These are the system boundaries where bugs have the highest blast radius.

**Acceptance Criteria:**
- [ ] `app/api/__tests__/health.test.ts` — tests for health endpoint:
  - All subsystems healthy → 200 with `status: 'healthy'`
  - Critical subsystem down → 503 with `status: 'unhealthy'`
  - Non-critical subsystem down → 200 with `status: 'degraded'`
  - Detailed endpoint requires admin RBAC
  - Rate limited correctly (relaxed tier)
- [ ] `app/api/__tests__/metrics.test.ts` — tests for metrics endpoint:
  - Returns expected metric shape
  - Unauthorized request → 401
- [ ] `app/api/__tests__/newsletter.test.ts` — tests for newsletter signup:
  - Valid email → 200 success
  - Invalid email → 400 validation error
  - Rate limited (strict tier)
- [ ] `app/api/__tests__/webhooks-stripe.test.ts` — tests for Stripe webhook:
  - Valid signature + event → processes correctly
  - Invalid signature → 401 rejection
  - Unknown event type → 200 acknowledgment (no processing)
  - Malformed body → 400 error
- [ ] `app/api/__tests__/section-versions.test.ts` — tests for section versioning:
  - GET returns version history
  - POST creates new version
  - Unauthorized → 401
- [ ] Mock external services (Stripe, Supabase) using Vitest mocks
- [ ] Minimum 15 test cases across all API route test files
- [ ] All tests pass via `npm test`
- [ ] npm run build passes

**Depends on:** T-34.1 (Vitest infrastructure — already shipped in v1.4)
**Files:** app/api/__tests__/health.test.ts, app/api/__tests__/metrics.test.ts, app/api/__tests__/newsletter.test.ts, app/api/__tests__/webhooks-stripe.test.ts, app/api/__tests__/section-versions.test.ts

---

#### T-37.4 Middleware Tests (10+ test cases)

`middleware.ts` is 216 lines of logic that runs on every single request — auth redirects, CSP nonce generation, rate limiting, correlation ID injection, brute force checks. It is the most complex single file in the codebase and has zero test coverage. A bug in middleware silently affects every page and every API route.

**Acceptance Criteria:**
- [ ] `__tests__/middleware.test.ts` — tests for middleware:
  - Unauthenticated request to protected route → redirect to `/login`
  - Authenticated request to protected route → passes through
  - Unauthenticated request to public route → passes through
  - CSP nonce: response headers contain `Content-Security-Policy` with nonce
  - CSP nonce: each request gets a unique nonce
  - Rate limiting: request within limit → passes through
  - Rate limiting: request exceeding limit → 429 response
  - Correlation ID: response headers contain `X-Correlation-ID`
  - Correlation ID: each request gets a unique ID
  - Brute force: login attempt under threshold → passes through
  - Brute force: login attempt over threshold → blocked
- [ ] Mock `NextRequest` and `NextResponse` using Vitest
- [ ] Mock Redis, Supabase auth — no real external calls
- [ ] Minimum 10 test cases
- [ ] All tests pass via `npm test`
- [ ] npm run build passes

**Depends on:** T-34.1 (Vitest infrastructure — already shipped in v1.4)
**Files:** __tests__/middleware.test.ts

---

### SPRINT 38 — Test Coverage II + Reporting

*AI module tests. Integration/sync tests. Coverage reporting with thresholds. E2E expansion.*

#### T-38.1 AI Module Tests (15+ test cases)

The AI pipeline handles CUI-classified data routing, multi-provider fallback, token gating, and intent classification. These modules make security-critical decisions (CUI → AskSage only) and financial decisions (token consumption, billing). Zero tests verify this logic. A routing bug could send CUI data to an unauthorized provider.

**Acceptance Criteria:**
- [ ] `lib/ai/__tests__/router.test.ts` (expand from T-34.3 if exists, or create):
  - CUI-classified request → routed to AskSage (never to OpenAI/Anthropic)
  - UNCLASSIFIED request → routed to primary provider
  - Primary provider circuit-breaker open → fallback to secondary
  - Both providers unavailable → error response (not silent failure)
  - Provider selection respects model capability requirements
- [ ] `lib/ai/__tests__/model-selector.test.ts` — tests for model selection:
  - Task type maps to correct model tier
  - Cost optimization: simple tasks → cheaper model
  - Quality requirements: complex tasks → capable model
  - Unknown task type → default model
- [ ] `lib/ai/__tests__/pipeline.test.ts` — tests for AI pipeline:
  - Request flows through: classify → route → execute → debit tokens
  - Token gate: sufficient tokens → proceed
  - Token gate: insufficient tokens → block with limit-reached response
  - Pipeline handles provider timeout gracefully
- [ ] `lib/ai/__tests__/intent-classifier.test.ts` — tests for intent classification:
  - Proposal drafting intent → correct classification
  - Compliance checking intent → correct classification
  - Ambiguous input → default classification
  - CUI content markers → CUI classification flag set
- [ ] Mock all external AI providers — no real API calls
- [ ] Minimum 15 test cases across all AI test files
- [ ] All tests pass via `npm test`
- [ ] npm run build passes

**Depends on:** T-34.1 (Vitest infrastructure — already shipped in v1.4)
**Files:** lib/ai/__tests__/router.test.ts, lib/ai/__tests__/model-selector.test.ts, lib/ai/__tests__/pipeline.test.ts, lib/ai/__tests__/intent-classifier.test.ts

---

#### T-38.2 Integration & Sync Tests (10+ test cases)

Real-time presence, section locking, and integration sync modules handle concurrent multi-user scenarios — the hardest category of bugs to reproduce and the most damaging when they occur. A broken section lock allows two users to overwrite each other's CUI proposal content. A broken presence indicator shows stale user status.

**Acceptance Criteria:**
- [ ] `lib/collaboration/__tests__/presence.test.ts` — tests for presence:
  - User joins → presence broadcast sent
  - User leaves → presence removal sent
  - Heartbeat timeout → user marked as away
  - Multiple users in same room → all visible
- [ ] `lib/collaboration/__tests__/section-lock.test.ts` — tests for section locking:
  - Lock request on unlocked section → lock granted
  - Lock request on locked section (different user) → lock denied
  - Lock timeout → auto-release
  - Lock owner leaves → auto-release
- [ ] Enable any existing sync tests in Vitest configuration that were previously skipped or disabled
- [ ] Mock Supabase Realtime channels — no real WebSocket connections
- [ ] Minimum 10 test cases across all integration/sync test files
- [ ] All tests pass via `npm test`
- [ ] npm run build passes

**Depends on:** T-34.1 (Vitest infrastructure — already shipped in v1.4)
**Files:** lib/collaboration/__tests__/presence.test.ts, lib/collaboration/__tests__/section-lock.test.ts

---

#### T-38.3 Coverage Reporting + Thresholds

Test coverage is invisible. No lcov report, no CI badge, no Codecov integration, no enforced thresholds. Developers add tests but can't see which lines are covered. After S37 and S38.1-38.2 add 110+ new tests, coverage should reach 60%+ on critical modules — lock that in with CI enforcement so it never regresses.

**Acceptance Criteria:**
- [ ] `vitest.config.ts` — add coverage configuration:
  - Reporter: `['text', 'lcov', 'json-summary']`
  - Output directory: `coverage/`
  - Thresholds: 60% lines, 60% functions, 50% branches (enforceable minimums)
  - Threshold enforcement: fail `npm test -- --coverage` if below thresholds
- [ ] `coverage/` added to `.gitignore` (reports are CI artifacts, not committed)
- [ ] CI workflow (`.github/workflows/ci.yml`) updated:
  - Test job runs with `--coverage` flag
  - Coverage summary printed in CI log
  - Codecov upload step (if `CODECOV_TOKEN` secret is configured)
- [ ] Coverage badge in README (optional, if README exists)
- [ ] `package.json` script: `"test:coverage": "vitest run --coverage"` (verify already exists from T-34.1, update if needed)
- [ ] Run coverage report — document baseline percentages per module
- [ ] npm run build passes

**Depends on:** T-37.1, T-37.2, T-37.3, T-37.4, T-38.1, T-38.2 (tests must exist before thresholds are meaningful)
**Files:** vitest.config.ts (modify), .github/workflows/ci.yml (modify), .gitignore (modify if needed)

---

#### T-38.4 E2E Expansion (10+ specs)

24 Playwright E2E specs exist from v1.4. They cover basic page navigation and auth flows. Missing: multi-role RBAC enforcement (verify that restricted pages actually block unauthorized roles), API route responses, error boundary behavior, and session edge cases (expired token, concurrent sessions).

**Acceptance Criteria:**
- [ ] `tests/e2e/rbac-enforcement.spec.ts` — multi-role RBAC tests:
  - Author role accessing admin page → redirected (not just hidden nav)
  - Executive role accessing all modules → all render successfully
  - Unauthenticated user accessing dashboard → redirected to login
  - Role change mid-session → permissions update on next navigation
- [ ] `tests/e2e/api-routes.spec.ts` — API route E2E tests:
  - `/api/health` returns 200 with expected shape
  - `/api/metrics` requires authentication
  - `/api/newsletter` validates email format
- [ ] `tests/e2e/error-boundaries.spec.ts` — error boundary tests:
  - Simulated server error → error boundary renders (not white screen)
  - Error boundary "Try again" button → retries route segment
  - Global error boundary catches unhandled errors
- [ ] `tests/e2e/session-edge-cases.spec.ts` — session tests:
  - Expired token → redirect to login with return URL
  - Login after expiry → return to original page
  - Multiple tabs → session consistent across tabs
- [ ] Minimum 10 new E2E specs (total: 34+ specs)
- [ ] All E2E tests pass via `npx playwright test`
- [ ] npm run build passes

**Depends on:** T-36.4 (route boundaries must exist for error boundary tests)
**Files:** tests/e2e/rbac-enforcement.spec.ts, tests/e2e/api-routes.spec.ts, tests/e2e/error-boundaries.spec.ts, tests/e2e/session-edge-cases.spec.ts

---

### SPRINT 39 — Developer Docs + Ship Polish

*Architecture documentation. Contributing guide. Deployment guide. Changelog. Final audit.*

#### T-39.1 ARCHITECTURE.md

No architecture documentation exists. The codebase has 200+ tables, 16 modules, 8 AI agents, multi-model gateway, real-time collaboration, RBAC with 12 roles × 14 modules, and integrations with 10+ external services. A new developer cannot understand the system without reading hundreds of files. An architecture document provides the map.

**Acceptance Criteria:**
- [ ] `ARCHITECTURE.md` at project root covering:
  - **System Overview:** High-level architecture diagram (ASCII or Mermaid) showing Next.js frontend, Supabase backend, Redis cache, AI gateway, external integrations
  - **Data Flow:** Request lifecycle from browser → middleware → Server Component → Supabase → response
  - **RBAC Model:** 12 roles, 14 modules, permission resolution flow, invisible RBAC pattern
  - **AI Pipeline:** Intent classification → CUI routing → provider selection → token gating → execution → audit
  - **Module Map:** All 16 modules with brief descriptions, key files, and dependencies between modules
  - **Real-time Architecture:** Supabase Realtime channels, presence, section locking, optimistic updates
  - **Security Architecture:** CSP, rate limiting, brute force, sanitization, audit logging, CUI handling
  - **Directory Structure:** Top-level directory tree with purpose of each directory
- [ ] All diagrams are text-based (ASCII or Mermaid) — no external image dependencies
- [ ] All file paths referenced in the document are accurate to current codebase
- [ ] npm run build passes (no code changes)

**Depends on:** None (documentation only)
**Files:** ARCHITECTURE.md

---

#### T-39.2 CONTRIBUTING.md

No contributing guide exists. Setup requires knowing about Supabase project IDs, env vars, RBAC config, and specific testing patterns. PR conventions, branch strategy, and code review expectations are tribal knowledge. Without a contributing guide, onboarding a new developer takes hours of verbal hand-holding.

**Acceptance Criteria:**
- [ ] `CONTRIBUTING.md` at project root covering:
  - **Prerequisites:** Node 20+, npm, Supabase CLI (optional), Playwright browsers
  - **Setup:** Step-by-step from clone to running dev server, including env var setup (with `.env.example` reference)
  - **Branch Strategy:** `v2-development` for active work, PRs to `main`, branch naming conventions
  - **Code Conventions:** Server Components by default, `'use client'` only when needed, `'use server'` for actions, no `as any`, brand colors
  - **PR Process:** Create branch → make changes → run `npm run lint && npm test && npm run build` → open PR → CI must pass → code review
  - **Testing Guide:** Vitest for unit/component tests, Playwright for E2E, test file naming, mocking patterns, running tests locally
  - **Security Checklist:** Input sanitization on writes, RBAC checks on reads, audit logging on mutations, no CUI data in logs/errors
  - **Commit Messages:** Conventional format (`feat(module):`, `fix(module):`, `chore:`, `docs:`)
- [ ] `.env.example` created (or verified up to date) with all required env vars listed (values redacted)
- [ ] npm run build passes (no code changes)

**Depends on:** None (documentation only)
**Files:** CONTRIBUTING.md, .env.example (create or update)

---

#### T-39.3 DEPLOYMENT.md

Deployment is undocumented. Environment variables span Supabase, Sentry, Stripe, Redis, SAM.gov, Microsoft Graph, Google Workspace, and AI providers — over 30 env vars. Staging vs production differences, monitoring setup, and rollback procedures exist only in the deployer's memory. A deployment doc prevents catastrophic misconfigurations.

**Acceptance Criteria:**
- [ ] `DEPLOYMENT.md` at project root covering:
  - **Environment Variables:** Complete list of all env vars with descriptions, required/optional flags, and example values (secrets redacted)
    - Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
    - Sentry: `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_CSP_REPORT_URI`
    - Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
    - Redis: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
    - AI providers: all provider keys and endpoints
    - Feature flags and configuration env vars
  - **Staging Deployment:** Vercel preview deployments, staging Supabase project, staging env vars
  - **Production Deployment:** Merge to main → Vercel auto-deploy, production env var management, DNS/domain config
  - **Monitoring:** Sentry dashboard, health check endpoints, Lighthouse CI, uptime monitoring setup
  - **Rollback:** Vercel instant rollback to previous deployment, database migration rollback procedure
  - **Security:** Env var rotation schedule, secret management best practices, access control for deployment credentials
- [ ] npm run build passes (no code changes)

**Depends on:** None (documentation only)
**Files:** DEPLOYMENT.md

---

#### T-39.4 CHANGELOG.md + Release Process

No changelog exists. 39 sprints of changes across v1.0–v1.5 are documented only in commit history and roadmap files. No semver tags, no release notes, no versioning policy. Customers and stakeholders cannot see what changed between versions. A changelog provides accountability and transparency.

**Acceptance Criteria:**
- [ ] `CHANGELOG.md` at project root following [Keep a Changelog](https://keepachangelog.com/) format:
  - **v1.5 (Ship-Readiness):** CI/CD, lint cleanup, test expansion, coverage reporting, developer docs, final audit
  - **v1.4 (Production Hardening):** Sentry, structured logging, Web Vitals, Redis rate limiting, CSP, sanitization, Vitest, accessibility, code splitting, Lighthouse CI
  - **v1.3 (Doc Collaboration):** Track changes, document collaboration, real-time co-editing
  - **v1.2 (Data & AI):** USAspending, FPDS, RAG pipeline, knowledge graph, proactive AI, real-time collab
  - **v1.1 (Integrations):** Redis, Stripe, doc generation, Salesforce, GovWin, M365, Slack
  - **v1.0 (Foundation):** All 16 modules, 8 AI agents, auth, RBAC, pipeline, war room, compliance
  - Each version section has: Added, Changed, Fixed, Security subsections (as applicable)
- [ ] Release process documented in CONTRIBUTING.md or CHANGELOG.md:
  - Semver policy: MAJOR (breaking API changes), MINOR (new features), PATCH (bug fixes)
  - Release steps: update CHANGELOG → create git tag → merge to main → verify deploy
- [ ] npm run build passes (no code changes)

**Depends on:** None (documentation only)
**Files:** CHANGELOG.md

---

#### T-39.5 Final Audit

The final sweep before declaring v1.5 ship-ready. 7 `console.log`/`console.error` statements remain in AI modules that bypass the structured logger from T-32.2. Scattered TODO comments from previous sprints. Environment variable validation at startup is incomplete — missing env vars cause runtime errors deep in request handling rather than clear startup failures.

**Acceptance Criteria:**
- [ ] Migrate 7 AI module console statements to structured logger:
  - Find all `console.log`, `console.error`, `console.warn` in `lib/ai/` directory
  - Replace with `logger('ai').info()`, `logger('ai').error()`, `logger('ai').warn()`
  - Verify structured log format includes module, correlation ID, and context
- [ ] TODO cleanup:
  - Search all `TODO`, `FIXME`, `HACK`, `XXX` comments across codebase
  - Resolve or convert to GitHub issues (with issue number in comment: `// TODO(#123): description`)
  - Remove stale TODOs that reference completed sprints
- [ ] Environment variable validation at startup:
  - `lib/env.ts` — Zod schema validating all required env vars at import time
  - Missing required var → clear error message naming the variable and its purpose
  - Optional vars → logged as info when absent (not error)
  - Validation runs on `next start` and `next dev` (not just build)
- [ ] Final verification:
  - `npm run lint` — 0 warnings
  - `npm test -- --run` — all tests pass
  - `npm run build` — 0 errors
  - No deprecated Sentry warnings in build output
  - All route boundaries present (loading.tsx + error.tsx)
- [ ] npm run build passes

**Depends on:** T-36.2 (lint zero-warning), T-36.3 (Sentry migration complete)
**Files:** lib/ai/*.ts (modify — replace console statements), lib/env.ts (create), multiple files (TODO cleanup)

---

## 3. New Dependencies

**Zero new npm dependencies.** All required tooling (Vitest, Testing Library, Playwright, Lighthouse CLI, Sentry SDK, etc.) was installed during v1.4. Phase L is purely code, configuration, and documentation.

| Package | Sprint | Purpose | Dev Only? |
|---------|--------|---------|-----------|
| (none) | — | — | — |

Total: 0 new dependencies.

---

## 4. Dependency Chain

| Ticket | Blocks | Risk |
|--------|--------|------|
| T-36.2 (Lint Cleanup) | T-36.1 (CI `--max-warnings 0` requires zero existing warnings) | Must be first ticket. Lint fixes are mechanical but touch many files. |
| T-36.4 (Route Boundaries) | T-38.4 (E2E error boundary tests need boundaries to exist) | Boundaries must ship before E2E tests can verify them. |
| T-37.1–T-37.4 + T-38.1–T-38.2 (All new tests) | T-38.3 (Coverage thresholds set after tests provide baseline) | Thresholds are meaningless without tests. Set after test sprint completes. |
| T-36.2 (Lint Cleanup) + T-36.3 (Sentry Migration) | T-39.5 (Final audit verifies zero warnings + zero deprecations) | Final audit is the capstone — all cleanup must precede it. |
| T-34.1 (Vitest — v1.4) | T-37.1–T-37.4, T-38.1–T-38.2 (all new test files) | Test infrastructure already shipped. No new blockers. |

---

## 5. Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Lint fixes introduce runtime regressions | Behavior changes disguised as lint fixes | Low | Lint fixes are restricted to: unused var prefix `_`, `let`→`const`, dep arrays. Run full test suite after. No functional changes. |
| CI pipeline is slow (>10 min) | Developer friction, slow PR feedback | Medium | Parallel jobs (build, lint, test, lighthouse run concurrently). npm cache. 10-minute timeout per job. Optimize if needed. |
| Sentry migration breaks error capture | Production errors go undetected during migration window | Medium | Test error capture in staging before deleting old config. Keep old file as backup until verified. |
| Coverage thresholds too aggressive | Tests added to hit percentage rather than verify behavior | Low | 60% line target is achievable and meaningful. Thresholds apply to overall project, not per-file. Quality review in PRs. |
| E2E tests flaky in CI | False failures block PRs | Medium | Use Playwright retry (2 retries). Stable selectors (data-testid, not CSS classes). Run against `next start` (not dev). |
| Documentation becomes stale | Docs diverge from code over time | Medium | ARCHITECTURE.md references file paths that can be grep-verified. CONTRIBUTING.md includes commands that CI runs. DEPLOYMENT.md env vars validated by `lib/env.ts`. |
| Env validation blocks startup in edge cases | App won't start if optional var treated as required | Low | Explicit required vs optional classification. Optional vars log info, don't throw. Test validation with partial env in CI. |
| Final audit scope creep | "Just one more fix" delays ship | Medium | Strict scope: 7 console migrations, TODO cleanup, env validation. No new features. No refactoring beyond stated scope. |

---

## 6. Sprint Summary

| Sprint | Theme | Tickets | New Files | Modified Files | New Dependencies |
|--------|-------|---------|-----------|----------------|-----------------|
| S36 | CI/CD + Cleanup | 4 (T-36.1–T-36.4) | 14 | 10+ | 0 |
| S37 | Test Coverage I | 4 (T-37.1–T-37.4) | 4 | 0 | 0 |
| S38 | Test Coverage II + Reporting | 4 (T-38.1–T-38.4) | 8 | 3 | 0 |
| S39 | Docs + Polish | 5 (T-39.1–T-39.5) | 7 | 5+ | 0 |
| **Total** | | **17** | **33** | **18+** | **0** |

---

## 7. Test Count Projection

| Metric | Start (v1.4) | End (v1.5) | Delta |
|--------|-------------|------------|-------|
| Unit tests (Vitest) | 140 | 250+ | +110 |
| E2E specs (Playwright) | 24 | 34+ | +10 |
| Line coverage | ~0% reported | 60%+ enforced | +60% |
| Lint warnings | 48 | 0 | -48 |

---

## 8. What Phase L Is NOT

To prevent scope creep, these capabilities are explicitly **out of scope** for v1.5:

| Capability | Why Not v1.5 | When |
|------------|-------------|------|
| New features or modules | Phase L is hardening-only. Zero new user-facing features. | v2.0 |
| Database migrations or schema changes | No schema work in a stability phase. | v2.0 |
| New npm dependencies | All tooling installed in v1.4. Zero new packages. | v2.0 |
| 100% test coverage | 60% enforced floor with critical modules covered. Full coverage is ongoing. | Continuous |
| Automated deployment pipeline (CD) | CI gating is in scope. Automated production deploys require infrastructure approval. | Post-v1.5 |
| Performance profiling (server-side) | Frontend perf was v1.4. Server profiling is infrastructure concern. | Infrastructure sprint |
| Storybook / component documentation | Developer docs cover architecture, not component catalog. | v2.0 |
| API versioning | No public API consumers yet. Versioning before customers is premature. | When API goes public |
| Monorepo migration | Single Next.js app is correct for current scale. | If/when backend separates |

---

**PROPRIETARY — Mission Meets Tech, LLC — February 2026**
