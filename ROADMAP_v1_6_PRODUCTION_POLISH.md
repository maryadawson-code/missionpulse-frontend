# MissionPulse v1.6 Roadmap — Production Polish

**From Ship-Ready to Production-Polished**
4 Sprints • 18 Tickets • Phase M

Supersedes nothing — extends ROADMAP_v1_5_SHIP_READINESS.md (S36–S39)
Sprint numbering continues from S39. Ticket numbering continues from T-39.5.
Depends on: All prior sprints complete. Build: 0 errors, 0 type errors. `/verify` returns CLEAR with 277 tests.

**PROPRIETARY — Mission Meets Tech, LLC — February 2026**

---

## 1. Strategic Overview

### 1.1 Where We Are

v1.5 is complete. CI/CD pipeline (GitHub Actions with parallel build/lint/test/lighthouse jobs), lint zero-warning enforcement, Sentry instrumentation migration, route boundary completion, 110+ new unit tests (277 total), coverage reporting with thresholds, E2E expansion (35 specs), and full developer documentation (ARCHITECTURE.md, CONTRIBUTING.md, DEPLOYMENT.md, CHANGELOG.md) are all shipped. 39 sprints delivered. Build passes with 0 errors, 0 type errors. `/verify` returns CLEAR. Both `v2-development` and `main` branches are synced.

HEAD: 2d32976 on main. Build: CLEAR.

A post-ship-readiness audit before onboarding paid pilot customers revealed a second tier of quality gaps:

| Gap | Current State | Risk |
|-----|--------------|------|
| TypeScript test errors | 101 tsc errors in test files. Root cause: no `"types": ["vitest/globals"]` in tsconfig.json. Tests run (Vitest injects globals) but `tsc --noEmit` fails on test files. | CI typecheck job cannot cover test files. Type regressions in tests go undetected. |
| Error page message leaking | 17 of 22 error.tsx files expose raw `error.message` to production users. 17 of 22 skip Sentry integration. Only 5 follow the correct pattern. | Users see stack traces and internal error details in production. Sentry misses 77% of client errors. CMMC violation (error disclosure). |
| Sentry navigation warning | Missing `onRouterTransitionStart` export from `instrumentation-client.ts`. Package.json name/version stale. | Build warning on every compile. Navigation performance tracing disabled. |
| Cron N+1 queries | 7 queries × N pilots executed in a `for` loop in cron daily job. Each pilot triggers sequential database calls instead of batched queries. | O(N) database calls per cron run. Performance degrades linearly with customer count. Timeout risk at scale. |
| Excluded test files | 8 test files in `tests/sync/` and `tests/collaboration/` excluded from Vitest via config. Custom async runner format incompatible with Vitest API. | 8 test files provide zero value. Coverage metrics are inflated by exclusion. |
| Accessibility gaps | No `aria-busy` on 25 loading.tsx files. No `aria-hidden` on SVG icons. No `aria-current="page"` on active nav links. No `prefers-reduced-motion` media query. | WCAG 2.1 AA non-compliance on loading states, navigation, and motion. Screen readers announce decorative icons. |
| Mobile breakpoint conflict | `md:` vs `lg:` breakpoint mismatch between MobileNav and Sidebar components. Both render simultaneously on tablets (768–1024px). | Dual hamburger menus on iPad. Broken mobile layout for tablet users. |
| CMMC cache isolation | Semantic cache keys lack `companyId` prefix. Cross-tenant data leak risk in multi-tenant cache. | Company A's cached AI response could be served to Company B. CMMC SC-4 (information in shared resources) violation. |
| Low coverage thresholds | Thresholds at `lines: 4, functions: 3, branches: 2`. Never raised after 277 tests were added in S37–S38. | Coverage can regress to near-zero without CI failure. Thresholds provide no meaningful protection. |
| Test mock type safety | 3 `as any` casts remain in test mock factories from S37–S38 test expansion. | Test mocks drift from actual types silently. Refactors that change interfaces don't break mocks. |
| Console.error in production | Remaining `console.error` calls in non-AI modules bypass structured logger. | Unstructured logs in production. Missing correlation IDs and module context. |
| Stale cache invalidation | `revalidatePath('/')` used as blanket cache invalidation. Revalidates entire app on any mutation. | Every write operation invalidates all cached pages. Performance penalty on writes. Cache provides diminished value. |
| Dependabot configuration | Single group for all dependency updates. No GitHub Actions ecosystem monitoring. No scheduled CI runs. | Dependencies updated in large, hard-to-review batches. GitHub Actions vulnerabilities unmonitored. No weekend regression detection. |

These gaps are blockers for confident multi-tenant production deployment with CMMC compliance.

### 1.2 Where We're Going

Production-polished MissionPulse v1.6 that satisfies:
- **Type Safety:** Zero tsc errors across production AND test files. Typed test mocks. No `as any` in tests.
- **Error Handling:** All error boundaries follow consistent pattern — dev/prod message gating, Sentry integration, user-friendly recovery.
- **Accessibility:** WCAG 2.1 AA on loading states, navigation, and motion. Single consistent mobile breakpoint.
- **Performance:** Cron N+1 eliminated. Targeted cache invalidation via `revalidateTag()`. No blanket revalidation.
- **Testing:** 340+ unit tests. 30%+ line coverage enforced. All excluded tests migrated. Zero `as any` in mocks.
- **Compliance:** CMMC cache isolation (companyId in cache keys). No error message leaking. Structured logging everywhere.

### 1.3 Phase Map

| Phase | Sprints | What Ships |
|-------|---------|------------|
| M: Production Polish (v1.6) | S40–S43 | tsconfig.test.json, error boundary standardization, Sentry navigation hook, CI optimization, coverage threshold raise, loading/nav accessibility, mobile breakpoint fix, reduced motion, test migration, utility tests, cron N+1 fix, cache invalidation, Dependabot hardening, integration test stubs, RBAC tests, cache isolation, final audit |

### 1.4 Sprint Cadence

| Parameter | Value |
|-----------|-------|
| Sprint Length | Maximize delivery per sprint. No fixed time constraint. |
| Tickets per Sprint | 4–5 (packed for throughput) |
| Validation | npm run build must pass for every ticket |
| Branch | All work on v2-development. Merge to main per release. |
| Deploy | Staging auto-deploys on push. Production = manual merge. |
| v1.6 Target | Q2 2026 |

### 1.5 Execution Rules

Same as v1.1/v1.2/v1.3/v1.4/v1.5. Additionally:
- Zero new npm dependencies — all required tooling is already installed from v1.4/v1.5
- `tsconfig.test.json` extends base tsconfig — no divergence in strictness, only test-specific type additions
- Error boundary changes are pattern-only — no new error recovery logic, just consistent Sentry + dev/prod gating
- Accessibility changes follow existing Tailwind + ARIA patterns — no new a11y library
- Cache isolation changes are key-prefix only — no new caching infrastructure
- Coverage thresholds are raised to reflect actual coverage, not aspirational targets

---

## 2. PHASE M: Production Polish (v1.6)

Goal: Close every gap between "ship-ready" and "production-polished for multi-tenant CMMC deployment." Type-safe test infrastructure. Consistent error handling. Accessible loading and navigation. Performant data layer. Comprehensive test coverage with meaningful thresholds. When Phase M is done, the application meets CMMC compliance requirements for cache isolation and error disclosure, all test files type-check cleanly, and every error boundary follows a single proven pattern.

---

### SPRINT 40 — Tech Hygiene + DX Polish

*TypeScript test configuration. Sentry navigation hook. Error boundary standardization. CI optimization. Coverage threshold raise.*

#### T-40.1 TypeScript Test Configuration

101 tsc errors exist exclusively in test files. The root cause is that `tsconfig.json` does not include `"types": ["vitest/globals"]`, so TypeScript doesn't recognize Vitest's global APIs (`describe`, `it`, `expect`, `vi`, `beforeEach`, etc.). Vitest injects these at runtime, so tests pass — but `tsc --noEmit` reports 101 "Cannot find name" errors. A separate `tsconfig.test.json` solves this without polluting production types.

**Acceptance Criteria:**
- [ ] `tsconfig.test.json` at project root:
  - Extends `./tsconfig.json` (inherits all strictness settings)
  - Adds `"types": ["vitest/globals"]` to `compilerOptions`
  - Sets `"include"` to test file patterns: `["**/*.test.ts", "**/*.test.tsx", "**/__tests__/**", "tests/**"]`
  - Does NOT relax any strictness settings from base tsconfig
- [ ] `vitest.config.ts` updated:
  - Add `typecheck.tsconfig: './tsconfig.test.json'` to vitest config
  - Verify `globals: true` is already set (enables global API without imports)
- [ ] `package.json` updated:
  - Add script `"typecheck": "tsc --noEmit"` (production types)
  - Add script `"typecheck:tests": "tsc --noEmit -p tsconfig.test.json"` (test types)
  - Verify `"typecheck"` passes with 0 errors
  - Verify `"typecheck:tests"` passes with 0 errors
- [ ] All 101 tsc errors in test files are resolved by the new config (no code changes needed)
- [ ] Run `npm test -- --run` — all 277 tests still pass
- [ ] npm run build passes

**Depends on:** None (foundational config change)
**Files:** tsconfig.test.json (new), vitest.config.ts (modify), package.json (modify)

---

#### T-40.2 Sentry Navigation Hook + Package Metadata

`instrumentation-client.ts` is missing the `onRouterTransitionStart` export that Sentry's Next.js SDK expects for navigation performance tracing. This generates a build warning on every compilation and disables automatic navigation span creation. Additionally, `package.json` still uses the default name and an outdated version — Sentry reads these for release metadata.

**Acceptance Criteria:**
- [ ] `instrumentation-client.ts` updated:
  - Export `onRouterTransitionStart` from `@sentry/nextjs` (1-line re-export)
  - Verify Sentry navigation performance tracing is enabled (spans created on route changes)
- [ ] `package.json` updated:
  - `"name"` set to `"missionpulse-frontend"`
  - `"version"` set to `"1.6.0"`
- [ ] Build output contains zero Sentry-related warnings
- [ ] Verify Sentry captures navigation transactions in staging
- [ ] npm run build passes

**Depends on:** None (independent fix)
**Files:** instrumentation-client.ts (modify), package.json (modify)

---

#### T-40.3 Error Boundary Standardization

17 of 22 `error.tsx` files leak raw `error.message` directly to users in production and skip Sentry error capture. 5 files already follow the correct pattern: Sentry integration via `useEffect`, dev/prod message gating (show details in dev, generic message in prod), and a "Try again" button calling `reset()`. Standardize all 17 to match the 5 good patterns.

**Acceptance Criteria:**
- [ ] Create `components/ui/ErrorDisplay.tsx` — shared error display component:
  - Props: `error: Error & { digest?: string }`, `reset: () => void`, `context?: string`
  - `useEffect` on mount: calls `Sentry.captureException(error)` with `context` tag
  - Production: shows generic message ("Something went wrong" + context-specific hint)
  - Development (`process.env.NODE_ENV === 'development'`): shows `error.message` and `error.digest`
  - "Try again" button calls `reset()` to retry the route segment
  - Styled consistently with existing error boundaries (brand colors, centered layout)
  - Marked `'use client'` (Next.js error boundary requirement)
- [ ] Update all 17 non-conforming `error.tsx` files:
  - Import and use `ErrorDisplay` component
  - Pass route-specific `context` string (e.g., "loading pipeline data", "loading war room")
  - Remove any direct rendering of `error.message` in production
  - Remove any `console.error(error)` — Sentry handles capture
- [ ] Verify 5 existing good patterns still work (no regression)
- [ ] Verify: in production build, no error page shows raw error message
- [ ] Verify: in development, error pages show full error details for debugging
- [ ] npm run build passes

**Depends on:** None (independent component work)
**Files:** components/ui/ErrorDisplay.tsx (new), 17 error.tsx files across app/(dashboard)/ (modify)

---

#### T-40.4 CI Pipeline Optimization

The CI pipeline from T-36.1 has optimization opportunities: duplicate lighthouse build (lighthouse job runs its own build instead of reusing the build job artifact), Playwright CI uses dev server instead of production build, and the new `typecheck` script from T-40.1 needs a CI job. Additionally, npm cache should be verified across all jobs.

**Acceptance Criteria:**
- [ ] `.github/workflows/ci.yml` updated:
  - Add `typecheck` job: runs `npm run typecheck` and `npm run typecheck:tests` (validates both production and test types)
  - Lighthouse job: reuse build artifact from `build` job instead of running its own `npm run build`
  - Playwright job (if exists): use `npm run build && npx next start` instead of dev server for realistic E2E testing
  - All jobs: verify `actions/cache` on `~/.npm` for dependency caching
  - All jobs: verify `timeout-minutes: 10` is set
- [ ] PR status checks: `typecheck` job must pass before merge (add to required checks)
- [ ] Total CI wall-clock time remains under 10 minutes for a typical PR
- [ ] All CI jobs pass on current codebase
- [ ] npm run build passes

**Depends on:** T-40.1 (typecheck scripts must exist before CI job references them)
**Files:** .github/workflows/ci.yml (modify)

---

#### T-40.5 Coverage Threshold Raise + Mock Cleanup

Coverage thresholds are set at `lines: 4, functions: 3, branches: 2` — effectively zero enforcement. With 277 tests already in the codebase, actual coverage is significantly higher. Raise thresholds to reflect reality and prevent regression. Additionally, 3 `as any` casts remain in test mock factories from S37–S38, which allow mocks to drift from actual types.

**Acceptance Criteria:**
- [ ] Run `npm test -- --run --coverage` — document actual coverage percentages
- [ ] `vitest.config.ts` updated:
  - Raise thresholds to `lines: 30, functions: 25, branches: 20` (or actual baseline minus 5%, whichever is higher)
  - Thresholds are enforced in CI (test job fails if coverage drops below)
- [ ] Remove 3 `as any` casts in test mock factories:
  - Identify all `as any` in test files via grep
  - Replace with typed mock factories using `vi.fn<>()` generics or proper interface implementations
  - Verify mocks still satisfy expected types without `as any`
- [ ] All 277 tests still pass with raised thresholds
- [ ] Coverage does not drop below new thresholds
- [ ] npm run build passes

**Depends on:** T-42.1 (excluded test migration adds tests that raise baseline — but threshold can be set conservatively first)
**Files:** vitest.config.ts (modify), test files with `as any` (modify — typically 2–3 files)

---

### SPRINT 41 — Accessibility + Mobile Polish

*Loading state accessibility. Navigation accessibility. Mobile breakpoint reconciliation. Reduced motion + focus management.*

#### T-41.1 Loading State Accessibility

25 `loading.tsx` files across the application render skeleton UI without any ARIA attributes. Screen readers have no way to announce that content is loading. Users with assistive technology see no indication of loading state — the page appears empty until content arrives.

**Acceptance Criteria:**
- [ ] Audit all `loading.tsx` files under `app/` — document each file's current state
- [ ] Update all 25 `loading.tsx` files with accessibility attributes:
  - Root container: `aria-busy="true"` (indicates content is loading)
  - Root container: `role="status"` (screen reader announces state change)
  - Root container: `aria-label="Loading [page context]"` (e.g., "Loading pipeline data", "Loading dashboard")
  - Each loading file gets a context-specific label matching its route
- [ ] Verify with screen reader (VoiceOver on macOS):
  - Navigate to route → hear "Loading [context]" announcement
  - Content loads → `aria-busy` removed by React hydration (automatic — loading.tsx unmounts)
- [ ] No visual changes to loading skeletons — accessibility-only modifications
- [ ] npm run build passes

**Depends on:** None (independent accessibility work)
**Files:** 25 loading.tsx files across app/ directory (modify)

---

#### T-41.2 Navigation Accessibility

SVG icons in the sidebar and mobile nav lack `aria-hidden="true"`, causing screen readers to announce them as images (or read their `<path>` data). Active navigation links lack `aria-current="page"`, so screen readers don't indicate which page is currently active. Navigation sections lack proper headings for screen reader landmark navigation.

**Acceptance Criteria:**
- [ ] SVG icon accessibility:
  - Add `aria-hidden="true"` to all decorative SVG icons in Sidebar and MobileNav
  - Add `role="img"` and `aria-label` to any SVGs that convey meaning (not just decoration)
  - Verify no screen reader announces SVG path data
- [ ] Active link accessibility:
  - Add `aria-current="page"` to the currently active navigation link
  - Update link styling logic to apply `aria-current` alongside visual active state
  - Verify screen reader announces "current page" for active link
- [ ] Navigation landmark accessibility:
  - Wrap primary nav in `<nav aria-label="Main navigation">`
  - If secondary nav exists (e.g., settings), add `<nav aria-label="Settings">`
  - Verify screen reader can list navigation landmarks
- [ ] No visual changes — accessibility-only modifications
- [ ] npm run build passes

**Depends on:** None (independent accessibility work)
**Files:** components/layout/Sidebar.tsx (modify), components/layout/MobileNav.tsx (modify, if exists), related navigation components

---

#### T-41.3 Mobile Breakpoint Reconciliation

MobileNav uses `md:` breakpoint (768px) to hide, while Sidebar uses `lg:` breakpoint (1024px) to show. Between 768px and 1024px (typical iPad width), both components render — creating dual hamburger menus and overlapping navigation. The fix is a single consistent breakpoint across both components.

**Acceptance Criteria:**
- [ ] Audit MobileNav and Sidebar for breakpoint usage:
  - Document all `md:`, `lg:`, `sm:` breakpoint classes in both components
  - Identify the conflict zone (768px–1024px)
- [ ] Reconcile to single breakpoint:
  - Choose `lg:` (1024px) as the consistent breakpoint for sidebar show/hide
  - MobileNav: visible below `lg:`, hidden at `lg:` and above
  - Sidebar: hidden below `lg:`, visible at `lg:` and above
  - Single hamburger button at all sub-`lg:` widths
- [ ] Verify on simulated devices:
  - Mobile (375px): hamburger menu only, no sidebar
  - Tablet portrait (768px): hamburger menu only, no sidebar
  - Tablet landscape (1024px): sidebar visible, no hamburger
  - Desktop (1440px): sidebar visible, no hamburger
- [ ] No layout shift when crossing breakpoint
- [ ] npm run build passes

**Depends on:** None (independent CSS work)
**Files:** components/layout/Sidebar.tsx (modify), components/layout/MobileNav.tsx (modify), app/(dashboard)/layout.tsx (modify if needed)

---

#### T-41.4 Reduced Motion + Focus Management

Skeleton loading animations (`animate-pulse`), transitions, and other motion effects play regardless of user motion preferences. Users with vestibular disorders who set `prefers-reduced-motion: reduce` in their OS still see all animations. Additionally, modals and drawers need focus trap verification to ensure keyboard users can't tab behind the overlay.

**Acceptance Criteria:**
- [ ] Reduced motion support:
  - Add `motion-reduce:animate-none` Tailwind class to all `animate-pulse` skeleton elements (Tailwind's built-in `prefers-reduced-motion` variant)
  - Audit all CSS transitions and animations — add `motion-reduce:transition-none` where appropriate
  - Verify: with OS "Reduce Motion" enabled, no pulsing/transitions play
  - Verify: with OS "Reduce Motion" disabled, animations play normally
- [ ] Focus management audit:
  - Verify `FormModal` traps focus (Tab cycles within modal, not behind overlay)
  - Verify `ConfirmModal` traps focus
  - Verify modals return focus to trigger element on close
  - If any modal fails focus trap: add `aria-modal="true"` and focus management logic
- [ ] No visual changes when "Reduce Motion" is disabled — changes only activate for users who opt in
- [ ] npm run build passes

**Depends on:** None (independent accessibility work)
**Files:** Multiple loading.tsx files (modify — add motion-reduce class), components/ui/FormModal.tsx (verify/modify), components/ui/ConfirmModal.tsx (verify/modify), globals.css (modify if needed)

---

### SPRINT 42 — Test Rationalization + Data Layer

*Excluded test migration. Utility tests. Cron N+1 fix. Cache invalidation refinement. Dependabot hardening.*

#### T-42.1 Sync/Collaboration Test Migration

8 test files in `tests/sync/` and `tests/collaboration/` are excluded from Vitest configuration. These files use a custom async runner format that is incompatible with Vitest's test API. The exclusion means these 8 files contribute zero coverage and zero regression protection despite existing. Rewrite them using standard Vitest API.

**Acceptance Criteria:**
- [ ] Identify all excluded test files in `vitest.config.ts` (the `exclude` array)
- [ ] Rewrite each excluded test file using standard Vitest API:
  - Replace custom async runner patterns with `describe`/`it`/`expect`
  - Mock Supabase Realtime channels using `vi.mock()`
  - Mock WebSocket connections — no real connections
  - Preserve original test intent and assertions
- [ ] Remove exclusion entries from `vitest.config.ts`
- [ ] All 8 migrated test files pass via `npm test -- --run`
- [ ] Total test count increases by the number of test cases in migrated files
- [ ] npm run build passes

**Depends on:** None (independent test work)
**Files:** tests/sync/*.test.ts (rewrite), tests/collaboration/*.test.ts (rewrite), vitest.config.ts (modify — remove exclusions)

---

#### T-42.2 Utility + Validation Tests

Pure utility functions in `lib/utils/validation.ts`, `lib/logging/logger.ts`, `lib/utils/activity.ts`, and timeline utilities are high-value test targets — deterministic inputs/outputs, no external dependencies, fast execution. These are the foundation functions that many modules depend on. A regression here cascades everywhere.

**Acceptance Criteria:**
- [ ] `lib/utils/__tests__/validation.test.ts` — tests for shared Zod schemas:
  - `requiredString`: empty → error, whitespace → error, valid → passes
  - `emailSchema`: invalid formats → error, valid email → passes
  - `dollarAmount`: negative → error, zero → passes, large number → passes
  - `phoneSchema` (if exists): invalid format → error, valid → passes
  - Edge cases: max length strings, unicode characters, SQL injection payloads → sanitized or rejected
- [ ] `lib/logging/__tests__/logger.test.ts` — tests for structured logger:
  - `logger('module').info()` outputs expected format
  - `logger('module').error()` includes stack trace
  - Log levels: debug < info < warn < error filtering
  - Correlation ID included when available
  - Sensitive data (tokens, passwords) not logged
- [ ] `lib/utils/__tests__/activity.test.ts` — tests for activity utilities:
  - `formatAction`: maps action codes to human-readable strings
  - `timeAgo`: formats relative time correctly (seconds, minutes, hours, days)
  - `getInitials`: extracts initials from full name
  - `groupByDate`: groups activities into today/yesterday/older buckets
  - Edge cases: empty arrays, null names, future dates
- [ ] Timeline utility tests (if `timeline-utils.ts` exists):
  - Date range calculations
  - Milestone positioning
  - Duration formatting
- [ ] All tests are pure unit tests — no mocks needed (pure functions)
- [ ] Minimum 20 test cases across all utility test files
- [ ] All tests pass via `npm test -- --run`
- [ ] npm run build passes

**Depends on:** None (independent test work)
**Files:** lib/utils/__tests__/validation.test.ts (new), lib/logging/__tests__/logger.test.ts (new), lib/utils/__tests__/activity.test.ts (new), timeline test file (new, if applicable)

---

#### T-42.3 Cron Daily N+1 Fix

The cron daily job executes 7 queries per pilot customer in a `for` loop — fetching opportunity counts, compliance status, team size, activity summary, deadline alerts, token usage, and cache warmup for each pilot sequentially. With 10 pilots, this is 70 sequential database calls. The war room page already uses the proven pattern: `Promise.all` with `.in()` batch queries to fetch data for multiple entities in a single query.

**Acceptance Criteria:**
- [ ] Identify the cron daily job file (likely `app/api/cron/daily/route.ts` or similar)
- [ ] Refactor sequential per-pilot queries to batched queries:
  - Replace `for (const pilot of pilots)` loop with batch approach
  - Use `.in('company_id', pilotIds)` to fetch all pilot data in single queries
  - Use `Promise.all()` to run independent batch queries in parallel
  - Result: 7 parallel batch queries regardless of pilot count (was 7 × N sequential)
- [ ] Replace `console.error` calls with structured logger:
  - Import `logger` from `lib/logging/logger.ts`
  - Replace `console.error(...)` with `logger('cron').error(...)` with context
  - Replace any `console.log(...)` with `logger('cron').info(...)`
- [ ] Verify cron response time is O(1) not O(N) relative to pilot count
- [ ] Add error handling: if one batch query fails, others still execute (Promise.allSettled)
- [ ] npm run build passes

**Depends on:** None (independent data layer work)
**Files:** app/api/cron/daily/route.ts (or equivalent — modify)

---

#### T-42.4 Cache Invalidation Refinement

Server actions use `revalidatePath('/')` as a blanket cache invalidation strategy — every mutation revalidates the entire application cache. This defeats the purpose of caching: after creating an opportunity, the dashboard, settings, admin pages, and every other cached page are all revalidated. Replace with targeted `revalidateTag()` calls that only invalidate the affected data.

**Acceptance Criteria:**
- [ ] Audit all `revalidatePath('/')` calls across the codebase:
  - Document each file and the mutation that triggers revalidation
  - Identify the minimum set of data that each mutation actually invalidates
- [ ] Implement tag-based revalidation:
  - Define cache tags: `'opportunities'`, `'dashboard'`, `'compliance'`, `'team'`, `'audit'`, `'settings'`, etc.
  - Replace `revalidatePath('/')` with `revalidateTag('affected-tag')` in each server action
  - Example: `createOpportunity` → `revalidateTag('opportunities')` + `revalidateTag('dashboard')`
  - Example: `updateTeamMember` → `revalidateTag('team')`
- [ ] Add `unstable_cache` tags to Server Components that fetch data:
  - Dashboard queries tagged with `'dashboard'`
  - Pipeline queries tagged with `'opportunities'`
  - Compliance queries tagged with `'compliance'`
- [ ] Verify: after creating opportunity, only pipeline and dashboard caches refresh (not settings, admin, etc.)
- [ ] Verify: no stale data — mutations still trigger appropriate cache refresh
- [ ] npm run build passes

**Depends on:** None (independent data layer work)
**Files:** lib/actions/opportunities.ts (modify), lib/actions/*.ts (modify), app/(dashboard)/**/page.tsx (modify — add cache tags)

---

#### T-42.5 Dependabot + CI Hardening

Dependabot is configured from T-36.1 but uses a single group for all npm updates and doesn't monitor GitHub Actions. Large grouped PRs are hard to review and risk introducing breaking changes. Additionally, CI only runs on push/PR — no scheduled runs to detect dependency-related breakage on weekends.

**Acceptance Criteria:**
- [ ] `.github/dependabot.yml` updated:
  - Separate groups for major vs minor/patch updates:
    - `major-updates` group: `update-types: ["version-update:semver-major"]` — separate PR per major bump for careful review
    - `minor-patch-updates` group: `update-types: ["version-update:semver-minor", "version-update:semver-patch"]` — grouped for easy approval
  - Add `github-actions` ecosystem monitoring:
    - Weekly schedule matching npm ecosystem
    - Auto-updates for Actions used in CI (actions/checkout, actions/cache, etc.)
  - Keep weekly schedule for npm ecosystem
- [ ] `.github/workflows/ci.yml` updated:
  - Add `schedule` trigger: `cron: '0 8 * * 1'` (Monday 8 AM UTC — weekly regression check)
  - Schedule trigger runs full CI suite against `main` branch
  - Scheduled runs use same job matrix as PR runs
- [ ] Verify Dependabot creates correctly grouped PRs
- [ ] npm run build passes

**Depends on:** None (independent CI work)
**Files:** .github/dependabot.yml (modify), .github/workflows/ci.yml (modify)

---

### SPRINT 43 — Remaining Coverage + Final Audit

*Integration module test stubs. RBAC hooks tests. Semantic cache isolation. Final audit.*

#### T-43.1 Integration Module Test Stubs

Integration modules (Salesforce sync, Slack notifications, GovWin import) call external APIs with complex authentication, pagination, and error handling. Zero tests cover this logic. While full integration tests require live API credentials, unit tests with mocked HTTP responses verify the business logic: field mapping, error handling, retry behavior, and data transformation.

**Acceptance Criteria:**
- [ ] `lib/integrations/__tests__/salesforce-sync.test.ts` — tests for Salesforce sync:
  - Opportunity field mapping: Supabase → Salesforce field names correct
  - Sync conflict resolution: newer timestamp wins
  - API error (401 expired token) → refresh token flow triggered
  - API error (500 server error) → retry with backoff
  - Rate limit (429) → respect `Retry-After` header
  - Empty sync (no changes) → no API calls made
- [ ] `lib/integrations/__tests__/slack-notify.test.ts` — tests for Slack notifications:
  - Opportunity status change → correct Slack message format
  - Channel routing: different events → different channels
  - Slack API error → fails gracefully (no throw, logs warning)
  - Missing Slack webhook URL → skip notification (not crash)
- [ ] `lib/integrations/__tests__/govwin-import.test.ts` — tests for GovWin import:
  - CSV/API response → correctly parsed into opportunity shape
  - Duplicate detection: existing NAICS + title match → skip or update
  - Invalid data row → skip with warning (not abort entire import)
  - Empty response → zero opportunities created (not error)
- [ ] All external HTTP calls mocked via `vi.mock()` — no real API calls
- [ ] Minimum 15 test cases across all integration test files
- [ ] All tests pass via `npm test -- --run`
- [ ] npm run build passes

**Depends on:** None (independent test work)
**Files:** lib/integrations/__tests__/salesforce-sync.test.ts (new), lib/integrations/__tests__/slack-notify.test.ts (new), lib/integrations/__tests__/govwin-import.test.ts (new)

---

#### T-43.2 RBAC Hooks + Permissions Tests

`lib/rbac/hooks.ts` (client-side RBAC hooks) and RBAC permission resolution are used by every protected component in the application. Zero tests cover this logic (identified as gap T-34.2 in v1.4 planning). A bug in `useModuleAccess` that returns `true` for unauthorized users silently disables RBAC application-wide.

**Acceptance Criteria:**
- [ ] `lib/rbac/__tests__/hooks.test.ts` — tests for RBAC hooks:
  - `useRole`: returns correct role for authenticated user
  - `useRole`: returns null/undefined for unauthenticated user
  - `useModuleAccess('pipeline', 'read')`: admin → true
  - `useModuleAccess('pipeline', 'write')`: viewer → false
  - `useModuleAccess('admin', 'read')`: non-admin role → false
  - `useVisibleNav`: returns only modules user has read access to
  - `useVisibleNav`: sensitive modules hidden from non-sensitive roles
  - Role hierarchy: executive sees all modules, author sees subset
- [ ] `lib/rbac/__tests__/permissions.test.ts` — tests for permission resolution:
  - `resolveRole`: maps Supabase role string to RBAC role config
  - `getModulePermission`: returns correct CRUD flags per role × module
  - `getModulePermission`: unknown module → no access (fail closed)
  - `getModulePermission`: unknown role → no access (fail closed)
  - All 12 roles × critical modules tested (at least spot-check matrix)
  - Sensitive roles list is correct and complete
- [ ] Minimum 15 test cases across both test files
- [ ] Mock Supabase auth context for hook tests
- [ ] All tests pass via `npm test -- --run`
- [ ] npm run build passes

**Depends on:** None (independent test work)
**Files:** lib/rbac/__tests__/hooks.test.ts (new), lib/rbac/__tests__/permissions.test.ts (new)

---

#### T-43.3 Semantic Cache Company Isolation

The semantic cache for AI responses uses cache keys that do not include `companyId`. In a multi-tenant deployment, Company A's cached response to "What are our compliance gaps?" could be served to Company B asking the same question. This is a CMMC SC-4 violation (Information in Shared Resources) and a data breach.

**Acceptance Criteria:**
- [ ] Audit semantic cache key generation:
  - Identify the file that generates cache keys (likely `lib/ai/cache.ts` or `lib/cache/semantic.ts`)
  - Document current key format
- [ ] Add `companyId` to all cache key generation:
  - Cache key format: `${companyId}:${existingKeyComponents}`
  - `companyId` must be resolved from authenticated user's profile, not from request input (prevent spoofing)
  - All cache reads filter by `companyId`
  - All cache writes include `companyId`
- [ ] Add cache isolation test:
  - Same query, different `companyId` → cache miss (different keys)
  - Same query, same `companyId` → cache hit
  - Cache key without `companyId` → rejected (validation)
- [ ] Document the isolation model for CMMC auditors:
  - Add inline code comments referencing CMMC SC-4 control
  - Document in ARCHITECTURE.md or as code comment: "Cache keys are tenant-isolated by companyId to prevent cross-tenant data leakage per CMMC SC-4"
- [ ] npm run build passes

**Depends on:** None (independent security work)
**Files:** lib/ai/cache.ts or lib/cache/semantic.ts (modify), cache test file (new), ARCHITECTURE.md (modify — add cache isolation note)

---

#### T-43.4 Final Audit

The capstone sweep before declaring v1.6 production-polished. Migrate remaining `console.error` calls to structured logger. Clean up stale TODOs from previous sprints. Fix duplicate admin Supabase client if it exists. Update CHANGELOG with v1.6 release notes. Run `/verify` and confirm CLEAR.

**Acceptance Criteria:**
- [ ] Console statement migration:
  - Search all `console.log`, `console.error`, `console.warn` outside of test files
  - Replace with structured logger: `logger('module').info/error/warn()`
  - Exclude `instrumentation.ts` and `instrumentation-client.ts` (Sentry init requires console)
  - Verify no unstructured console output in production
- [ ] TODO cleanup:
  - Search all `TODO`, `FIXME`, `HACK`, `XXX` comments across codebase
  - Resolve completed TODOs (delete the comment)
  - Convert active TODOs to GitHub issues (add issue number: `// TODO(#NNN): description`)
  - Remove stale TODOs referencing completed sprints (S36–S42)
- [ ] Duplicate admin client fix:
  - Audit Supabase client creation — verify single `createAdminClient()` factory
  - If multiple admin client instantiations exist, consolidate to single shared import
- [ ] CHANGELOG update:
  - Add v1.6 (Production Polish) section to CHANGELOG.md:
    - **Added:** ErrorDisplay component, tsconfig.test.json, cache tags, RBAC tests, integration test stubs, utility tests, cache isolation
    - **Changed:** Error boundaries standardized, coverage thresholds raised, Dependabot groups, CI pipeline optimized, cron batched, cache invalidation targeted, mobile breakpoint unified
    - **Fixed:** 101 tsc test errors, Sentry navigation warning, 17 error message leaks, cron N+1, dual hamburger menu, cross-tenant cache risk
    - **Security:** CMMC SC-4 cache isolation, error disclosure prevention
    - **Accessibility:** Loading states, navigation landmarks, reduced motion, focus management
- [ ] Final verification:
  - `npm run lint` — 0 warnings
  - `npm run typecheck` — 0 errors (production)
  - `npm run typecheck:tests` — 0 errors (test files)
  - `npm test -- --run` — all tests pass (340+)
  - `npm run build` — 0 errors
  - No Sentry warnings in build output
  - `/verify` returns CLEAR
- [ ] npm run build passes

**Depends on:** T-42.3 (cron fix must be complete for clean audit), T-40.3 (error boundaries must be standardized)
**Files:** Multiple files (console migration), CHANGELOG.md (modify), various files (TODO cleanup)

---

## 3. New Dependencies

**Zero new npm dependencies.** All required tooling (Vitest, Testing Library, Playwright, Sentry SDK, Tailwind, shadcn/ui, etc.) was installed during v1.4/v1.5. Phase M is purely code, configuration, and tests.

| Package | Sprint | Purpose | Dev Only? |
|---------|--------|---------|-----------|
| (none) | — | — | — |

Total: 0 new dependencies.

---

## 4. Dependency Chain

| Ticket | Blocks | Risk |
|--------|--------|------|
| T-40.1 (tsconfig.test.json) | T-40.4 (CI typecheck job requires typecheck scripts to exist) | Must be completed before CI job can reference the scripts. Config-only change, low risk. |
| T-40.3 (Error Boundaries) | T-43.4 (Final audit verifies all error boundaries are standardized) | Error boundary pattern must be consistent before final audit validates it. |
| T-42.1 (Test Migration) | T-40.5 (Coverage thresholds — more tests = higher baseline to set thresholds against) | Migrated tests increase coverage floor. Set thresholds after migration for accurate baseline. |
| T-42.3 (Cron N+1 Fix) | T-43.4 (Final audit verifies cron performance and structured logging) | Cron must be fixed before final audit checks for console statements and performance. |
| T-40.3 (Error Boundaries) | T-41.1 (Same file pattern familiarity — error.tsx and loading.tsx are sibling files) | Not a hard dependency, but working on error.tsx first builds familiarity with route boundary patterns. |

---

## 5. Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Error boundary refactor introduces regressions | Error pages show wrong content or fail to render | Low | SharedErrorDisplay is additive — wraps existing reset() pattern. 5 existing good patterns serve as template. Verify each route after update. |
| tsconfig.test.json diverges from base config | Test files compile with different strictness than production | Low | `extends: ./tsconfig.json` inherits all settings. Only addition is `"types": ["vitest/globals"]`. No strictness relaxation allowed. |
| Coverage threshold too high for codebase | CI fails on every PR because baseline is below threshold | Low | Measure actual coverage first, set threshold 5% below actual. Never set aspirational thresholds. |
| Cache tag refactor causes stale data | Users see outdated data after mutations | Medium | Map every mutation to its affected tags before implementing. Test each mutation → verify cache refresh. Keep `revalidatePath` as fallback during transition. |
| Mobile breakpoint change breaks existing layouts | Components that rely on `md:` breakpoint shift unexpectedly | Medium | Audit all `md:` usage in layout components. Only change breakpoints in MobileNav and Sidebar. Test on 4 viewport widths. |
| Cache isolation breaks existing cache hits | Cache miss rate increases after adding companyId to keys | Low | Expected behavior — first request after deploy will miss cache. Subsequent requests will hit. One-time cold cache penalty. |
| Cron batch refactor changes error handling semantics | Individual pilot failures silently swallowed by Promise.allSettled | Medium | Log each settled rejection. Return degraded status (not success) if any batch fails. Alert on partial failures. |
| Reduced motion class conflicts with existing animations | Animations stop working for all users, not just reduce-motion users | Low | Tailwind's `motion-reduce:` variant only activates when OS preference is set. Zero impact on users without the preference. |
| Excluded test migration reveals stale/broken test logic | Migrated tests fail because underlying code changed since tests were written | Medium | Review each test against current codebase. Update assertions to match current behavior. If original intent is unclear, rewrite from scratch. |
| Final audit scope creep | "Just one more fix" delays ship | Medium | Strict scope: console migration, TODO cleanup, admin client fix, CHANGELOG, verify. No new features. No refactoring beyond stated scope. |

---

## 6. Sprint Summary

| Sprint | Theme | Tickets | New Files | Modified Files | New Dependencies |
|--------|-------|---------|-----------|----------------|-----------------|
| S40 | Tech Hygiene + DX | 5 (T-40.1–T-40.5) | 2 | 22+ | 0 |
| S41 | Accessibility + Mobile | 4 (T-41.1–T-41.4) | 0 | 30+ | 0 |
| S42 | Tests + Data Layer | 5 (T-42.1–T-42.5) | 4 | 15+ | 0 |
| S43 | Coverage + Final Audit | 4 (T-43.1–T-43.4) | 5 | 10+ | 0 |
| **Total** | | **18** | **11** | **77+** | **0** |

---

## 7. Test Count Projection

| Metric | Start (v1.5) | End (v1.6) | Delta |
|--------|-------------|------------|-------|
| Unit tests (Vitest) | 277 | 340+ | +63 |
| E2E specs (Playwright) | 35 | 35 | 0 |
| Line coverage | ~4% enforced | 30%+ enforced | +26% |
| tsc errors (test files) | 101 | 0 | -101 |
| Error pages leaking messages | 17 | 0 | -17 |
| Excluded test files | 8 | 0 | -8 |
| `as any` in test mocks | 3 | 0 | -3 |

---

## 8. What Phase M Is NOT

To prevent scope creep, these capabilities are explicitly **out of scope** for v1.6:

| Capability | Why Not v1.6 | When |
|------------|-------------|------|
| New features or modules | Phase M is polish-only. Zero new user-facing features. | v2.0 |
| Database migrations or schema changes | No schema work in a polish phase. | v2.0 |
| New npm dependencies | All tooling installed in v1.4/v1.5. Zero new packages. | v2.0 |
| 100% test coverage | 30% enforced floor with critical modules covered. Full coverage is ongoing. | Continuous |
| Server-side performance profiling | Data layer fixes (cron, cache) are in scope. APM tooling is not. | Infrastructure sprint |
| Storybook / component docs | Component catalog is a new tool, not polish. | v2.0 |
| E2E test expansion | E2E suite is stable at 35 specs. Focus is unit test gaps. | If E2E regressions emerge |
| Visual regression testing | Screenshot comparison tooling is new infrastructure. | v2.0 |
| Internationalization (i18n) | Translation is a new feature, not polish. | v2.0 |
| Multi-region deployment | Infrastructure concern beyond code polish. | Infrastructure sprint |
| API versioning | No public API consumers yet. | When API goes public |

---

**PROPRIETARY — Mission Meets Tech, LLC — February 2026**
