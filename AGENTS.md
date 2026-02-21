# AGENTS.md — MissionPulse Project Intelligence

## Project Overview

MissionPulse is a federal proposal management SaaS for government contractors. Built on Next.js 14 (App Router), Supabase (PostgreSQL + Auth + RLS), TypeScript strict mode. Deployed to Netlify (frontend) and Render (API). Targets DHA, VA, CMS, IHS healthcare IT contracts.

**Owner:** Mission Meets Tech (MMT)  
**Branch:** `v2-development` (staging) · `main` (production)  
**Staging URL:** `v2-development--missionpulse-io.netlify.app`

## Tech Stack

- **Runtime:** Node.js 20
- **Framework:** Next.js 14 (App Router — Server Components by default)
- **Database:** Supabase PostgreSQL with Row Level Security on all 200 tables
- **Auth:** Supabase Auth via `@supabase/ssr` (cookie-based sessions, email/password)
- **RBAC:** 12 roles × 14 modules via `roles_permissions_config.json` v9.5
- **Styling:** Tailwind CSS 3.x (dark mode, `class` strategy) + Shield & Pulse design tokens
- **Design tokens:** Primary Cyan `#00E5FA`, Deep Navy `#00050F`, Inter font family
- **Package manager:** npm (lock file committed)
- **Testing:** Playwright (E2E for auth + RBAC)

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Dev server at localhost:3000
npm run build        # Production build (THE validation command)
npx tsc --noEmit     # Type check without emitting
npm run lint         # ESLint
npm test             # Playwright E2E
```

## Project Structure

```
app/
├── (auth)/           # Login, signup, callback
├── (dashboard)/      # Protected dashboard routes
│   ├── layout.tsx    # Sidebar + RBAC nav filtering
│   ├── page.tsx      # Dashboard home
│   ├── pipeline/     # Opportunity pipeline
│   └── war-room/     # War room detail views
├── layout.tsx        # Root layout (fonts, metadata)
└── page.tsx          # Landing/redirect

lib/
├── supabase/
│   ├── client.ts     # Browser client (NEXT_PUBLIC_ vars only)
│   ├── server.ts     # Server client (cookies-based)
│   ├── admin.ts      # Service role (server-only, never import in client)
│   └── database.types.ts  # Generated via `supabase gen types`
├── rbac/
│   ├── config.ts     # Loads roles_permissions_config.json
│   └── roles_permissions_config.json  # Canonical RBAC matrix
├── actions/          # Server Actions
├── types/            # Shared TypeScript types
└── utils/            # Shared helpers

components/
├── ui/               # shadcn/ui primitives
├── layout/           # Sidebar, header, nav
├── dashboard/        # Dashboard-specific components
├── modules/          # Module-specific components
└── rbac/             # RBAC gate components

middleware.ts          # Session refresh + auth redirect
```

## Architecture Docs (read when relevant)

- `PHASE_2_RULES.md` → Framework decisions, data access rules, prohibited patterns
- `GROUND_TRUTH_v2.md` → Live database audit (200 tables, 37 with data, all RLS functions)
- `roles_permissions_config.json` → Canonical RBAC matrix (12 roles × 14 modules)
- `database.types.ts` → Generated DB types (sole schema authority)

## Rules

### Data Access
- RLS is primary. User queries use JWT. Never bypass RLS for user-facing queries.
- Service role key (`admin.ts`) for server-only admin ops, background jobs, webhooks.
- Server Actions for all mutations. Never API routes for form submissions.
- Server Components for data fetching (default). Client Components only when hooks needed.

### RBAC
- `roles_permissions_config.json` v9.5 is the RBAC truth source.
- Invisible RBAC: if `shouldRender` is false, the component does not exist in the DOM. No "Access Denied" screens.
- External roles (partner, subcontractor, consultant) get CUI watermarking and scope restrictions.
- `profiles.role` is the auth pivot. All RLS helper functions query it.

### Schema
- `database.types.ts` is the sole DB typing authority. No aliasing, no invented columns.
- `opportunities` uses: `title` (not name), `ceiling` (not value), `pwin` (not win_probability), `phase` (not shipley_phase), `owner_id` (not created_by).
- `profiles.mfa_enabled` does NOT exist. Do not reference it.

### Code Quality
- TypeScript strict mode. `as any` forbidden.
- No `@ts-ignore` without explanatory comment.
- No `console.log` in production — use structured logging.
- No `localStorage` for auth — Supabase SSR uses cookies.

### Security
- No secrets in code. `.env.local` in `.gitignore`.
- `SUPABASE_SERVICE_ROLE_KEY` never in `NEXT_PUBLIC_*` vars.
- Mutations on sensitive tables → `audit_logs` (immutable via trigger, NIST AU-9).
- User-visible actions → `activity_log` table.

## Gotchas

- `handle_new_user` trigger auto-creates profiles with `role='CEO'`. Override in app logic for non-CEO signups.
- Two duplicate tables exist: `hubspot_field_mapping` (18 rows) and `hubspot_field_mappings` (11 rows). Use `hubspot_field_mappings` (plural) — consolidation pending.
- `is_mfa_enabled()` function references `profiles.mfa_enabled` which doesn't exist yet. Will break if called. Add the column when MFA ships.
- pgvector is installed and active (6 embeddings in `knowledge_embeddings`). RAG-ready.
- `activity_log` table has columns: `id`, `action`, `details`, `ip_address`, `timestamp`, `user_name`, `user_role`. No `entity_type`, no `entity_id`, no `created_at`.
- `opportunity_assignments` table — verify column names against `database.types.ts` before querying. `user_id` may not exist.
- Mac Terminal: give commands ONE AT A TIME in separate code blocks. Do NOT chain with semicolons — copy/paste causes concatenation errors.
- Git: Always use Terminal for git commands, not GitHub Desktop GUI.
- Always `git checkout v2-development` before making changes.

## Conventions

- Component files: PascalCase (`PipelineTable.tsx`)
- Utility files: camelCase (`formatCurrency.ts`)
- Server Actions: `action` prefix (`actionCreateOpportunity.ts`)
- Error boundaries: one per route segment
- Loading states: `loading.tsx` files per route (Suspense boundaries)
- Empty states: follow `emptyStateConfig` from roles_permissions_config.json
