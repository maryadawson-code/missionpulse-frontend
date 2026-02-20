# Sprint 3 — MissionPulse Delivery Manifest

**Branch:** `v2-development`  
**Repo:** `~/Desktop/missionpulse-frontend`  
**27 files** across 5 tickets  

---

## Installation

Copy each folder into your repo root, preserving the directory structure:

```bash
# From repo root (~/Desktop/missionpulse-frontend)
cp -r sprint3/app/* app/
cp -r sprint3/components/* components/
cp -r sprint3/lib/* lib/
cp -r sprint3/tests/* tests/
cp sprint3/tailwind.config.ts tailwind.config.ts
```

Then validate:

```bash
npm run build
```

---

## Ticket → File Map

### T-7: Dashboard Shell (4 KPI cards, loading skeletons, RBAC-scoped)

| File | Type | Purpose |
|------|------|---------|
| `app/(dashboard)/page.tsx` | Server Component | Dashboard with KPI cards + recent activity |
| `components/dashboard/KPICards.tsx` | Server Component | 4 KPI cards (pipeline count, ceiling, avg pWin, deadlines) |
| `components/dashboard/KPICardSkeleton.tsx` | Component | Pulse-animated loading skeleton |
| `lib/actions/dashboard.ts` | Server Action | Fetches KPIs — RLS-scoped (executive sees all, others see assigned) |
| `lib/types/opportunities.ts` | Types | Shared types derived from `Database['public']['Tables']` — zero `as any` |

**RBAC:** `getDashboardKPIs()` relies on RLS. No additional filtering needed — the Supabase client uses the user's JWT, so `executive/CEO/COO` roles see all opportunities, others see only those where `owner_id` matches.

### T-8: Pipeline Table (sortable, filterable, CRUD, Playwright test)

| File | Type | Purpose |
|------|------|---------|
| `app/(dashboard)/pipeline/page.tsx` | Server Component | Pipeline page shell |
| `app/(dashboard)/pipeline/loading.tsx` | Loading UI | Skeleton for pipeline |
| `components/modules/PipelineTable.tsx` | Client Component | Sortable/filterable table with delete modal |
| `lib/actions/opportunities.ts` | Server Actions | `getOpportunities`, `createOpportunity`, `updateOpportunity`, `deleteOpportunity` |
| `components/ui/Toast.tsx` | Client Component | Global toast notification system |
| `tests/e2e/pipeline.spec.ts` | Playwright | 6 tests: load, sort, filter, search, create nav, delete modal |

**Column mapping (verified):** `title`, `agency`, `ceiling`, `pwin`, `phase`, `set_aside`, `owner_id`, `due_date` — no legacy names.

**Audit trail:** Every create/update/delete writes to both `audit_logs` (immutable, NIST AU-9) and `activity_log` (user-visible).

### T-9: Opportunity Create/Edit Form (validated, server action, toast)

| File | Type | Purpose |
|------|------|---------|
| `app/(dashboard)/pipeline/new/page.tsx` | Server Component | Create form page |
| `app/(dashboard)/pipeline/[id]/edit/page.tsx` | Server Component | Edit form page (fetches existing data) |
| `components/modules/OpportunityForm.tsx` | Client Component | Full 46-col form with client+server validation |

**Validation:** Client-side (title required, ceiling numeric, pwin 0–100, email format) + server-side (same checks in Server Action). Toast on success/error.

### T-10: War Room Detail (`/war-room/[id]` tabbed hub)

| File | Type | Purpose |
|------|------|---------|
| `app/(dashboard)/war-room/[id]/page.tsx` | Server Component | Fetches opportunity + assignments + RBAC check |
| `components/modules/WarRoom/PwinGauge.tsx` | Component | SVG half-circle gauge (color-coded: green/amber/red) |
| `components/modules/WarRoom/WarRoomTabs.tsx` | Client Component | 4 tabs: Overview, Strategy (CUI), Team, Timeline |
| `components/rbac/CUIBanner.tsx` | Component | `CUI // SP-PROPIN`, `CUI // OPSEC`, `CUI // SP-PRVCY` |

**RBAC:** Strategy tab only renders for roles in `can_access_sensitive()` — executive, operations, admin, CEO, COO, FIN. Other roles never see the tab (invisible RBAC). CUI banner displays on sensitive tabs.

### T-11: Dashboard Layout (Sidebar + TopBar + breadcrumbs + mobile responsive)

| File | Type | Purpose |
|------|------|---------|
| `app/(dashboard)/layout.tsx` | Server Component | Auth gate + profile fetch + RBAC module computation |
| `app/(dashboard)/loading.tsx` | Loading UI | Dashboard skeleton |
| `app/(dashboard)/error.tsx` | Error Boundary | Friendly error with retry |
| `components/dashboard/DashboardShell.tsx` | Client Component | Wires Sidebar + TopBar with mobile state |
| `components/dashboard/Sidebar.tsx` | Client Component | RBAC-filtered nav items, mobile overlay |
| `components/dashboard/TopBar.tsx` | Client Component | User avatar, breadcrumbs, hamburger trigger |

**RBAC Nav:** Sidebar reads `roles_permissions_config.json` via `lib/rbac/config.ts`. Only modules where `shouldRender: true` appear in nav. Fail closed — unknown roles see only Dashboard + Settings.

### Shared Infrastructure

| File | Type | Purpose |
|------|------|---------|
| `lib/rbac/config.ts` | Module | Typed import of `roles_permissions_config.json` + helpers |
| `lib/utils/constants.ts` | Module | Brand tokens, Shipley config, plain language labels |
| `tailwind.config.ts` | Config | Brand colors (navy, cyan, surface, border), Inter font, animations |

---

## Compliance Posture

| Control | Implementation | Evidence |
|---------|---------------|----------|
| **AC-3** Access Enforcement | RLS on all queries. `layout.tsx` redirects unauthenticated. RBAC config gates nav items. | `app/(dashboard)/layout.tsx`, Supabase RLS policies |
| **AC-6** Least Privilege | Invisible RBAC — components don't render. Fail closed on unknown roles. | `Sidebar.tsx`, `WarRoomTabs.tsx` |
| **AU-2** Audit Events | All CRUD on opportunities writes to `audit_logs` + `activity_log`. | `lib/actions/opportunities.ts` |
| **AU-9** Audit Immutability | `audit_logs_immutable` trigger (DB-enforced). | Supabase trigger |
| **SC-13** CUI Protection | `CUIBanner` component marks sensitive data zones. Strategy tab gated by `can_access_sensitive()`. | `CUIBanner.tsx`, `WarRoomTabs.tsx` |

---

## Build Validation

After copying files into repo:

```bash
# 1. Type check + build
npm run build

# 2. Lint
npm run lint

# 3. E2E tests (requires running dev server)
npx playwright test tests/e2e/pipeline.spec.ts
```

---

*Mission Meets Tech — Mission. Technology. Transformation.*
