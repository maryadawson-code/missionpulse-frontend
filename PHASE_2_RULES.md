# PHASE_2_RULES.md — MissionPulse Next.js Build Contract

**Version:** 2.0  
**Updated:** 2026-02-19  
**Verified against:** Live `information_schema` exports for `profiles` (13 cols) and `opportunities` (46 cols)  
**Authority:** This document governs all Phase 2 development. Code that violates these rules does not merge.

---

## 1. Framework Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | **Next.js 14 (App Router)** | Server Components, middleware auth, Netlify-native |
| Language | **TypeScript (strict mode)** | `strict: true`. No `any` in app code. |
| Styling | **Tailwind CSS 3.x** | Dark mode via `class` strategy. Brand tokens in `tailwind.config.ts`. |
| Auth | **Supabase Auth + `@supabase/ssr`** | Cookie-based sessions. Email/password only. |
| Database | **Supabase JS client (direct)** | No ORM. Server Components query via RLS. |
| Package Manager | **npm** | Lock file committed. No yarn/pnpm. |
| Deployment | **Netlify** | Auto-deploy `main`. Preview deploys from PRs. |
| Testing | **Playwright** | E2E for auth + RBAC. Sprint 0 deliverable. |

---

## 2. Architecture Rules (Hard Constraints)

### Server vs Client Components

Every `app/` file is a **Server Component** unless it declares `'use client'`.

**Server Components:** Read cookies, fetch Supabase data, access env vars. No hooks.  
**Client Components:** useState, onClick, real-time subscriptions. No server secrets.

**The Rule:** If it doesn't need `useState` or `onClick`, it stays a Server Component.

### Data Access Boundaries

- **RLS is primary.** User-facing queries use the user's JWT. RLS enforces access.
- **Service role is server-only.** `SUPABASE_SERVICE_ROLE_KEY` for admin ops, background jobs, webhooks only.
- **Never bypass RLS for user queries.**

### Prohibited Patterns

| Pattern | Why |
|---------|-----|
| Service role key in client components | Full DB access in browser |
| `SUPABASE_SERVICE_ROLE_KEY` in `NEXT_PUBLIC_*` | Leaked to client bundle |
| `@ts-ignore` without comment | Hides type errors |
| `any` in application code | Defeats TypeScript |
| `console.log` in production | Use structured logging |
| `localStorage` for auth tokens | Supabase SSR uses cookies |
| "Access Denied" UI | Invisible RBAC — don't render it |

---

## 3. Supabase Integration Contract

### Client Instantiation

**Browser** (`lib/supabase/client.ts`): `createBrowserClient()` with `NEXT_PUBLIC_*` vars  
**Server** (`lib/supabase/server.ts`): `createServerClient()` with `cookies()` from `next/headers`  
**Admin** (`lib/supabase/admin.ts`): `createClient()` with `SUPABASE_SERVICE_ROLE_KEY` — server-only

### Session Refresh

`middleware.ts` at project root refreshes session on every request using `@supabase/ssr`. Unauthenticated users redirect to `/login`. Authenticated users on auth pages redirect to `/`.

### RBAC Approach

1. **Role source:** `profiles.role` (queried via `auth.uid()`)
2. **Server enforcement:** RLS helper functions
3. **Client enforcement:** `useRole()` hook + `RBACGate` component
4. **Config source:** `roles_permissions_config.json` (v9.5)

### Column Name Standards (from Verified Schema)

When querying `opportunities`, use these columns — NOT the Phase 1 JS names:

| Concept | Use This Column | Do NOT Use |
|---------|----------------|------------|
| Display name | `title` | ~~name~~ |
| Dollar value | `ceiling` | ~~contract_value~~, ~~value~~ |
| Win probability | `pwin` | ~~win_probability~~ |
| Shipley gate | `phase` | ~~shipley_phase~~, ~~pipeline_stage~~ |
| Lifecycle | `status` | — |
| Owner | `owner_id` | ~~created_by~~ |
| Contact | `contact_name` + `contact_email` | ~~primaryContact~~ |

When querying `profiles`:

| Concept | Use This Column | Notes |
|---------|----------------|-------|
| Company FK (for RLS) | `company_id` | UUID, used by `get_my_company_id()` |
| Company display | `company` | VARCHAR, for UI only |
| User preferences | `preferences` | JSONB |
| Account status | `status` | Default: 'active' |

**⚠ `mfa_enabled` does NOT exist on `profiles`.** Do not reference it. MFA is a future feature.

### Audit Logging

- INSERT into `audit_logs` for CRUD on sensitive tables
- `audit_logs_immutable` trigger prevents tampering (NIST AU-9)
- User-visible actions → `activity_log` table
- Server actions call `logActivity()` helper after mutations

---

## 4. Data Fetching & API Rules

| Pattern | When | Example |
|---------|------|---------|
| Server Component fetch | Page data (default) | Pipeline loads opportunities |
| Server Action | Form submissions, mutations | Create opportunity |
| Route Handler | Webhooks, auth callback | `/api/auth/callback` |
| Client-side | Real-time, optimistic UI | Live activity feed |

### Error Handling

```typescript
const { data, error } = await supabase.from('opportunities').select('*')
if (error) {
  console.error('[opportunities]', error.message)
  // Server Component: throw → error.tsx
  // Server Action: return { error: error.message }
  // Client: set error state
}
const opportunities = data ?? []
```

---

## 5. Folder Structure

```
missionpulse-frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx               # Sidebar + topbar + RBAC nav
│   │   ├── page.tsx                 # Dashboard home
│   │   ├── pipeline/page.tsx
│   │   ├── war-room/[id]/page.tsx
│   │   ├── compliance/page.tsx
│   │   ├── pricing/page.tsx         # CUI // SP-PROPIN
│   │   ├── blackhat/page.tsx        # CUI // OPSEC
│   │   ├── admin/page.tsx
│   │   └── settings/page.tsx
│   ├── api/auth/callback/route.ts
│   ├── layout.tsx                   # Root: html, body, providers
│   ├── not-found.tsx
│   └── error.tsx
├── components/
│   ├── ui/                          # Button, Card, Badge, Input, Modal
│   ├── auth/                        # LoginForm, SignupForm
│   ├── dashboard/                   # Sidebar, TopBar, DashboardShell
│   ├── modules/                     # PipelineTable, OpportunityCard
│   └── rbac/                        # RBACGate, CUIBanner, RoleNav
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client
│   │   ├── admin.ts                # Service role (server-only)
│   │   └── types.ts                # supabase gen types output
│   ├── rbac/
│   │   ├── config.ts               # roles_permissions_config.json
│   │   ├── hooks.ts                # useRole(), useModuleAccess()
│   │   └── guard.tsx               # RBACGate component
│   ├── actions/
│   │   ├── auth.ts                 # signIn, signUp, signOut
│   │   ├── opportunities.ts        # CRUD
│   │   └── audit.ts                # logActivity, logAudit
│   └── utils/
│       ├── constants.ts            # Brand colors, Shipley phases
│       └── formatting.ts           # Plain language transforms
├── middleware.ts
├── public/images/                   # MMT logos
├── tests/e2e/
│   ├── auth.spec.ts
│   ├── rbac.spec.ts
│   └── playwright.config.ts
├── .env.example
├── .env.local                       # Gitignored
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 6. Quality Gates

### Pre-Merge

1. `npm run build` — zero TypeScript errors
2. `npm run lint` — ESLint passes
3. `npx playwright test` — all E2E pass
4. Manual RBAC spot-check

### Playwright (Sprint 0 Deliverable)

**First 5 tests:**

1. **Signup → profile → dashboard** — `/signup` → profiles row exists → redirect to `/`
2. **Login/logout persistence** — Login → protected page works. Logout → redirected.
3. **Route guard** — No session → `/pipeline` → redirect to `/login`
4. **RBAC nav** — CEO sees all items. Author hides Pricing/Black Hat.
5. **RLS sanity** — Internal user sees opportunities. External without `partner_access` → empty.

---

## 7. Migration Rules

### Do Not Touch

- Supabase schema (no drops, no renames on populated columns)
- RBAC functions: `is_admin`, `is_authenticated`, `is_internal_user`, `can_access_sensitive`, `get_user_role`, `get_my_company_id`
- Triggers: `handle_new_user`, `audit_logs_immutable`
- `roles_permissions_config.json`

### May Be Refactored

- All standalone HTML → Next.js pages
- `supabase-client.js` → `lib/supabase/*.ts`
- Python backend → Next.js server actions
- `test_agents.py` → Playwright

### Deprecation

1. Phase 1 HTML stays until replaced. Same PR deletes HTML + adds Next.js page.
2. Python files → `legacy/` folder (not deleted until verified)
3. `supabase-client.js` deleted after TypeScript migration complete

### Source of Truth

- **Schema:** Supabase live DB. CURRENT_STATE.md documents it.
- **RBAC:** `roles_permissions_config.json` (UI) + RLS functions (data). Must agree.
- **Auth flow:** This document §3 is truth.

---

## 8. Brand & UX

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| navy | `#00050F` | Background |
| cyan | `#00E5FA` | Accent, actions |
| white | `#FFFFFF` | Headings |
| slate | `#94A3B8` | Secondary text |
| surface | `#0F172A` | Cards |
| border | `#1E293B` | Dividers |
| error | `#EF4444` | |
| success | `#22C55E` | |
| warning | `#F59E0B` | |

### Plain Language

| DB Column | Display Label | Tooltip |
|-----------|--------------|---------|
| `pwin` | Win Probability | 0–100% chance of winning |
| `ceiling` | Contract Value | Maximum contract ceiling |
| `phase` | Shipley Phase | Current Shipley gate (1–6) |
| `set_aside` | Set-Aside | Small business designation |
| `bd_investment` | B&P Investment | Business development spend |
| `is_recompete` | Recompete | Rebid of existing contract |
| `pop_start` / `pop_end` | Period of Performance | Contract execution dates |

### CUI Banners

- Pricing: `CUI // SP-PROPIN`
- Black Hat: `CUI // OPSEC`
- Personnel: `CUI // SP-PRVCY`

### AI Footer

All AI output: `AI GENERATED — REQUIRES HUMAN REVIEW`

---

## 9. Commits & Branches

```
feat(auth): add login page with signInWithPassword
fix(rbac): hide pricing nav for non-FIN roles
test(e2e): add RBAC nav visibility test
```

- `main` = production (auto-deploy)
- `v2-development` = staging
- Feature branches: `feat/auth-login`, `feat/dashboard-shell`
- PR required into `v2-development`
- `v2-development` → `main` requires passing Playwright

---

*Mission Meets Tech — Mission. Technology. Transformation.*  
*AI GENERATED — REQUIRES HUMAN REVIEW*
