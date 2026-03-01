# MissionPulse v1.8 Roadmap — Scale Readiness

**From Launch-Ready to Scale-Ready**
4 Sprints • 16 Tickets • Phase O

Supersedes nothing — extends ROADMAP_v1_7_LAUNCH_READINESS.md (S44–S47)
Sprint numbering continues from S47. Ticket numbering continues from T-47.4.
Depends on: All prior sprints complete. Build: 0 errors, 0 type errors. `/verify` returns CLEAR with 455+ tests.

**PROPRIETARY — Mission Meets Tech, LLC — March 2026**

---

## 1. Strategic Overview

### 1.1 Where We Are

v1.7 is complete. Light/dark theme infrastructure (CSS variables, `next-themes`, `ThemeToggle`), Storybook framework (12 stories), OpenAPI 3.1 spec, bundle size tracking, JSON-LD structured data, xlsx replacement, React.memo DnD optimization, structured logging, and 50+ E2E specs are all shipped. 47 sprints delivered. 455+ tests passing. Build passes with 0 errors, 0 type errors. `/verify` returns CLEAR. Both `v2-development` and `main` branches are synced.

HEAD: a13da89 on main. Build: CLEAR.

A post-ship audit of v1.7 reveals a tier of scale-blocking gaps:

| Gap | Current State | Risk |
|-----|--------------|------|
| 42 files with hardcoded dark colors | v1.7 migrated 9 layout components to CSS variables but left all feature components and page files untouched. 410+ instances of `bg-[#00050F]`, `bg-gray-900`, `text-white`, etc. remain. | Light mode is technically available but renders incorrectly on most pages. White text on white backgrounds, dark cards on light backgrounds. Users who toggle to light mode see a broken UI. |
| 105+ components lack Storybook stories | 12 stories exist out of 117 feature components. Storybook framework is configured but catalog is ~10% complete. | New developers have no visual component reference for 90% of the codebase. No visual regression baseline for most components. |
| No Zod validation on API request bodies | Auth checks exist on all API routes but request payloads are unvalidated. Any JSON body is passed directly to processing logic. | Malformed or malicious payloads bypass auth and reach business logic. Type coercion bugs, missing required fields, and injection vectors are undetected at the API boundary. OWASP A03:2021 Injection risk. |
| DnD components lack accessibility | `KanbanView` and `SwimlaneBoard` have zero ARIA attributes. No keyboard navigation for drag-and-drop operations. No screen reader announcements during drag. | Keyboard-only users cannot reorder pipeline cards or document sections. Screen reader users have no awareness of drag-and-drop interactions. WCAG 2.1 AA non-compliance for core workflows. |
| 35% test coverage thresholds | Thresholds raised to 35/30/25 in v1.7 but only 1 feature component test file exists. Most feature components are untested. | Coverage can regress significantly before CI catches it. Feature component bugs ship undetected. 35% is below industry standard for enterprise software. |
| 14 routes exceed 200kB budget | Recharts is the primary contributor — analytics pages at 289-293kB gzipped. No dynamic imports for chart libraries. | Analytics pages load 120kB+ of chart code eagerly. First meaningful paint delayed by large bundle. Mobile users on slow connections experience long load times. |
| CI lacks bundle + accessibility enforcement | CI workflow has 6 jobs but no bundle size gate, no accessibility testing, and no Storybook build verification. | Bundle regressions, accessibility violations, and broken Storybook stories go undetected in PRs. Quality gates exist locally but are not enforced in the merge pipeline. |

These gaps block confident scaling to enterprise customers with accessibility requirements, performance SLAs, and security review processes.

### 1.2 Where We're Going

Scale-ready MissionPulse v1.8 that satisfies:
- **Theming:** Complete theme migration — all 42 remaining files migrated to CSS variable tokens. Light mode renders correctly on every page and component. Zero hardcoded dark colors.
- **Accessibility:** DnD components (Kanban, Swimlane) fully accessible — ARIA attributes, keyboard navigation, screen reader announcements. axe-core audit passes with 0 critical/serious violations.
- **API Hardening:** Zod validation on all POST/PUT/DELETE API route request bodies. Structured 400 errors with validation details. Defense-in-depth at the API boundary.
- **Testing:** 490+ unit tests. 55+ E2E specs. 45%+ line coverage enforced. 30+ new feature component test cases.
- **Performance:** Analytics pages under 200kB via recharts lazy loading. Dynamic imports with loading skeletons.
- **Developer Experience:** 42+ Storybook stories (12 existing + 30 new). CI enforces bundle size, accessibility, and Storybook build.
- **CI/CD:** Bundle size gate (250kB gzipped per route), accessibility E2E in CI, Storybook build verification.

### 1.3 Phase Map

| Phase | Sprints | What Ships |
|-------|---------|------------|
| O: Scale Readiness (v1.8) | S48–S51 | Complete theme migration (42 files, 410+ instances), DnD accessibility (ARIA + keyboard + screen reader), Zod API validation, 30+ feature component tests, coverage raise to 45%, recharts lazy loading, 30 new Storybook stories, CI bundle + accessibility + Storybook gates, final audit |

### 1.4 Sprint Cadence

| Parameter | Value |
|-----------|-------|
| Sprint Length | Maximize delivery per sprint. No fixed time constraint. |
| Tickets per Sprint | 4 (packed for throughput) |
| Validation | npm run build must pass for every ticket |
| Branch | All work on main. |
| Deploy | Staging auto-deploys on push. Production = manual merge. |
| v1.8 Target | Q2 2026 |

### 1.5 Execution Rules

Same as v1.1/v1.2/v1.3/v1.4/v1.5/v1.6/v1.7. Additionally:
- **0 new npm dependencies** — all required packages are already installed (Zod, Storybook, axe-core, next/dynamic, etc.)
- Theme migration is mechanical: `bg-[#00050F]` → `bg-background`, `text-white` → `text-foreground`, `bg-gray-900` → `bg-card`
- DnD accessibility uses `@hello-pangea/dnd` built-in announce callbacks — no new DnD library
- Recharts lazy loading uses `next/dynamic` with `{ ssr: false }` — no new loader library
- All new Storybook stories use existing Tailwind + shadcn/ui patterns — no new UI library
- Test fixtures are plain TypeScript objects — no test data generation library
- CI enhancements modify existing `.github/workflows/ci.yml` — no new CI tool

---

## 2. PHASE O: Scale Readiness (v1.8)

Goal: Complete the theme migration started in v1.7, harden the API layer with request validation, add accessibility to interactive DnD components, raise test coverage with feature component tests, expand Storybook to 42+ stories, optimize bundle size with lazy loading, and enforce quality gates in CI. When Phase O is done, every page renders correctly in both light and dark themes, all DnD interactions are keyboard-accessible with screen reader support, API routes reject malformed input at the boundary, 45%+ line coverage is enforced, and CI blocks regressions in bundle size, accessibility, and Storybook build.

---

### SPRINT 48 — Theme Variable Migration: Pages

*Auth pages. Dashboard pages. Pipeline detail pages. Admin + remaining pages.*

All 42 remaining files with hardcoded dark colors need migration to CSS variable tokens. Sprint 48 handles page files (`app/` directory); Sprint 49 handles feature components. The migration pattern is consistent:

| Hardcoded Class | CSS Variable Replacement |
|----------------|------------------------|
| `bg-[#00050F]` | `bg-background` |
| `bg-[#0F172A]` / `bg-gray-900` | `bg-card` |
| `text-white` | `text-foreground` |
| `text-gray-400` / `text-gray-500` | `text-muted-foreground` |
| `border-gray-800` / `border-gray-700` | `border-border` |
| `text-[#00E5FA]` | `text-primary` |
| `bg-gray-800` | `bg-muted` |

#### T-48.1 Auth + Public Pages Theme Migration

Migrate auth pages (`login/page.tsx`, `signup/page.tsx`, `forgot-password/page.tsx`, `reset-password/page.tsx`, `mfa/page.tsx`, `(auth)/layout.tsx`) and public marketing pages (`8a-toolkit/page.tsx`, `plans/page.tsx`, `app/page.tsx`) from hardcoded hex/gray classes to CSS variable tokens. The public layout was already migrated in v1.7 — these are the page-level files that still have hardcoded colors.

**Acceptance Criteria:**
- [ ] Migrate all hardcoded dark color classes in auth pages:
  - `app/(auth)/login/page.tsx`
  - `app/(auth)/signup/page.tsx`
  - `app/(auth)/forgot-password/page.tsx`
  - `app/(auth)/reset-password/page.tsx`
  - `app/(auth)/mfa/page.tsx`
  - `app/(auth)/layout.tsx`
- [ ] Migrate all hardcoded dark color classes in public pages:
  - `app/(public)/8a-toolkit/page.tsx` (or equivalent path)
  - `app/(public)/plans/page.tsx`
  - `app/page.tsx` (root marketing page)
- [ ] Pattern applied consistently:
  - `bg-[#00050F]` → `bg-background`
  - `text-white` → `text-foreground`
  - `text-gray-400` → `text-muted-foreground`
  - `border-gray-800` → `border-border`
  - `text-[#00E5FA]` → `text-primary`
  - `bg-gray-900` → `bg-card`
- [ ] All auth pages render correctly in both light and dark themes
- [ ] All public pages render correctly in both light and dark themes
- [ ] Zero hardcoded hex color classes remain in these files
- [ ] npm run build passes

**Depends on:** None (foundational page migration)
**Files:** 9 page/layout files in `app/(auth)/` and `app/(public)/` and `app/page.tsx`

---

#### T-48.2 Dashboard Core Pages Theme Migration

Migrate core dashboard pages from hardcoded dark color classes to CSS variable tokens. These are the most-visited pages in the application and the first pages enterprise evaluators see after login.

**Acceptance Criteria:**
- [ ] Migrate all hardcoded dark color classes in core dashboard pages:
  - `app/(dashboard)/dashboard/page.tsx`
  - `app/(dashboard)/pipeline/page.tsx`
  - `app/(dashboard)/war-room/page.tsx`
  - `app/(dashboard)/proposals/page.tsx`
  - `app/(dashboard)/strategy/page.tsx`
  - `app/(dashboard)/capacity/page.tsx`
  - `app/(dashboard)/help/page.tsx`
  - `app/(dashboard)/workflow/page.tsx`
- [ ] Same migration pattern as T-48.1 applied consistently
- [ ] All core dashboard pages render correctly in both light and dark themes
- [ ] Verified by visual inspection: toggle to light mode → readable text, appropriate contrast, no invisible elements
- [ ] Dark mode appearance is identical to current production (no regression)
- [ ] npm run build passes

**Depends on:** None (independent page migration — same sprint as T-48.1)
**Files:** ~8 page files in `app/(dashboard)/`

---

#### T-48.3 Pipeline Detail Sub-Pages Theme Migration

Migrate all 12 pipeline detail pages under `app/(dashboard)/pipeline/[id]/`. These pages are the core workflow for opportunity management — proposal managers spend the majority of their time in these views.

**Acceptance Criteria:**
- [ ] Migrate all hardcoded dark color classes in pipeline detail pages:
  - `app/(dashboard)/pipeline/[id]/page.tsx`
  - `app/(dashboard)/pipeline/[id]/amendments/page.tsx`
  - `app/(dashboard)/pipeline/[id]/gate-reviews/page.tsx`
  - `app/(dashboard)/pipeline/[id]/intel/page.tsx`
  - `app/(dashboard)/pipeline/[id]/interview-prep/page.tsx`
  - `app/(dashboard)/pipeline/[id]/orals/page.tsx`
  - `app/(dashboard)/pipeline/[id]/pricing/page.tsx`
  - `app/(dashboard)/pipeline/[id]/qa/page.tsx`
  - `app/(dashboard)/pipeline/[id]/risks/page.tsx`
  - `app/(dashboard)/pipeline/[id]/sections/page.tsx`
  - `app/(dashboard)/pipeline/[id]/volumes/page.tsx`
  - `app/(dashboard)/pipeline/[id]/compliance/page.tsx`
- [ ] Same migration pattern as T-48.1 applied consistently
- [ ] All 12 pipeline detail pages render correctly in both light and dark themes
- [ ] No hardcoded hex values remain in any pipeline detail page file
- [ ] npm run build passes

**Depends on:** None (independent page migration — same sprint as T-48.1/T-48.2)
**Files:** 12 page files in `app/(dashboard)/pipeline/[id]/`

---

#### T-48.4 Admin + Remaining Dashboard Pages Theme Migration

Migrate admin pages and all remaining dashboard pages that were not covered by T-48.2 and T-48.3. This ticket completes the page-level theme migration — after T-48.4, zero hardcoded dark color classes remain in any `app/` page file.

**Acceptance Criteria:**
- [ ] Migrate all hardcoded dark color classes in admin pages:
  - `app/(dashboard)/admin/approval-workflows/page.tsx`
  - `app/(dashboard)/admin/integrations/page.tsx`
  - `app/(dashboard)/admin/question-bank/page.tsx`
- [ ] Migrate all hardcoded dark color classes in remaining dashboard pages:
  - `app/(dashboard)/ai/page.tsx`
  - `app/(dashboard)/blackhat/page.tsx`
  - `app/(dashboard)/debriefs/page.tsx`
  - `app/(dashboard)/feedback/page.tsx`
  - `app/(dashboard)/partners/page.tsx`
  - `app/(dashboard)/personnel/page.tsx`
  - `app/(dashboard)/past-performance/page.tsx`
  - `app/(dashboard)/pricing/page.tsx`
  - `app/(dashboard)/subcontractors/page.tsx`
  - `app/(dashboard)/win-loss/page.tsx`
  - `app/(dashboard)/integrations/usaspending/page.tsx`
- [ ] Same migration pattern as T-48.1 applied consistently
- [ ] All admin and remaining dashboard pages render correctly in both themes
- [ ] **Verification gate:** `grep -rn "bg-\[#00050F\]\|bg-\[#0F172A\]\|bg-gray-900" app/ --include="*.tsx"` returns 0 matches (excluding intentional brand references in non-rendered constants)
- [ ] Zero hardcoded dark color classes remain in any `app/` page file
- [ ] npm run build passes

**Depends on:** None (independent page migration — same sprint as T-48.1–T-48.3)
**Files:** ~15 page files in `app/(dashboard)/admin/` and remaining `app/(dashboard)/` directories

---

### SPRINT 49 — Theme Variable Migration: Components + Accessibility

*Pipeline components. Admin + analytics components. Remaining components + Tailwind cleanup. DnD accessibility.*

#### T-49.1 Pipeline + Swimlane Feature Components Theme Migration

Migrate all components in the pipeline and swimlane feature directories from hardcoded dark color classes to CSS variable tokens. These are the most interactive components in the application — drag-and-drop boards, opportunity cards, section cards, and compliance views.

**Acceptance Criteria:**
- [ ] Migrate all hardcoded dark color classes in pipeline components:
  - All files in `components/features/pipeline/`
  - All files in `components/features/swimlane/`
  - All files in `components/features/compliance/`
  - Pipeline-related client components in `app/(dashboard)/pipeline/` (KanbanView, ViewToggle, CreateOpportunityButton, etc.)
- [ ] ~15 component files migrated
- [ ] Same migration pattern applied consistently:
  - `bg-[#00050F]` → `bg-background`
  - `bg-gray-900` / `bg-gray-800` → `bg-card` / `bg-muted`
  - `text-white` → `text-foreground`
  - `text-gray-400` → `text-muted-foreground`
  - `border-gray-800` → `border-border`
- [ ] All pipeline and swimlane components render correctly in both themes
- [ ] Kanban drag-and-drop still functions correctly after migration
- [ ] Swimlane drag-and-drop still functions correctly after migration
- [ ] npm run build passes

**Depends on:** T-48.1–T-48.4 (page theme migration establishes patterns; components should follow page conventions)
**Files:** ~15 component files in `components/features/pipeline/`, `components/features/swimlane/`, `components/features/compliance/`, `app/(dashboard)/pipeline/`

---

#### T-49.2 Admin + Integration + Analytics Components Theme Migration

Migrate admin, integration, analytics, and module components from hardcoded dark color classes to CSS variable tokens. These components power the settings, AI configuration, and analytics views.

**Acceptance Criteria:**
- [ ] Migrate all hardcoded dark color classes in:
  - All files in `components/features/admin/`
  - All files in `components/features/integrations/`
  - All files in `components/features/analytics/`
  - All files in `components/modules/` (ActivityFeed, AdminUserList, SettingsForm, etc.)
- [ ] ~18 component files migrated
- [ ] Same migration pattern applied consistently
- [ ] All admin, integration, and analytics components render correctly in both themes
- [ ] Settings forms, integration configs, and analytics charts maintain readability in light mode
- [ ] npm run build passes

**Depends on:** T-48.1–T-48.4 (page theme migration establishes patterns)
**Files:** ~18 component files in `components/features/admin/`, `components/features/integrations/`, `components/features/analytics/`, `components/modules/`

---

#### T-49.3 Remaining Components + Tailwind Config Cleanup

Migrate all remaining feature components and auth form components. Clean up `tailwind.config.ts` to remove duplicated hardcoded color values that are now served by CSS variables. This ticket completes the component-level theme migration — after T-49.3, zero hardcoded dark color classes remain in any component file.

**Acceptance Criteria:**
- [ ] Migrate all hardcoded dark color classes in remaining components:
  - All files in `components/features/proposals/`
  - All files in `components/features/pricing/`
  - All files in `components/features/onboarding/`
  - All files in `components/features/dashboard/`
  - All files in `components/features/settings/`
  - All files in `components/marketing/`
  - Auth form components: `LoginForm`, `SignupForm`, `ForgotPasswordForm`, `ResetPasswordForm`
- [ ] ~15 component files migrated
- [ ] Clean up `tailwind.config.ts`:
  - Remove duplicated hardcoded color values that are now served by CSS variables (e.g., `navy: '#00050F'` in theme extend)
  - Keep brand constants only where needed for logo/accent rendering in non-themed contexts
  - Use CSS variable references where appropriate
- [ ] **Verification gate:** `grep -rn "bg-\[#00050F\]\|bg-\[#0F172A\]\|bg-gray-900\|text-white" components/ --include="*.tsx"` returns 0 matches
- [ ] All remaining components render correctly in both themes
- [ ] Tailwind config is clean — no unnecessary duplicated color definitions
- [ ] npm run build passes

**Depends on:** T-48.1–T-48.4 (page theme migration establishes patterns)
**Files:** ~15 component files + `tailwind.config.ts`

---

#### T-49.4 DnD Accessibility — Kanban + Swimlane

Add ARIA attributes, keyboard navigation, and screen reader announcements to `KanbanView` and `SwimlaneBoard`. These are core workflow components — proposal managers reorder pipeline opportunities and document sections via drag-and-drop. Without accessibility support, keyboard-only and screen reader users cannot perform these essential operations.

**Acceptance Criteria:**
- [ ] Add ARIA attributes to `KanbanView.tsx`:
  - `role="region"` and `aria-label` on the Kanban board container
  - `aria-label` on each column (e.g., "Prospect stage, 5 opportunities")
  - `aria-describedby` on each draggable opportunity card with usage instructions
  - `aria-live="polite"` on a status region for drag announcements
- [ ] Add ARIA attributes to `SwimlaneBoard.tsx`:
  - `role="region"` and `aria-label` on the Swimlane board container
  - `aria-label` on each lane (e.g., "Draft lane, 3 sections")
  - `aria-describedby` on each draggable section card with usage instructions
  - `aria-live="polite"` on a status region for drag announcements
- [ ] Add keyboard navigation support:
  - Enter/Space to pick up a draggable item
  - Arrow keys to move between positions
  - Escape to cancel drag
  - Tab to navigate between draggable items
- [ ] Add `@hello-pangea/dnd` announce callbacks:
  - `onDragStart` → "Picked up [item name]. Use arrow keys to move."
  - `onDragUpdate` → "Moved to [column/lane name], position [n] of [total]."
  - `onDragEnd` → "Dropped [item name] in [column/lane name]." or "Drag cancelled."
  - Announcements visible in aria-live region for screen readers
- [ ] Kanban and Swimlane pass axe-core audit with 0 critical/serious violations
- [ ] Items can be reordered using keyboard only (no mouse required)
- [ ] Screen reader announces drag start, move, and drop operations
- [ ] Mouse drag-and-drop still functions correctly (no regression)
- [ ] npm run build passes

**Depends on:** T-49.1–T-49.3 (accessibility work needs theme-clean components to avoid mixing concerns)
**Files:** `app/(dashboard)/pipeline/KanbanView.tsx`, `components/features/swimlane/SwimlaneBoard.tsx`

---

### SPRINT 50 — API Hardening + Test Coverage

*Zod API validation. Feature component tests. Coverage raise. Recharts lazy loading.*

#### T-50.1 Zod Request Body Validation for API Routes

All mutation API routes (POST/PUT/DELETE) accept request bodies without validation. Auth checks exist — unauthenticated requests are rejected — but authenticated users can send malformed or malicious JSON payloads that pass directly to business logic. Zod is already installed and used for form validation on the client side. Extending it to API route request bodies provides defense-in-depth at the server boundary.

**Acceptance Criteria:**
- [ ] Create `lib/api/schemas.ts` with shared validation schemas:
  - Schemas for each API route's expected request body
  - Reuse existing Zod schemas from `lib/utils/validation.ts` where applicable
  - Export a `validateRequestBody<T>` helper that:
    - Parses `request.json()` against a Zod schema
    - Returns `{ data: T }` on success
    - Returns `{ error: string, details: ZodError }` on validation failure
- [ ] Wrap all POST/PUT/DELETE API route handlers with request body validation:
  - Validate `request.json()` against route-specific Zod schema before processing
  - Return 400 status with `{ error: string, details: ZodError }` on validation failure
  - Processing logic only receives validated, typed data
- [ ] Apply validation to all mutation API routes (8-10 files in `app/api/`):
  - AI routes: `/api/ai/analyze`, `/api/ai/generate`, `/api/ai/compliance-check`, `/api/ai/risk-assessment`
  - Webhook routes: `/api/webhooks/stripe` (validate event structure)
  - Any other POST/PUT/DELETE routes
- [ ] GET routes are NOT affected (no request body to validate)
- [ ] Existing auth checks remain in place (validation is additive, not replacement)
- [ ] Invalid payloads return structured error: `{ error: "Validation failed", details: { ... } }` with 400 status
- [ ] Valid payloads continue to process normally (no behavior change)
- [ ] npm run build passes

**Depends on:** None (independent API hardening)
**Files:** `lib/api/schemas.ts` (new), 8-10 API route files in `app/api/` (modify)

---

#### T-50.2 Feature Component Unit Tests

Only 1 feature component test file exists. High-complexity feature components — `SwimlaneBoard`, `ComplianceMatrix`, `IronDomeDashboard`, `TeamManagement`, `KanbanView`, `PricingAnalysis`, `ActivityFeed` — have zero unit tests. Without tests, refactoring or theme migration can break component behavior undetected.

**Acceptance Criteria:**
- [ ] Write unit tests for 8-10 high-complexity feature components:
  - `SwimlaneBoard` — renders lanes, renders section cards, handles empty state
  - `ComplianceMatrix` — renders data table, status filtering, CSV export trigger
  - `IronDomeDashboard` — renders gap detection, drill-down navigation, aggregation
  - `TeamManagement` — renders team list, invite modal trigger, role assignment, remove confirmation
  - `OpportunityCard` — renders opportunity data, click handler, status badge
  - `KanbanView` — renders columns, renders cards in correct columns, handles empty board
  - `PricingAnalysis` — renders pricing data, chart render, edge cases
  - `ActivityFeed` — renders activities, date grouping, empty state, loading state
- [ ] Minimum 30 new test cases across all test files
- [ ] Each test file covers:
  - **Render:** component renders without errors with valid props
  - **Interaction:** user interactions trigger expected callbacks
  - **Edge cases:** empty data, loading states, error states
- [ ] No test uses `as any` — all mocks are properly typed
- [ ] Tests use shared fixtures where applicable (see T-50.3)
- [ ] All new tests pass via `npm test -- --run`
- [ ] npm run build passes

**Depends on:** None (independent test work)
**Files:** 8-10 new test files in `tests/` or colocated alongside components

---

#### T-50.3 Coverage Threshold Raise + Test Fixtures

With 30+ new feature component tests from T-50.2, actual coverage supports higher thresholds. Create shared test fixtures to reduce duplication across test files — mock Supabase client, mock profile, mock opportunity, mock permissions are repeated in nearly every test file.

**Acceptance Criteria:**
- [ ] Run `npm test -- --run --coverage` — document actual coverage percentages
- [ ] `vitest.config.ts` updated:
  - Raise thresholds to `lines: 45, functions: 40, branches: 35`
  - Thresholds are enforced in CI (test job fails if coverage drops below)
- [ ] Create shared test fixtures in `tests/fixtures/`:
  - `supabase.ts` — mock Supabase client with typed method stubs
  - `profile.ts` — mock user profiles for different roles (admin, author, partner, executive)
  - `opportunity.ts` — mock opportunity objects in various states (draft, active, won, lost)
  - `permissions.ts` — mock permission sets for different roles
- [ ] Fixtures are imported by 3+ test files (verify with grep)
- [ ] All tests pass with raised thresholds: `npm test -- --run --coverage`
- [ ] Coverage does not drop below new thresholds
- [ ] npm run build passes

**Depends on:** T-50.2 (new tests must exist before raising thresholds — otherwise thresholds may fail immediately)
**Files:** `vitest.config.ts` (modify), `tests/fixtures/supabase.ts` (new), `tests/fixtures/profile.ts` (new), `tests/fixtures/opportunity.ts` (new), `tests/fixtures/permissions.ts` (new)

---

#### T-50.4 Bundle Optimization — Recharts Lazy Loading

Analytics pages (`/analytics`, `/analytics/ai-usage`, `/admin/ai-usage`) each pull 120kB+ of recharts chart code eagerly, pushing page bundles to 289-293kB — well above the 200kB budget established in v1.7. `next/dynamic` with `{ ssr: false }` is the standard Next.js solution for lazy-loading client-only chart libraries.

**Acceptance Criteria:**
- [ ] Add dynamic imports for recharts components on analytics pages:
  - Use `next/dynamic` with `{ ssr: false }` for all recharts chart components
  - Each dynamically imported chart has a loading skeleton placeholder
  - Loading skeleton matches chart dimensions to prevent layout shift
- [ ] Apply lazy loading to all pages that import recharts:
  - `app/(dashboard)/analytics/page.tsx` (or equivalent)
  - `app/(dashboard)/analytics/ai-usage/page.tsx` (or equivalent)
  - `app/(dashboard)/admin/ai-usage/page.tsx` (or equivalent)
  - Any other pages importing recharts directly
- [ ] Target: reduce analytics page bundles from 289-293kB to under 200kB
- [ ] Verify with `npm run analyze`:
  - Analytics pages show reduced first-load JS
  - Recharts appears as a separate async chunk, not in the main page bundle
- [ ] Charts render correctly after dynamic load
- [ ] Loading skeleton shows during chart load (visible on slow connections)
- [ ] No functional regressions — all chart interactions still work
- [ ] npm run build passes

**Depends on:** None (independent performance work)
**Files:** 3-5 analytics page files (modify), potentially new chart wrapper components

---

### SPRINT 51 — Storybook Expansion + CI + Final Audit

*Core feature stories. Admin + integration stories. CI quality gates. Final audit.*

#### T-51.1 Storybook Stories Batch 1 — Core Features

12 Storybook stories exist from v1.7. The first batch of 15 new stories covers the most complex and frequently used feature components — DnD boards, compliance views, document tools, pricing, and layout components.

**Acceptance Criteria:**
- [ ] Write Storybook stories for 15 high-priority components:
  - `KanbanView.stories.tsx` — default board, empty board, single column
  - `SwimlaneBoard.stories.tsx` — default lanes, empty board, filtered view
  - `ComplianceMatrix.stories.tsx` — populated table, empty state, filtered
  - `IronDomeDashboard.stories.tsx` — with gaps, no gaps, loading state
  - `TeamManagement.stories.tsx` — team list, empty team, invite modal open
  - `RfpUploader.stories.tsx` — idle state, uploading state, completed state
  - `RequirementsExtractor.stories.tsx` — split pane with requirements, empty
  - `ContractScanner.stories.tsx` — scan results, no results, scanning state
  - `PricingAnalysis.stories.tsx` — with data, empty, chart variants
  - `BOETable.stories.tsx` — populated, empty, editing mode
  - `LCATGrid.stories.tsx` — populated grid, empty, filtered
  - `PriceToWinAnalysis.stories.tsx` — comparison view, single vendor
  - `Sidebar.stories.tsx` — expanded, collapsed, different role nav items
  - `MobileNav.stories.tsx` — open, closed, different role nav items
  - `DashboardHeader.stories.tsx` — with user info, notifications, search
- [ ] Each story has:
  - At least default + variant states (2+ stories per component)
  - Storybook Controls for interactive prop editing
  - Mock data for components requiring external data
  - Accessibility tab shows 0 violations
- [ ] All 15 stories render without errors in Storybook
- [ ] `npm run build-storybook` passes
- [ ] npm run build passes

**Depends on:** None (Storybook framework already installed from v1.7)
**Files:** 15 new `.stories.tsx` files in `stories/`

---

#### T-51.2 Storybook Stories Batch 2 — Admin + Integrations

The second batch of 15 stories covers admin, integration, and collaboration components — bringing the total Storybook catalog to 42+ stories.

**Acceptance Criteria:**
- [ ] Write Storybook stories for 15 more components:
  - `ProviderConfig.stories.tsx` — configured, unconfigured, error state
  - `TokenUsageCharts.stories.tsx` — with usage data, empty, threshold warning
  - `UserManagement.stories.tsx` — user list, empty, invite modal
  - `PilotTable.stories.tsx` — populated, empty, filtered
  - `SlackConfig.stories.tsx` — connected, disconnected, configuring
  - `M365Config.stories.tsx` — connected, disconnected, configuring
  - `SalesforceConfig.stories.tsx` — connected, disconnected, syncing
  - `GovWinConfig.stories.tsx` — connected, disconnected, importing
  - `DocuSignConfig.stories.tsx` — connected, disconnected, configuring
  - `GoogleConfig.stories.tsx` — connected, disconnected, configuring
  - `CommentPanel.stories.tsx` — with comments, empty, replying
  - `VersionDiff.stories.tsx` — with changes, no changes, side-by-side
  - `SectionMetrics.stories.tsx` — with data, empty, loading
  - `AnalyticsDashboard.stories.tsx` — populated, empty, date range filter
  - `AIUsageAnalytics.stories.tsx` — with usage, empty, budget warning
- [ ] Each story has:
  - At least default + variant states (2+ stories per component)
  - Storybook Controls for interactive prop editing
  - Mock data for components requiring external data
  - Accessibility tab shows 0 violations
- [ ] All 15 stories render without errors in Storybook
- [ ] Total Storybook story count reaches 42+ (12 existing + 15 batch 1 + 15 batch 2)
- [ ] `npm run build-storybook` passes
- [ ] npm run build passes

**Depends on:** None (independent from T-51.1 — both batches can be developed in parallel)
**Files:** 15 new `.stories.tsx` files in `stories/`

---

#### T-51.3 CI Enhancements — Bundle + Accessibility

CI workflow has 6 jobs but no bundle size enforcement, no accessibility testing, and no Storybook build verification. PRs can introduce bundle regressions, accessibility violations, and broken stories without CI catching them.

**Acceptance Criteria:**
- [ ] Add bundle size check to CI workflow:
  - Run `npm run build` and parse Next.js build output for route sizes
  - Fail CI if any route exceeds 250kB gzipped first-load JS
  - Report which routes exceed budget in CI output
  - Use existing `npm run build` output — no new build step required
- [ ] Add axe-core accessibility E2E test to Playwright CI workflow:
  - Run accessibility scan on `/dashboard` route
  - Run accessibility scan on `/pipeline` route
  - Fail CI on any critical or serious axe-core violations
  - Report violation details in CI output for debugging
- [ ] Add Storybook build check to CI:
  - Run `npm run build-storybook` as a CI step
  - Fail CI if Storybook build fails
  - Ensures story syntax errors and missing dependencies are caught pre-merge
- [ ] All 3 new CI checks pass on current codebase (no pre-existing failures)
- [ ] CI workflow remains under 15 minutes total runtime
- [ ] npm run build passes

**Depends on:** T-51.1 + T-51.2 (Storybook CI check needs stories to exist for meaningful verification)
**Files:** `.github/workflows/ci.yml` (modify), potentially new CI scripts in `scripts/`

---

#### T-51.4 CHANGELOG v1.8.0 + Final Audit

The capstone sweep before declaring v1.8 scale-ready. Update CHANGELOG with v1.8.0 release notes. Run all verification checks. Verify all pages render in light mode. Bump `package.json` version. Confirm the application is ready for enterprise scaling.

**Acceptance Criteria:**
- [ ] CHANGELOG update — add v1.8.0 (Scale Readiness) section to CHANGELOG.md:
  - **Added:** 30 new Storybook stories (42+ total), Zod API request body validation, DnD keyboard navigation + screen reader support, 30+ feature component unit tests, test fixtures, CI bundle size gate, CI accessibility testing, CI Storybook build check
  - **Changed:** Complete theme migration (42 files, 410+ instances), coverage thresholds raised to 45/40/35, analytics pages lazy-load recharts (289kB → <200kB), Tailwind config cleaned of duplicated hardcoded colors
  - **Security:** Zod validation on all mutation API routes — defense-in-depth at server boundary
  - **Performance:** Recharts lazy loading reduces analytics page bundles by 90kB+
  - **Accessibility:** Kanban and Swimlane fully accessible — ARIA attributes, keyboard navigation, screen reader announcements, 0 axe-core critical/serious violations
  - **Developer Experience:** 42+ Storybook stories, shared test fixtures, CI enforces bundle + accessibility + Storybook
- [ ] Bump `package.json` version to `"1.8.0"`
- [ ] Final verification:
  - `npm run lint` — 0 warnings
  - `npm run typecheck` — 0 errors (production)
  - `npm run typecheck:tests` — 0 errors (test files)
  - `npm test -- --run` — all tests pass (490+)
  - `npm run build` — 0 errors
  - `npm run build-storybook` — completes without errors
  - `/verify` returns CLEAR
- [ ] Visual verification: all top-10 pages render correctly in light mode
- [ ] `grep -rn "bg-\[#00050F\]\|bg-\[#0F172A\]\|bg-gray-900" app/ components/ --include="*.tsx"` returns 0 matches
- [ ] npm run build passes

**Depends on:** All S48–S51 tickets complete (final audit verifies everything)
**Files:** `CHANGELOG.md` (modify), `package.json` (modify — version bump)

---

## 3. New Dependencies

**0 new npm dependencies. Phase O uses only packages already installed.**

All required packages were added in prior phases:
- `zod` — already installed (form validation, now extended to API routes)
- `@hello-pangea/dnd` — already installed (DnD, now with announce callbacks)
- `next/dynamic` — built into Next.js (recharts lazy loading)
- `@storybook/*` — already installed in v1.7 (new stories only)
- `@axe-core/playwright` — already installed in v1.7 (CI accessibility testing)
- `vitest` — already installed (new test files and fixtures)

| Package | Sprint | Purpose | Dev Only? |
|---------|--------|---------|-----------|
| (none) | — | — | — |

**0 packages added. 0 packages removed. Net: 0 dependency changes.**

---

## 4. Dependency Chain

| Ticket | Blocks | Risk |
|--------|--------|------|
| T-48.1–T-48.4 (page theme migration) | T-49.1–T-49.3 (component theme migration follows page patterns) | Pages first establishes the migration pattern. Components follow the same conventions. Not a hard blocker but sequenced for consistency. |
| T-49.1–T-49.3 (component theme migration) | T-49.4 (DnD accessibility needs theme-clean components to avoid mixing concerns) | Accessibility work on DnD components should happen after those components are migrated to CSS variables, preventing duplicate edits to the same files. |
| T-50.2 (feature component tests) | T-50.3 (coverage threshold raise depends on more tests existing) | Hard dependency — raising thresholds before adding tests would cause immediate CI failure. T-50.2 adds the tests, T-50.3 raises the bar. |
| T-51.1 + T-51.2 (Storybook stories) | T-51.3 (CI Storybook check needs stories to exist for meaningful verification) | Soft dependency — CI check works with 12 existing stories, but is most valuable with 42+ stories verifying the full catalog. |
| T-51.4 (final audit) | None (capstone) | Depends on all other tickets. Runs verification across everything delivered in Phase O. |

---

## 5. Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Theme migration volume (42 files, 410+ instances) is larger than estimated | Sprint 48-49 take longer than expected. Some files have deeply nested conditional color logic. | Medium | Migration pattern is mechanical and consistent. Use find-and-replace where safe. Prioritize pages (S48) before components (S49). Accept partial migration if time-constrained — dark mode still works. |
| Theme migration introduces visual regressions | Text invisible on backgrounds, contrast failures, branded elements look wrong in light mode | High | Migrate one file at a time. Visual spot-check in both themes after each file. Use axe-core contrast checking. Dark mode must remain identical to current production — any regression is a bug. |
| Zod validation rejects currently-accepted payloads | Existing API consumers (frontend forms) send data that doesn't match strict Zod schemas, causing 400 errors | Medium | Derive Zod schemas from actual frontend form schemas where possible. Test each API route with real request shapes from the frontend. Use `.passthrough()` for schemas where extra fields are expected. |
| DnD keyboard navigation conflicts with existing keyboard shortcuts | Arrow keys for DnD conflict with page scrolling or other keyboard handlers | Medium | DnD keyboard mode is only active when an item is "picked up" (Enter/Space). Outside of active drag, keyboard behavior is unchanged. Test with and without active drag state. |
| `@hello-pangea/dnd` announce callbacks have limited customization | Built-in screen reader announcements may not match expected UX patterns | Low | `@hello-pangea/dnd` supports custom `liveRegion` and `onDragStart/Update/End` announce text. If built-in callbacks are insufficient, add custom aria-live region with manual announcements. |
| Recharts dynamic import causes visible layout shift | Chart area shows loading skeleton, then charts pop in with different dimensions | Medium | Loading skeleton must match chart container dimensions exactly. Use `min-height` on chart containers. Charts should not resize after load — fix dimensions before dynamic import. |
| Coverage threshold too aggressive at 45% | CI fails on PRs that don't add tests, blocking legitimate changes | Low | Set thresholds to actual measured coverage minus 5%. Thresholds are floors, not targets. If actual is 50%, set threshold to 45%. |
| Storybook stories require complex mock data | Feature components depend on Supabase, router, RBAC context — hard to mock in isolation | Medium | Create Storybook decorators for common contexts (mock Supabase provider, mock RBAC context). Use the same mock data patterns established in unit tests (T-50.3 fixtures). |
| CI runtime increases with new checks | Bundle size check, accessibility E2E, and Storybook build add time to CI | Low | Bundle size check parses existing build output (no extra build). Accessibility E2E adds 2 route scans (~30 seconds). Storybook build runs in parallel with other CI jobs. Target: total CI under 15 minutes. |
| Tailwind config cleanup breaks existing styles | Removing hardcoded color values from Tailwind config removes classes that components still reference | Medium | Only remove Tailwind config entries after ALL component files have been migrated. T-49.3 (config cleanup) runs after T-49.1 and T-49.2 (component migration). Grep for any remaining references before removing config entries. |

---

## 6. Sprint Summary

| Sprint | Theme | Tickets | New Files | Modified Files | New Dependencies |
|--------|-------|---------|-----------|----------------|-----------------|
| S48 | Theme Variable Migration: Pages | 4 (T-48.1–T-48.4) | 0 | 42+ | 0 |
| S49 | Theme Variable Migration: Components + Accessibility | 4 (T-49.1–T-49.4) | 0 | 50+ | 0 |
| S50 | API Hardening + Test Coverage | 4 (T-50.1–T-50.4) | 15+ | 15+ | 0 |
| S51 | Storybook Expansion + CI + Final Audit | 4 (T-51.1–T-51.4) | 30+ | 5+ | 0 |
| **Total** | | **16** | **45+** | **112+** | **0** |

---

## 7. Test Count Projection

| Metric | Start (v1.7) | End (v1.8) | Delta |
|--------|-------------|------------|-------|
| Unit tests (Vitest) | 455+ | 490+ | +35 |
| E2E specs (Playwright) | 50+ | 55+ | +5 |
| Storybook stories | 12 | 42+ | +30 |
| Line coverage enforced | 35% | 45%+ | +10% |
| Function coverage enforced | 30% | 40%+ | +10% |
| Branch coverage enforced | 25% | 35%+ | +10% |
| Feature component test files | 1 | 9+ | +8 |
| DnD components with ARIA | 0 | 2 | +2 |
| API routes with Zod validation | 0 | 8-10 | +8-10 |
| Files with hardcoded dark colors | 42 | 0 | -42 |
| CI quality gates | 6 | 9 | +3 |

---

## 8. What Phase O Is NOT

To prevent scope creep, these capabilities are explicitly **out of scope** for v1.8:

| Capability | Why Not v1.8 | When |
|------------|-------------|------|
| New features or modules | Phase O is scale readiness. Zero new user-facing features. | v2.0 |
| Database migrations or schema changes | No schema work in a readiness phase. | v2.0 |
| Visual regression testing (Chromatic, Percy) | Screenshot comparison is new infrastructure beyond Storybook. | v2.0 |
| Contract testing (API spec ↔ runtime) | OpenAPI spec is documentation-only. Runtime Zod validation is separate from contract testing. | v2.0 |
| i18n / localization | Translation is a new feature, not scale readiness. | v2.0 |
| Multi-region deployment | Infrastructure concern beyond code readiness. | Infrastructure sprint |
| 100% test coverage | 45% enforced floor with critical paths covered. Full coverage is ongoing. | Continuous |
| Custom Storybook addons | Vanilla Storybook with standard addons is sufficient. | If needed |
| Design system tokens (Figma sync) | CSS variables are sufficient. Token sync is design infrastructure. | v2.0 |
| PWA / offline support | Offline capability is a new feature, not readiness. | v2.0 |
| API versioning | No public API consumers yet. | When API goes public |
| New npm dependencies | Phase O works entirely with existing packages. | v2.0 |
| Responsive design overhaul | Mobile breakpoints were reconciled in v1.6. Theme migration does not change layout. | v2.0 |
| Performance profiling (APM) | Bundle optimization covers the measurable gap. Full APM is infrastructure. | Infrastructure sprint |

---

**PROPRIETARY — Mission Meets Tech, LLC — March 2026**
