# PHASE_2_RULES.md — MissionPulse Next.js Build Contract

**Version:** 1.0  
**Created:** 2026-02-19  
**Authority:** This document governs all Phase 2 development. Code that violates these rules does not merge.

---

## 1. Framework Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | **Next.js 14 (App Router)** | Server Components for data fetching, built-in middleware for auth, Netlify-native deployment |
| Language | **TypeScript (strict mode)** | Zero `any` types in application code. `strict: true` in tsconfig. |
| Styling | **Tailwind CSS 3.x** | Dark mode via `class` strategy. Brand tokens in `tailwind.config.ts`. |
| Component Library | **Custom primitives** in `components/ui/` | No shadcn/ui or external UI kit initially. Build what we need. |
| Auth | **Supabase Auth + `@supabase/ssr`** | Cookie-based sessions. Email/password only. |
| Database Access | **Supabase JS client (direct)** | No ORM. No SQLAlchemy. Server Components query Supabase directly. |
| Package Manager | **npm** | Lock file committed. No yarn/pnpm. |
| Deployment | **Netlify** | Auto-deploy `main`. Preview deploys from `v2-development` PRs. |
| Testing | **Playwright** | E2E tests for auth + RBAC flows. Sprint 0 deliverable. |

---

## 2. Architecture Rules (Hard Constraints)

### Server vs Client Components

Every file in `app/` is a **Server Component by default** unless it declares `'use client'` at the top.

**Server Components:**
- CAN: Read cookies, fetch Supabase data, access `process.env` secrets, run async
- CANNOT: Use `useState`, `useEffect`, `onClick`, any hooks
- USE FOR: Page-level data fetching, layout assembly, initial RBAC filtering

**Client Components:**
- CAN: Use hooks, handle DOM events, manage local state, subscribe to real-time
- CANNOT: Access server-only env vars, call `cookies()` from `next/headers`
- USE FOR: Forms, modals, interactive tables, real-time features

**The Rule:** If it doesn't need `useState` or `onClick`, it stays a Server Component.

### Data Access Boundaries

- **RLS is primary.** All user-facing queries go through the browser or server client using the user's JWT. RLS enforces access.
- **Service role is server-only.** `SUPABASE_SERVICE_ROLE_KEY` is used ONLY for: admin operations, background jobs, webhook handlers.
- **Never bypass RLS for user-facing queries.** If a query needs data the user shouldn't see, the feature design is wrong.

### Prohibited Patterns

| Pattern | Why |
|---------|-----|
| Service role key in client components | Exposes full DB access to browser |
| `SUPABASE_SERVICE_ROLE_KEY` in `NEXT_PUBLIC_*` vars | Leaked to client bundle |
| `@ts-ignore` without justification comment | Hides type errors |
| `any` type in application code | Defeats TypeScript value |
| `console.log` in production code | Use structured logging |
| Direct SQL queries from client | Always go through Supabase client + RLS |
| `localStorage` for auth tokens | Supabase SSR uses cookies |
| "Access Denied" UI | Invisible RBAC — restricted items don't render |

---

## 3. Supabase Integration Contract

### Client Instantiation

**Browser client** (`lib/supabase/client.ts`):
```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Server client** (`lib/supabase/server.ts`):
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}
```

**Service role client** (`lib/supabase/admin.ts` — server-only):
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

### Session Refresh Strategy

Next.js `middleware.ts` at the project root refreshes the session on every request:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Route protection
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
                     request.nextUrl.pathname.startsWith('/signup')

  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

### RBAC Approach

1. **Role source:** `profiles.role` (queried via `auth.uid()` at request time)
2. **Server enforcement:** RLS policies use helper functions (`is_admin()`, `is_internal_user()`, `can_access_sensitive()`)
3. **Client enforcement:** `useRole()` hook reads profile, `RBACGate` component hides unauthorized UI
4. **Config source:** `roles_permissions_config.json` (v9.5) — imported at build time

### Audit Logging

- INSERT into `audit_logs` for all CRUD operations on sensitive tables
- `audit_logs_immutable` trigger prevents tampering (NIST AU-9)
- Activity logging via `activity_log` table for user-facing events
- Server actions should call a `logActivity()` helper after mutations

---

## 4. Data Fetching & API Rules

### When to Use What

| Pattern | When | Example |
|---------|------|---------|
| **Server Component fetch** | Page-level data loading (default) | Pipeline page loads opportunities |
| **Server Action** | Form submissions, mutations | Create opportunity, update profile |
| **Route Handler** | Webhook endpoints, auth callbacks, external API proxy | `/api/auth/callback`, `/api/webhooks/sam-gov` |
| **Client-side fetch** | Real-time subscriptions, optimistic UI, polling | Live activity feed |

### Error Handling Convention

```typescript
// Always destructure { data, error } — never assume success
const { data, error } = await supabase.from('opportunities').select('*')

if (error) {
  console.error('[opportunities]', error.message)
  // Server Components: throw to trigger error.tsx
  // Server Actions: return { error: error.message }
  // Client Components: set error state
}

const opportunities = data ?? []
```

### Logging

- `console.error` for actual errors (visible in Netlify logs)
- No `console.log` in production — enforce via eslint rule `no-console`
- Audit-critical actions → INSERT into `audit_logs`
- User-visible actions → INSERT into `activity_log`

---

## 5. Folder Structure

```
missionpulse-frontend/
├── app/
│   ├── (auth)/                      # Route group — no dashboard chrome
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── layout.tsx              # Centered card layout, dark bg
│   ├── (dashboard)/                 # Route group — full dashboard chrome
│   │   ├── layout.tsx              # Sidebar + topbar + RBAC nav
│   │   ├── page.tsx                # Dashboard home
│   │   ├── pipeline/page.tsx
│   │   ├── war-room/[id]/page.tsx
│   │   ├── compliance/page.tsx
│   │   ├── pricing/page.tsx        # CUI // SP-PROPIN
│   │   ├── blackhat/page.tsx       # CUI // OPSEC
│   │   ├── admin/
│   │   │   └── page.tsx            # Admin-only
│   │   └── settings/page.tsx
│   ├── api/
│   │   └── auth/
│   │       └── callback/route.ts   # Supabase auth callback
│   ├── layout.tsx                   # Root: html, body, ThemeProvider
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
│   │   ├── server.ts               # Server client (cookies)
│   │   ├── admin.ts                # Service role (server-only)
│   │   └── types.ts                # Generated via supabase gen types
│   ├── rbac/
│   │   ├── config.ts               # Loads roles_permissions_config.json
│   │   ├── hooks.ts                # useRole(), useModuleAccess()
│   │   └── guard.tsx               # RBACGate component
│   ├── actions/                     # Server Actions
│   │   ├── auth.ts                 # signIn, signUp, signOut
│   │   ├── opportunities.ts        # CRUD
│   │   └── audit.ts                # logActivity, logAudit
│   └── utils/
│       ├── constants.ts            # Brand colors, Shipley phases
│       └── formatting.ts           # Plain language transforms
├── middleware.ts                     # Session refresh + route guards
├── public/
│   ├── favicon.ico
│   └── images/                     # MMT logos
├── tests/
│   ├── e2e/
│   │   ├── auth.spec.ts
│   │   └── rbac.spec.ts
│   └── playwright.config.ts
├── .env.example                     # Template (committed)
├── .env.local                       # Local secrets (gitignored)
├── .eslintrc.json
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── package-lock.json
```

---

## 6. Quality Gates

### Pre-Merge Checks

Every PR into `v2-development` must pass:

1. `npm run build` — Zero TypeScript errors
2. `npm run lint` — ESLint passes
3. `npx playwright test` — All E2E tests pass
4. Manual: RBAC spot-check (reviewer confirms invisible gating)

### E2E Test Policy

Playwright does **not exist yet.** It is a **Sprint 0 deliverable.**

**First 5 tests (Sprint 0):**

1. **Signup → profile created → dashboard redirect**  
   Navigate to `/signup`, submit form, verify `profiles` row exists, verify redirect to `/`

2. **Login / logout session persistence**  
   Login → protected page loads. Logout → protected page redirects to `/login`.

3. **Route guard (unauthenticated redirect)**  
   No session → `/pipeline` redirects to `/login`. Auth pages accessible.

4. **RBAC nav visibility**  
   CEO sees all nav items. Author role hides Pricing/Black Hat (items don't render, no "access denied").

5. **RLS enforcement sanity**  
   Internal user queries opportunities → data returned. External partner without `partner_access` → empty result.

### Test Commands

```bash
npx playwright install          # First time: install browsers
npx playwright test             # Run all
npx playwright test --ui        # Debug mode
npx playwright test tests/e2e/auth.spec.ts  # Single file
```

---

## 7. Migration Rules

### Unchanged (Do Not Touch)

- Supabase schema (no table drops, no column renames on populated tables)
- RBAC helper functions (`is_admin`, `is_authenticated`, `is_internal_user`, `can_access_sensitive`, `get_user_role`, `get_my_company_id`)
- Triggers (`handle_new_user`, `audit_logs_immutable`)
- `roles_permissions_config.json` — changes require explicit review

### May Be Refactored

- All standalone HTML files → replaced by Next.js pages
- `supabase-client.js` → replaced by `lib/supabase/*.ts`
- Python backend (FastAPI/SQLAlchemy) → replaced by Next.js server actions
- `test_agents.py` → replaced by Playwright + any new API tests

### Deprecation Policy

1. Phase 1 HTML files stay on `main` until Next.js page replaces each module
2. When Next.js page ships, delete corresponding HTML in same PR
3. Python backend files move to `legacy/` (not deleted) until migration verified
4. `supabase-client.js` deleted after all queries migrated to TypeScript

### Single Source of Truth

- **Schema:** Supabase live DB. CURRENT_STATE.md documents it. Disagreements → run verification SQL.
- **RBAC:** `roles_permissions_config.json` for UI. RLS functions for data. Must agree.
- **Auth flow:** This document (§3) is truth. If code disagrees, code is wrong.

---

## 8. Brand & UX Rules

### Colors (Tailwind Config)

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` / `navy` | `#00050F` | Page background |
| `accent` / `cyan` | `#00E5FA` | Actions, links, highlights |
| `text-primary` | `#FFFFFF` | Headings |
| `text-secondary` | `#94A3B8` | Labels, descriptions |
| `error` | `#EF4444` | Critical risk, errors |
| `success` | `#22C55E` | Compliant, approved |
| `warning` | `#F59E0B` | Partial, caution |
| `surface` | `#0F172A` | Cards, panels |
| `border` | `#1E293B` | Dividers |

### CUI Module Banners

- Pricing/BOE: `CUI // SP-PROPIN`
- Black Hat/Competitors: `CUI // OPSEC`
- Personnel: `CUI // SP-PRVCY`

### AI Content Footer

All AI output: `AI GENERATED — REQUIRES HUMAN REVIEW`

---

## 9. Commit Convention

```
type(scope): description

feat(auth): add login page with Supabase signInWithPassword
fix(rbac): hide pricing nav for non-FIN roles
test(e2e): add RBAC nav visibility test
```

Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`

### Branch Strategy

- `main` = production (auto-deploys)
- `v2-development` = staging
- Feature branches: `feat/auth-login`, `feat/dashboard-shell`
- PR required for all merges into `v2-development`
- `v2-development` → `main` requires passing Playwright

---

*Mission Meets Tech — Mission. Technology. Transformation.*  
*AI GENERATED — REQUIRES HUMAN REVIEW*
