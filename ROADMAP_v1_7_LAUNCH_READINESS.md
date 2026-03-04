# MissionPulse v1.7 Roadmap — Launch Readiness

**From Production-Polished to Launch-Ready**
4 Sprints • 16 Tickets • Phase N

Supersedes nothing — extends ROADMAP_v1_6_PRODUCTION_POLISH.md (S40–S43)
Sprint numbering continues from S43. Ticket numbering continues from T-43.4.
Depends on: All prior sprints complete. Build: 0 errors, 0 type errors. `/verify` returns CLEAR with 455 tests.

**PROPRIETARY — Mission Meets Tech, LLC — February 2026**

---

## 1. Strategic Overview

### 1.1 Where We Are

v1.6 is complete. TypeScript test configuration, error boundary standardization, accessibility polish, mobile breakpoint reconciliation, cron N+1 fix, cache invalidation refinement, RBAC tests, integration test stubs, cache isolation, and a comprehensive final audit are all shipped. 43 sprints delivered. 455 tests passing. Build passes with 0 errors, 0 type errors. `/verify` returns CLEAR. Both `v2-development` and `main` branches are synced.

HEAD: c36344a on main. Build: CLEAR.

A drift check and progress audit before onboarding launch customers revealed a tier of launch-blocking gaps:

| Gap | Current State | Risk |
|-----|--------------|------|
| xlsx HIGH vulnerabilities | 14 npm audit HIGHs — 7 from `xlsx` (SheetJS), abandoned package with no upstream fix. ExcelJS already installed for writing but xlsx still used for reading in 2 files. | npm audit fails. Security review blocks launch. No fix available upstream — must replace package. |
| Remaining transitive HIGHs | 7 additional HIGHs from next/sentry/eslint transitive dependencies. No triage documentation. | Security reviewers see unacknowledged vulnerabilities. No evidence of risk acceptance process. NIST RA-5 gap. |
| Zero React.memo usage | DnD-heavy components (OpportunityCard, SectionCard, KanbanColumn, SwimlaneLane) re-render on every drag event. No memoization anywhere in codebase. | Visible jank during drag-and-drop on boards with 20+ cards. Poor user experience during core workflows. |
| Coverage thresholds at 30% | Thresholds raised to 30% in v1.6 but not increased further. 455 tests should support higher baselines. | Coverage can regress significantly before CI catches it. 30% is below industry launch threshold. |
| No E2E for API routes | 11 existing E2E specs are partial stubs. Zero coverage on `/api/metrics`, `/api/ai/*`, `/api/webhooks/stripe`. No auth gate testing. | API regressions go undetected. Auth bypass bugs could ship to production. |
| No RBAC E2E testing | RBAC unit tests exist (v1.6) but no E2E verification of role-based page access, redirects, or module visibility. | RBAC logic correct in isolation but broken in integration. Partner accessing admin pages undetected. |
| No accessibility E2E | Accessibility improvements in v1.6 (ARIA, landmarks, reduced motion) have no automated regression tests. | Accessibility regressions introduced silently by future changes. WCAG compliance drifts without detection. |
| Unstructured logging gaps | Remaining `console.log/warn/error` in middleware and API route handlers. No request ID propagation. | Production logs lack correlation. Incident debugging requires manual log correlation across requests. |
| No Storybook | Zero component documentation. No interactive component catalog. 25 shared components undocumented. | New developers learn component API by reading source code. No visual regression baseline. Design-dev handoff friction. |
| No OpenAPI specification | 14 API routes with no formal documentation. No schema validation. No auto-generated client types. | API consumers rely on tribal knowledge. No contract testing. Breaking changes go unannounced. |
| No bundle size tracking | No mechanism to detect bundle size regressions. No per-route size budgets. | JavaScript bundle grows silently. Route load times degrade without CI detection. |
| Dark-only UI | Application is dark-only. No light mode. Current `:root` has dark values with no `.dark` class structure. | Users in bright environments strain to read dark UI. No accessibility accommodation for light-preference users. Corporate environments expect light mode. |
| No SEO metadata | No JSON-LD structured data. No OpenGraph tags. No Twitter Card meta. | Marketing site invisible to search engines. Social media shares show generic preview. |

These gaps are blockers for confident public launch with enterprise customers.

### 1.2 Where We're Going

Launch-ready MissionPulse v1.7 that satisfies:
- **Security:** Zero actionable npm audit HIGHs. xlsx replaced with ExcelJS. Remaining transitive risks documented with NIST control mapping.
- **Performance:** React.memo on DnD components. Bundle size tracked with budgets. Measurable re-render reduction.
- **Testing:** 470+ unit tests. 50+ E2E specs. 35%+ line coverage enforced. API route, RBAC, and accessibility E2E tests.
- **Developer Experience:** Storybook with 25 component stories. OpenAPI 3.1 spec for all 14 API routes. Bundle analyzer. JSDoc on all exported props.
- **Theming:** Light + dark mode with user preference toggle. All 177 components render correctly in both themes.
- **Observability:** Structured logging everywhere. Request ID propagation. Zero unstructured console output in production.
- **SEO:** JSON-LD structured data. OpenGraph + Twitter Card meta tags.

### 1.3 Phase Map

| Phase | Sprints | What Ships |
|-------|---------|------------|
| N: Launch Readiness (v1.7) | S44–S47 | xlsx replacement, vulnerability triage, React.memo DnD optimization, coverage raise, API route E2E, RBAC E2E, accessibility E2E, structured logging, Storybook setup + 25 stories, OpenAPI 3.1 spec, bundle size tracking, JSDoc, light mode CSS + toggle, component dark class migration, JSON-LD, final launch audit |

### 1.4 Sprint Cadence

| Parameter | Value |
|-----------|-------|
| Sprint Length | Maximize delivery per sprint. No fixed time constraint. |
| Tickets per Sprint | 4 (packed for throughput) |
| Validation | npm run build must pass for every ticket |
| Branch | All work on v2-development. Merge to main per release. |
| Deploy | Staging auto-deploys on push. Production = manual merge. |
| v1.7 Target | Q2 2026 |

### 1.5 Execution Rules

Same as v1.1/v1.2/v1.3/v1.4/v1.5/v1.6. Additionally:
- 4 new devDependencies permitted — Storybook only (`@storybook/nextjs`, `@storybook/addon-essentials`, `@storybook/addon-a11y`, `@storybook/addon-interactions`)
- 1 new devDependency for bundle analysis: `@next/bundle-analyzer`
- 1 new devDependency for API spec validation: `@redocly/cli`
- 1 new runtime dependency: `next-themes` (lightweight, ~2KB, standard Next.js theming)
- xlsx (SheetJS) is REMOVED — replaced by ExcelJS (already installed) for the 2 remaining read-path files
- All Storybook stories use existing Tailwind + shadcn/ui patterns — no new UI library
- Light mode is additive CSS work — no new theming library beyond `next-themes`
- OpenAPI spec is documentation-only — no runtime code generation

---

## 2. PHASE N: Launch Readiness (v1.7)

Goal: Close every gap between "production-polished" and "launch-ready for enterprise customers." Eliminate security vulnerabilities. Optimize DnD performance. Expand E2E test coverage to API routes, RBAC integration, and accessibility. Add developer experience infrastructure (Storybook, OpenAPI, bundle tracking). Ship light + dark mode theming. When Phase N is done, the application passes `npm audit` with zero actionable HIGHs, all DnD components are memoized, 50+ E2E specs cover critical paths, developers have a Storybook catalog and OpenAPI spec, and users can choose between light and dark themes.

---

### SPRINT 44 — Dependency Security + Performance

*xlsx replacement. Vulnerability triage. DnD memoization. Coverage + hygiene.*

#### T-44.1 Replace xlsx with ExcelJS for Reading

The `xlsx` (SheetJS) package has 7 HIGH vulnerabilities with no upstream fix — the project is abandoned. MissionPulse already has ExcelJS installed for writing Excel files, but 2 files still use `xlsx` for reading: `lib/integrations/data-migration.ts` and `lib/integrations/govwin.ts`. Migrating these 2 files to ExcelJS for reading eliminates the need for `xlsx` entirely.

**Acceptance Criteria:**
- [ ] Identify all `xlsx` imports across the codebase — should be exactly 2 files:
  - `lib/integrations/data-migration.ts`
  - `lib/integrations/govwin.ts`
- [ ] Migrate `lib/integrations/data-migration.ts`:
  - Replace `xlsx.read()` / `xlsx.utils.sheet_to_json()` with ExcelJS `Workbook.xlsx.load()`
  - Map ExcelJS worksheet row iteration to match existing data shape
  - Preserve all existing data transformation logic downstream of the read
  - Verify same output shape for all imported data types
- [ ] Migrate `lib/integrations/govwin.ts`:
  - Replace `xlsx.read()` / `xlsx.utils.sheet_to_json()` with ExcelJS `Workbook.xlsx.load()`
  - Map ExcelJS worksheet row iteration to match existing data shape
  - Preserve NAICS code parsing and opportunity field mapping
  - Verify same output shape for imported GovWin data
- [ ] Remove `xlsx` package: `npm uninstall xlsx`
- [ ] Verify `xlsx` no longer appears in `package.json` or `package-lock.json`
- [ ] Run `npm audit` — all 7 xlsx-related HIGHs should be gone
- [ ] Run existing integration tests — data import paths still work
- [ ] npm run build passes

**Depends on:** None (foundational security fix)
**Files:** lib/integrations/data-migration.ts (modify), lib/integrations/govwin.ts (modify), package.json (modify — remove xlsx)

---

#### T-44.2 Dependency Vulnerability Triage

After removing `xlsx` (T-44.1), remaining HIGHs are transitive dependencies from `next`, `@sentry/nextjs`, and `eslint` — packages where the vulnerability is in a sub-dependency the application doesn't call directly. These cannot be fixed by version bumping. They need to be triaged, risk-assessed, and documented for security reviewers.

**Acceptance Criteria:**
- [ ] Run `npm audit` after T-44.1 xlsx removal — document remaining HIGHs
- [ ] Create `SECURITY_AUDIT.md` at project root:
  - Date of audit
  - npm audit summary (total vulnerabilities by severity)
  - For each remaining HIGH:
    - Package name and path (e.g., `next > postcss > nth-check`)
    - CVE identifier
    - Vulnerability description
    - Whether the vulnerable code path is reachable from MissionPulse
    - Risk assessment: `Accepted`, `Mitigated`, or `Monitoring`
    - NIST control mapping (RA-5 vulnerability scanning, SI-2 flaw remediation)
    - Mitigation notes (e.g., "input never reaches vulnerable parser")
  - Summary: "0 actionable HIGHs — all remaining are transitive, non-reachable, or awaiting upstream fix"
- [ ] Pin any fixable transitive dependencies via `overrides` in `package.json` if safe to do so
- [ ] Run `npm audit` — verify counts match documentation
- [ ] Target: 0 actionable HIGHs (all remaining are documented as accepted risk)
- [ ] npm run build passes

**Depends on:** T-44.1 (xlsx removal — need true vulnerability count after xlsx is gone)
**Files:** SECURITY_AUDIT.md (new), package.json (modify — if overrides needed)

---

#### T-44.3 React.memo on DnD Components

Zero `React.memo` usage exists in the codebase. DnD-heavy components — `OpportunityCard`, `SectionCard`, `KanbanColumn`, `SwimlaneLane` — re-render on every drag event because parent state changes propagate to all children. With 20+ cards on a board, this causes visible jank. Wrapping these with `React.memo` and stabilizing callbacks with `useCallback` prevents unnecessary re-renders during drag operations.

**Acceptance Criteria:**
- [ ] Wrap the following components with `React.memo`:
  - `OpportunityCard` (used in KanbanView — renders per-opportunity)
  - `SectionCard` (used in Swimlane — renders per-section)
  - `KanbanColumn` (used in KanbanView — renders per-stage)
  - `SwimlaneLane` (used in Swimlane — renders per-lane)
- [ ] Add `useCallback` to drag handlers:
  - `KanbanView`: `onDragEnd`, `onDragStart` wrapped in `useCallback`
  - `Swimlane`: `onDragEnd`, `onDragStart` wrapped in `useCallback`
  - Dependencies array includes only values that actually change handler behavior
- [ ] Verify with React DevTools Profiler:
  - Before: all cards re-render on drag of any card
  - After: only dragged card and source/destination columns re-render
  - Document re-render count reduction (screenshot or count)
- [ ] No functional regressions:
  - Kanban drag-and-drop still moves cards between columns
  - Swimlane drag-and-drop still moves sections between lanes
  - Card click handlers still work
  - Card content still updates when data changes
- [ ] npm run build passes

**Depends on:** None (independent performance work)
**Files:** Components containing OpportunityCard, SectionCard, KanbanColumn, SwimlaneLane (modify), KanbanView parent (modify), Swimlane parent (modify)

---

#### T-44.4 Coverage Threshold Raise + Hygiene Sweep

Coverage thresholds were raised to `lines: 30, functions: 25, branches: 20` in v1.6. With 455 tests now in the codebase, actual coverage supports higher thresholds. Additionally, a `<img>` tag in `sync-client.ts` stub is the single valid TODO remaining, and any lingering `as any` casts in test files should be removed.

**Acceptance Criteria:**
- [ ] Run `npm test -- --run --coverage` — document actual coverage percentages
- [ ] `vitest.config.ts` updated:
  - Raise thresholds to `lines: 35, functions: 30, branches: 25` (or actual baseline minus 5%, whichever is higher)
  - Thresholds are enforced in CI (test job fails if coverage drops below)
- [ ] Fix `<img>` → `<Image>` in `sync-client.ts` stub:
  - Replace HTML `<img>` tag with Next.js `<Image>` component
  - Add required `width`, `height`, and `alt` props
  - Resolves the single remaining valid TODO
- [ ] Remove any remaining `as any` casts in test files:
  - Search all test files for `as any`
  - Replace with typed alternatives (`vi.fn<>()` generics, proper interfaces, `satisfies`)
  - Verify mocks still satisfy expected types without `as any`
- [ ] All 455 tests still pass with raised thresholds
- [ ] Coverage does not drop below new thresholds
- [ ] npm run build passes

**Depends on:** None (independent coverage work)
**Files:** vitest.config.ts (modify), sync-client.ts (modify), test files with `as any` (modify)

---

### SPRINT 45 — E2E Test Expansion + Observability

*API route E2E. RBAC integration E2E. Accessibility E2E. Structured logging completion.*

#### T-45.1 API Route E2E Tests

14 API routes exist with zero E2E test coverage. Critical routes — `/api/metrics`, `/api/ai/*`, `/api/webhooks/stripe` — handle sensitive data and financial transactions. Without E2E tests, auth gate bypasses, input validation failures, and response shape regressions go undetected. Expand existing Playwright test stubs into full API route tests.

**Acceptance Criteria:**
- [ ] `tests/e2e/api-metrics.spec.ts` — tests for `/api/metrics`:
  - Unauthenticated request → 401 response
  - Authenticated request → 200 with expected metrics shape
  - Invalid query params → 400 with error message
  - Response includes required fields (opportunity count, compliance score, etc.)
- [ ] `tests/e2e/api-ai.spec.ts` — tests for `/api/ai/*` routes:
  - Unauthenticated request → 401 response
  - Request without required fields → 400 validation error
  - Valid request with mocked AI response → 200 with expected shape
  - Rate limiting headers present in response
  - Token usage tracked in response metadata
- [ ] `tests/e2e/api-webhooks.spec.ts` — tests for `/api/webhooks/stripe`:
  - Missing Stripe signature header → 401 response
  - Invalid signature → 401 response
  - Valid signature + `checkout.session.completed` event → 200
  - Valid signature + unknown event type → 200 (acknowledged but no action)
  - Malformed JSON body → 400
- [ ] All E2E tests use Playwright `request` API for direct HTTP testing
- [ ] External services (AI, Stripe) mocked via MSW or route handler stubs
- [ ] Minimum 15 E2E test cases across all API route test files
- [ ] All tests pass via `npx playwright test`
- [ ] npm run build passes

**Depends on:** None (independent E2E work)
**Files:** tests/e2e/api-metrics.spec.ts (new), tests/e2e/api-ai.spec.ts (new), tests/e2e/api-webhooks.spec.ts (new)

---

#### T-45.2 RBAC + Error Boundary E2E

RBAC unit tests (v1.6 T-43.2) verify permission logic in isolation, but no E2E test verifies that a partner role user is actually redirected away from admin pages, or that an executive role user can access all modules. Error boundary E2E tests verify that production mode shows user-friendly messages (not raw errors) as implemented in v1.6 T-40.3.

**Acceptance Criteria:**
- [ ] `tests/e2e/rbac-access.spec.ts` — RBAC integration tests:
  - Partner role: navigate to `/admin` → redirected to dashboard (not 403)
  - Partner role: sidebar does NOT show admin, settings, or sensitive modules
  - Executive role: navigate to `/admin` → page loads successfully
  - Executive role: sidebar shows all modules including sensitive ones
  - Author role: navigate to `/pipeline` → page loads (has pipeline access)
  - Author role: navigate to `/compliance` → page loads (has compliance read access)
  - Module visibility per role matches `roles_permissions_config.json`
- [ ] `tests/e2e/error-boundary.spec.ts` — Error boundary integration tests:
  - Trigger error on a page → error boundary renders (not white screen)
  - Production mode: error message is generic ("Something went wrong"), NOT raw error
  - Production mode: no stack trace visible to user
  - "Try again" button is present and clickable
  - Error boundary uses correct brand styling (not unstyled HTML)
- [ ] RBAC tests use mock authentication with different role profiles
- [ ] Error boundary tests use route that can trigger controlled errors
- [ ] All tests pass via `npx playwright test`
- [ ] npm run build passes

**Depends on:** None (independent E2E work)
**Files:** tests/e2e/rbac-access.spec.ts (new), tests/e2e/error-boundary.spec.ts (new)

---

#### T-45.3 Accessibility E2E

Accessibility improvements from v1.6 (loading state ARIA, navigation landmarks, reduced motion, focus management) have no automated regression tests. Without E2E accessibility tests, these improvements silently regress with future changes. `@axe-core/playwright` integrates accessibility scanning into the existing Playwright test infrastructure.

**Acceptance Criteria:**
- [ ] Install `@axe-core/playwright` as devDependency (if not already installed)
- [ ] `tests/e2e/accessibility.spec.ts` — axe-core automated tests:
  - Dashboard page: 0 critical violations, 0 serious violations
  - Pipeline page: 0 critical violations, 0 serious violations
  - War Room page: 0 critical violations, 0 serious violations
  - Compliance page: 0 critical violations, 0 serious violations
  - Proposals page: 0 critical violations, 0 serious violations
  - Each test runs full axe-core scan with WCAG 2.1 AA ruleset
- [ ] `tests/e2e/keyboard-navigation.spec.ts` — keyboard interaction tests:
  - DataTable: Tab navigates between rows, Enter activates row action
  - Kanban board: Tab moves between columns, Arrow keys navigate cards
  - Modal: Tab cycles within modal (focus trap), Escape closes
  - Sidebar: Arrow keys navigate between links, Enter activates link
- [ ] Tests output violation details on failure for easy debugging
- [ ] All tests pass via `npx playwright test`
- [ ] npm run build passes

**Depends on:** None (independent E2E work)
**Files:** tests/e2e/accessibility.spec.ts (new), tests/e2e/keyboard-navigation.spec.ts (new), package.json (modify — if @axe-core/playwright not installed)

---

#### T-45.4 Edge Function Structured Logging

Remaining `console.log/warn/error` calls exist in `middleware.ts` and API route handlers, bypassing the structured logger established in v1.6. Additionally, no request ID propagation exists — each log entry is independent, making it impossible to correlate logs from a single user request across middleware → route handler → server action.

**Acceptance Criteria:**
- [ ] Audit all `console.log`, `console.warn`, `console.error` in:
  - `middleware.ts`
  - All files under `app/api/` (route handlers)
  - Document each instance and its current purpose
- [ ] Migrate all remaining console calls to structured logger:
  - Import `logger` from `lib/logging/logger.ts` (or equivalent)
  - Replace `console.log(...)` with `logger('module').info(...)` with context
  - Replace `console.error(...)` with `logger('module').error(...)` with context
  - Replace `console.warn(...)` with `logger('module').warn(...)` with context
  - Exclude `instrumentation.ts` and `instrumentation-client.ts` (Sentry init requires console)
- [ ] Request ID propagation:
  - In `middleware.ts`: generate UUID `requestId` if `x-request-id` header is absent
  - Set `x-request-id` header on request forwarded to route handlers
  - Structured logger includes `requestId` in all log entries when available
  - Response headers include `x-request-id` for client-side correlation
- [ ] Verify: `grep -r "console\." app/api/ middleware.ts` returns 0 results (excluding instrumentation files)
- [ ] npm run build passes

**Depends on:** None (independent logging work)
**Files:** middleware.ts (modify), app/api/**/*.ts (modify — multiple route handlers), lib/logging/logger.ts (modify — add requestId support)

---

### SPRINT 46 — Developer Experience

*Storybook setup. OpenAPI spec. Bundle size tracking. Remaining stories + JSDoc.*

#### T-46.1 Storybook Setup + Core Stories

Zero component documentation exists. 25+ shared components have no interactive catalog, no visual reference, and no usage examples. New developers learn component APIs by reading source code. Storybook provides an interactive component catalog with accessibility auditing, interaction testing, and visual documentation.

**Acceptance Criteria:**
- [ ] Install Storybook devDependencies:
  - `@storybook/nextjs` — Next.js framework integration
  - `@storybook/addon-essentials` — controls, docs, actions, viewport
  - `@storybook/addon-a11y` — accessibility auditing per story
  - `@storybook/addon-interactions` — interaction testing
- [ ] Configure Storybook:
  - `.storybook/main.ts` — stories glob, framework config, addon list
  - `.storybook/preview.ts` — global decorators (Tailwind, dark mode, font)
  - `.storybook/preview-head.html` — load Tailwind CSS + custom fonts
  - Stories directory: `stories/` at project root (or colocated `*.stories.tsx`)
  - Works with Next.js App Router + Tailwind + dark mode CSS variables
- [ ] Write 8 core component stories:
  - `Button.stories.tsx` — all variants (default, destructive, outline, ghost, link), sizes, disabled state
  - `Badge.stories.tsx` — all variants (default, secondary, destructive, outline), custom colors
  - `DataTable.stories.tsx` — with sample data, sorting, search, pagination, empty state
  - `FormModal.stories.tsx` — open/close, form fields, validation errors, submit action
  - `ConfirmModal.stories.tsx` — open/close, confirm action, cancel action, destructive variant
  - `StatusBadge.stories.tsx` — all status types (opportunity, section, compliance), all status values
  - `PhaseIndicator.stories.tsx` — all Shipley phases, progress states, compact variant
  - `ActivityLog.stories.tsx` — with sample activities, date grouping, empty state, loading state
- [ ] Each story has:
  - At least 2 variants (e.g., default + edge case)
  - Storybook Controls for interactive prop editing
  - Accessibility tab shows 0 violations
- [ ] `npm run storybook` starts dev server without errors
- [ ] `npm run build-storybook` completes without errors
- [ ] Add scripts to `package.json`: `"storybook": "storybook dev -p 6006"`, `"build-storybook": "storybook build"`
- [ ] npm run build passes (Next.js build — not affected by Storybook)

**Depends on:** None (foundational DX work)
**Files:** .storybook/main.ts (new), .storybook/preview.ts (new), .storybook/preview-head.html (new), stories/*.stories.tsx (8 new), package.json (modify)

---

#### T-46.2 OpenAPI 3.1 Specification

14 API routes exist with no formal documentation. API consumers (future mobile app, third-party integrations, internal tooling) rely on tribal knowledge of request/response shapes. An OpenAPI 3.1 spec provides machine-readable documentation, enables contract testing, and generates accurate API reference docs.

**Acceptance Criteria:**
- [ ] Create `docs/openapi.yaml` — OpenAPI 3.1 specification:
  - `info`: title, version (1.7.0), description, contact
  - `servers`: staging and production URLs
  - `paths`: all 14 API routes documented:
    - `/api/metrics` — GET, query params, response schema
    - `/api/ai/analyze` — POST, request body, response schema
    - `/api/ai/generate` — POST, request body, response schema
    - `/api/ai/compliance-check` — POST, request body, response schema
    - `/api/ai/risk-assessment` — POST, request body, response schema
    - `/api/webhooks/stripe` — POST, Stripe event body, response
    - `/api/cron/daily` — GET/POST, cron auth, response
    - Remaining routes documented with accurate schemas
  - `components/schemas`: reusable schema definitions for Opportunity, Profile, ComplianceItem, etc.
  - `components/securitySchemes`: Supabase JWT Bearer auth
  - `security`: applied globally (except webhook routes)
  - Each endpoint includes: summary, operationId, parameters, requestBody, responses (200, 400, 401, 500)
- [ ] Install `@redocly/cli` as devDependency
- [ ] Add `npm run docs:api` script: `redocly lint docs/openapi.yaml`
- [ ] `npm run docs:api` passes with 0 errors, 0 warnings
- [ ] Spec validates against OpenAPI 3.1 schema
- [ ] npm run build passes

**Depends on:** None (independent documentation work)
**Files:** docs/openapi.yaml (new), package.json (modify — add script + devDep)

---

#### T-46.3 Bundle Size Tracking

No mechanism exists to detect JavaScript bundle size regressions. A single large import (e.g., importing all of `lodash` instead of `lodash/get`) can add 70KB+ to a route without anyone noticing until users complain about slow loads. `@next/bundle-analyzer` is the standard Next.js tool for visualizing and tracking bundle composition.

**Acceptance Criteria:**
- [ ] Install `@next/bundle-analyzer` as devDependency
- [ ] Configure in `next.config.js`:
  - Wrap config with `withBundleAnalyzer` when `ANALYZE=true`
  - Analyzer opens browser with bundle visualization on `npm run analyze`
- [ ] Add `npm run analyze` script: `ANALYZE=true next build`
- [ ] Create `PERFORMANCE_BASELINE.md` at project root:
  - Date of baseline measurement
  - Per-route JS bundle sizes (gzipped):
    - Dashboard page
    - Pipeline page
    - War Room page
    - Compliance page
    - Proposals page
    - Admin/Settings pages
  - Total first-load JS
  - Total shared chunks
  - Top 5 largest packages by size contribution
  - Budget: flag routes exceeding 200KB gzipped first-load JS
- [ ] Document any routes currently exceeding 200KB budget
- [ ] `npm run analyze` completes and generates report
- [ ] npm run build passes

**Depends on:** None (independent DX work)
**Files:** next.config.js (modify), PERFORMANCE_BASELINE.md (new), package.json (modify — add script + devDep)

---

#### T-46.4 Remaining Storybook Stories + JSDoc

T-46.1 covers 8 core component stories. 17 additional key components need stories: layout components, feature-specific components, and composite components. Additionally, all exported component prop interfaces should have JSDoc documentation for IDE tooltip support and Storybook auto-docs.

**Acceptance Criteria:**
- [ ] Write stories for 17 remaining key components:
  - **Layout:** Toast, Sidebar, MobileNav (3)
  - **Pipeline:** KanbanView, KanbanColumn, OpportunityCard, CreateOpportunityModal (4)
  - **War Room:** Swimlane, SwimlaneLane, SectionCard, TeamManagement (4)
  - **Compliance:** ComplianceMatrix, IronDome (2)
  - **Documents:** DocumentUpload, RequirementsExtraction (2)
  - **Shared:** ErrorDisplay, ViewToggle (2)
- [ ] Each story has:
  - At least 2 variants (default + edge case or empty state)
  - Storybook Controls for interactive prop editing
  - Mock data for components requiring external data
  - Accessibility tab shows 0 violations
- [ ] Add JSDoc to all exported component props interfaces:
  - Every `interface *Props` gets a `/** ... */` doc comment
  - Every prop within the interface gets a `/** ... */` description
  - Focus on the 25 shared/feature components with stories
  - JSDoc appears in IDE tooltips and Storybook auto-docs
- [ ] `npm run storybook` shows all 25 stories without errors
- [ ] `npm run build-storybook` completes without errors
- [ ] npm run build passes

**Depends on:** T-46.1 (Storybook framework must be installed and configured before additional stories)
**Files:** stories/*.stories.tsx (17 new), component files with Props interfaces (modify — add JSDoc)

---

### SPRINT 47 — Light Mode + Launch Audit

*Light mode CSS. Component migration. SEO metadata. Final launch audit.*

#### T-47.1 Light Mode CSS Variables + Toggle

The application is dark-only. Current `:root` CSS variables contain dark theme values — there is no `.dark` class structure. Adding light mode requires restructuring the CSS: move current dark values into `.dark` class, create new light-mode `:root` values, and add a theme toggle component. `next-themes` is the standard Next.js solution for theme management with SSR hydration safety.

**Acceptance Criteria:**
- [ ] Install `next-themes` as runtime dependency
- [ ] Restructure `globals.css` theme variables:
  - New `:root` values: light-mode color palette (white backgrounds, dark text, appropriate accent colors)
  - Move current dark values into `.dark` class
  - All existing CSS variable names stay the same (no rename needed)
  - Variables affected: `--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, etc.
- [ ] Create `ThemeToggle` component:
  - Uses `next-themes` `useTheme()` hook
  - Toggle between light, dark, and system preference
  - Icon indicates current theme (sun/moon/system)
  - Accessible: keyboard operable, `aria-label` describes current state
  - Styled with existing shadcn/ui Button component
- [ ] Wire `ThemeToggle` into layout:
  - Add to Sidebar (bottom section, above user profile)
  - Add to MobileNav (visible on mobile)
  - Wrap root layout with `next-themes` `ThemeProvider`
  - Set `attribute="class"` for Tailwind dark mode compatibility
- [ ] Theme persists across page navigations (next-themes localStorage)
- [ ] No flash of wrong theme on page load (next-themes handles SSR)
- [ ] Verify: toggle to light mode → all CSS variables update to light values
- [ ] Verify: toggle to dark mode → all CSS variables update to dark values (identical to current UI)
- [ ] npm run build passes

**Depends on:** None (foundational theme work)
**Files:** globals.css (modify), components/ui/ThemeToggle.tsx (new), app/(dashboard)/layout.tsx (modify — add ThemeProvider), components/layout/Sidebar.tsx (modify — add toggle), components/layout/MobileNav.tsx (modify — add toggle), package.json (modify — add next-themes)

---

#### T-47.2 Component Dark Class Migration

After T-47.1 establishes the light/dark CSS variable infrastructure, components that use hardcoded dark colors (`bg-gray-900`, `text-white`, `border-gray-800`, `bg-slate-950`, etc.) need to be migrated to CSS variable references or Tailwind `dark:` variants. Without this, these components will look broken in light mode — dark backgrounds on white backgrounds, white text on white backgrounds, etc.

**Acceptance Criteria:**
- [ ] Audit all component files for hardcoded dark colors:
  - Search for: `bg-gray-900`, `bg-gray-800`, `bg-slate-900`, `bg-slate-950`, `bg-zinc-900`
  - Search for: `text-white`, `text-gray-100`, `text-gray-200`, `text-gray-300`
  - Search for: `border-gray-800`, `border-gray-700`, `border-slate-800`
  - Search for: `bg-[#00050F]` (brand navy hardcoded)
  - Document every occurrence with file path and line number
- [ ] Replace hardcoded colors with theme-aware alternatives:
  - `bg-gray-900` → `bg-background` (uses CSS variable)
  - `text-white` → `text-foreground` (uses CSS variable)
  - `border-gray-800` → `border-border` (uses CSS variable)
  - Or use `dark:` variants: `bg-white dark:bg-gray-900`
  - Brand navy `#00050F` → CSS variable `--brand-navy` with light equivalent
- [ ] Target: all 177 components render correctly in both themes:
  - Light mode: readable text, appropriate contrast, no invisible elements
  - Dark mode: identical to current production appearance (no regression)
- [ ] Verify top 10 pages in both themes (visual spot-check):
  - Dashboard, Pipeline, War Room, Compliance, Proposals
  - Settings, Admin, Documents, Team, Activity
- [ ] No text-on-same-background-color issues in either theme
- [ ] npm run build passes

**Depends on:** T-47.1 (light mode CSS variables and ThemeProvider must be in place)
**Files:** Multiple component files across components/ and app/ directories (modify — potentially 50+ files)

---

#### T-47.3 JSON-LD Structured Data

No structured data or social media meta tags exist. Search engines index the marketing site with generic metadata. Social media shares show a default preview with no title, description, or image. JSON-LD structured data and OpenGraph/Twitter Card tags improve SEO and social sharing appearance.

**Acceptance Criteria:**
- [ ] Add JSON-LD `SoftwareApplication` schema to root layout:
  - `@type`: "SoftwareApplication"
  - `name`: "MissionPulse"
  - `applicationCategory`: "BusinessApplication"
  - `description`: GovCon proposal management description
  - `operatingSystem`: "Web"
  - `offers`: pricing info (if applicable) or "Contact for pricing"
  - Rendered via `<script type="application/ld+json">` in `<head>`
- [ ] Add JSON-LD `Organization` schema:
  - `@type`: "Organization"
  - `name`: "Mission Meets Tech, LLC"
  - `url`: company website
  - `logo`: company logo URL
- [ ] Add OpenGraph meta tags to `layout.tsx` metadata export:
  - `og:title`: "MissionPulse — GovCon Proposal Management"
  - `og:description`: compelling description
  - `og:type`: "website"
  - `og:image`: social sharing image (1200x630)
  - `og:url`: canonical URL
- [ ] Add Twitter Card meta tags:
  - `twitter:card`: "summary_large_image"
  - `twitter:title`: matches og:title
  - `twitter:description`: matches og:description
  - `twitter:image`: matches og:image
- [ ] Validate JSON-LD with Google Rich Results Test
- [ ] Validate OpenGraph with Facebook Sharing Debugger URL format
- [ ] npm run build passes

**Depends on:** None (independent SEO work)
**Files:** app/layout.tsx (modify — add metadata + JSON-LD script)

---

#### T-47.4 CHANGELOG v1.7.0 + Final Launch Audit

The capstone sweep before declaring v1.7 launch-ready. Update CHANGELOG with v1.7.0 release notes. Run all verification checks. Verify Storybook builds. Bump package.json version. Confirm the application is ready for enterprise launch.

**Acceptance Criteria:**
- [ ] CHANGELOG update — add v1.7.0 (Launch Readiness) section to CHANGELOG.md:
  - **Added:** Storybook (25 stories), OpenAPI 3.1 spec, bundle size tracking, light mode + ThemeToggle, JSON-LD structured data, OpenGraph/Twitter Card meta, SECURITY_AUDIT.md, PERFORMANCE_BASELINE.md, request ID propagation, 7 new E2E test files
  - **Changed:** xlsx replaced with ExcelJS for reading, DnD components memoized (React.memo + useCallback), coverage thresholds raised to 35/30/25, all hardcoded dark colors migrated to CSS variables, structured logging in all API routes and middleware
  - **Removed:** `xlsx` (SheetJS) package — 7 HIGH vulnerabilities eliminated
  - **Security:** 0 actionable npm audit HIGHs, vulnerability triage documented per NIST RA-5/SI-2
  - **Performance:** React.memo on 4 DnD components, bundle size budgets established
  - **Accessibility:** axe-core E2E tests on 5 pages, keyboard navigation E2E tests
  - **Developer Experience:** Storybook with 25 stories, OpenAPI spec for 14 routes, JSDoc on all component props, bundle analyzer
- [ ] Bump `package.json` version to `"1.7.0"`
- [ ] Final verification:
  - `npm run lint` — 0 warnings
  - `npm run typecheck` — 0 errors (production)
  - `npm run typecheck:tests` — 0 errors (test files)
  - `npm test -- --run` — all tests pass (470+)
  - `npm run build` — 0 errors
  - `npm audit` — 0 actionable HIGHs
  - `npm run build-storybook` — completes without errors
  - `npm run docs:api` — OpenAPI spec validates
  - No Sentry warnings in build output
  - `/verify` returns CLEAR
- [ ] npm run build passes

**Depends on:** All S44–S47 tickets complete (final audit verifies everything)
**Files:** CHANGELOG.md (modify), package.json (modify — version bump)

---

## 3. New Dependencies

**7 new dependencies — 6 devDeps (Storybook + tooling) + 1 runtime (next-themes).**

| Package | Sprint | Purpose | Dev Only? |
|---------|--------|---------|-----------|
| `@storybook/nextjs` | S46 (T-46.1) | Next.js Storybook framework | Yes |
| `@storybook/addon-essentials` | S46 (T-46.1) | Storybook controls, docs, actions | Yes |
| `@storybook/addon-a11y` | S46 (T-46.1) | Storybook accessibility auditing | Yes |
| `@storybook/addon-interactions` | S46 (T-46.1) | Storybook interaction testing | Yes |
| `@next/bundle-analyzer` | S46 (T-46.3) | Bundle size visualization | Yes |
| `@redocly/cli` | S46 (T-46.2) | OpenAPI spec validation | Yes |
| `next-themes` | S47 (T-47.1) | Light/dark mode management | No (~2KB) |

**1 package removed:**

| Package | Sprint | Reason |
|---------|--------|--------|
| `xlsx` (SheetJS) | S44 (T-44.1) | 7 HIGH vulnerabilities, abandoned, replaced by ExcelJS (already installed) |

Total: +7 new, -1 removed. Net: +6 dependencies.

---

## 4. Dependency Chain

| Ticket | Blocks | Risk |
|--------|--------|------|
| T-44.1 (xlsx replacement) | T-44.2 (vulnerability triage — need xlsx gone to see true audit count) | Must complete xlsx removal before triage can accurately count remaining HIGHs. 2-file migration, low risk. |
| T-44.4 (coverage raise) | T-45.1–T-45.3 (more E2E tests support higher thresholds going forward) | Higher thresholds set the bar; new E2E tests prevent future regression. Not a hard blocker but sequenced for accuracy. |
| T-46.1 (Storybook setup) | T-46.4 (remaining stories require Storybook framework to be installed and configured) | Hard dependency — cannot write stories without Storybook installed. T-46.1 is foundational for T-46.4. |
| T-47.1 (light mode CSS) | T-47.2 (component dark class migration needs CSS variable infrastructure and ThemeProvider) | Hard dependency — migrating components to CSS variables requires those variables to exist in both themes. |
| T-47.4 (final audit) | None (capstone) | Depends on all other tickets. Runs verification across everything delivered in Phase N. |

---

## 5. Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| xlsx → ExcelJS migration changes data shape | Data import produces different results, breaking downstream processing | Low | ExcelJS read API is well-documented. Both libraries parse to rows/cells. Write migration test comparing old vs new output for same input file. |
| React.memo breaks component updates | Memoized components don't re-render when they should (stale props) | Medium | Use React DevTools to verify re-renders happen on actual prop changes. Test drag-and-drop end-to-end. Shallow comparison is safe for primitive props — only wrap components with stable prop shapes. |
| Storybook build conflicts with Next.js | Framework incompatibility, Tailwind not loading, CSS variable issues | Medium | `@storybook/nextjs` is purpose-built for Next.js. Follow official setup guide. Test `npm run build` (Next.js) and `npm run build-storybook` independently — they should not interfere. |
| Light mode introduces visual regressions | Text invisible on backgrounds, contrast failures, brand colors look wrong | High | Start with CSS variables (T-47.1) — dark mode stays identical. Migrate components incrementally (T-47.2). Visual spot-check top 10 pages. Use axe-core to catch contrast failures. |
| Component dark class migration is larger than estimated | 50+ files need changes; some components have deeply nested hardcoded colors | Medium | Prioritize pages over components. Start with shared components (components/ui/), then feature components, then page-level styles. Accept partial migration if time-constrained — dark mode still works. |
| OpenAPI spec drifts from actual API | Spec documents one shape, API returns different shape | Medium | Add `npm run docs:api` to CI. Manual review of spec against each route handler. Future: add contract testing to verify spec matches runtime responses. |
| Bundle analyzer adds build time | `ANALYZE=true` build is slower due to bundle analysis | Low | Analyzer only runs when `ANALYZE=true` env var is set. Normal `npm run build` is unaffected. `npm run analyze` is an on-demand developer tool. |
| E2E test flakiness from external service mocking | Mocked AI/Stripe responses don't match real API behavior | Medium | Use MSW (Mock Service Worker) for reliable HTTP mocking. Pin mock response shapes to known API versions. Mark flaky tests for review rather than disabling. |
| Coverage threshold too aggressive | CI fails on PRs that don't add tests, blocking legitimate changes | Low | Set thresholds 5% below actual measured coverage. Thresholds are floors, not targets. If actual is 40%, set threshold to 35%. |
| next-themes flash of unstyled content | Light/dark theme flickers on page load before hydration | Low | `next-themes` specifically solves this with a blocking `<script>` that sets the theme class before React hydrates. Follow official setup — no custom SSR logic needed. |

---

## 6. Sprint Summary

| Sprint | Theme | Tickets | New Files | Modified Files | New Dependencies |
|--------|-------|---------|-----------|----------------|-----------------|
| S44 | Dependency Security + Performance | 4 (T-44.1–T-44.4) | 1 | 8+ | 0 (-1 removed) |
| S45 | E2E Test Expansion + Observability | 4 (T-45.1–T-45.4) | 5 | 15+ | 0 |
| S46 | Developer Experience | 4 (T-46.1–T-46.4) | 30+ | 20+ | 6 (devDeps) |
| S47 | Light Mode + Launch Audit | 4 (T-47.1–T-47.4) | 2 | 60+ | 1 (runtime) |
| **Total** | | **16** | **38+** | **103+** | **7 (+7, -1 xlsx)** |

---

## 7. Test Count Projection

| Metric | Start (v1.6) | End (v1.7) | Delta |
|--------|-------------|------------|-------|
| Unit tests (Vitest) | 455 | 470+ | +15 |
| E2E specs (Playwright) | 35 | 50+ | +15 |
| Storybook stories | 0 | 25 | +25 |
| Line coverage enforced | 30% | 35%+ | +5% |
| npm audit actionable HIGHs | 14 | 0 | -14 |
| React.memo components | 0 | 4 | +4 |
| Components with JSDoc | 0 | 25+ | +25 |
| API routes documented | 0 | 14 | +14 |

---

## 8. What Phase N Is NOT

To prevent scope creep, these capabilities are explicitly **out of scope** for v1.7:

| Capability | Why Not v1.7 | When |
|------------|-------------|------|
| New features or modules | Phase N is launch readiness. Zero new user-facing features. | v2.0 |
| Database migrations or schema changes | No schema work in a readiness phase. | v2.0 |
| Visual regression testing (Chromatic, Percy) | Screenshot comparison is new infrastructure beyond Storybook. | v2.0 |
| Contract testing (API spec ↔ runtime) | OpenAPI spec is documentation-only for v1.7. Runtime validation is v2.0. | v2.0 |
| Server-side rendering optimization | SSR performance is stable. APM profiling is infrastructure work. | Infrastructure sprint |
| Internationalization (i18n) | Translation is a new feature, not launch readiness. | v2.0 |
| Multi-region deployment | Infrastructure concern beyond code readiness. | Infrastructure sprint |
| 100% test coverage | 35% enforced floor with critical paths covered. Full coverage is ongoing. | Continuous |
| Custom Storybook addons | Vanilla Storybook with standard addons is sufficient for launch. | If needed |
| Design system tokens (Figma sync) | CSS variables are sufficient. Token sync is design infrastructure. | v2.0 |
| PWA / offline support | Offline capability is a new feature, not readiness. | v2.0 |
| API versioning | No public API consumers yet. | When API goes public |

---

**PROPRIETARY — Mission Meets Tech, LLC — February 2026**
