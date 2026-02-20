# CURRENT_STATE.md — MissionPulse System Truth

**Version:** 1.0  
**Generated:** 2026-02-19  
**Baseline:** Post-cleanup audit. Replaces all Phase 1 state assumptions.  
**Authority:** This is the single source of truth for "what exists right now."

---

## 1. System Overview

### What Is Locked (Sprint 8 Baseline — Database Layer)

The Supabase PostgreSQL database is the production-hardened layer. It is **not being rebuilt** — it is being **wired to a new frontend**.

- 200 tables, all with RLS enabled
- 37 tables contain data (see GROUND_TRUTH_v2.md for full inventory)
- 25+ custom functions deployed (RBAC helpers, triggers, utilities)
- `handle_new_user` trigger auto-creates profiles on signup
- `audit_logs_immutable` trigger enforces NIST AU-9
- pgvector installed with 6 embeddings stored

### What Is Changing (Phase 2 — Next.js Migration)

The frontend is migrating from standalone HTML files (React CDN + Tailwind CDN) to a Next.js 14 App Router application. The Python/FastAPI backend is being replaced by Next.js server components and route handlers that query Supabase directly.

### Environments

| Environment | URL | Branch | Host |
|------------|-----|--------|------|
| Production | missionpulse.netlify.app | `main` | Netlify |
| Staging | Preview deploys | `v2-development` | Netlify |
| Database | djuviwarqdvlbgcfuupa.supabase.co | — | Supabase |
| Legacy API | missionpulse-api.onrender.com | — | Render (to be deprecated) |

### Repository

- **Single repo:** `missionpulse-frontend` on desktop at `C:\Users\MaryWomack\Desktop\missionpulse-frontend`
- **No second repo.** `missionpulse-v1` does NOT exist on desktop.
- **Branches:** `main` (production), `v2-development` (staging/dev)

---

## 2. Database Schema (MVP Tables)

### 2.1 `profiles` — Auth Pivot Table

The single most important table. Every RLS function queries it. The `handle_new_user` trigger inserts here on signup.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NO | — | PK, FK → `auth.users(id)` ON DELETE CASCADE |
| `email` | TEXT | NO | — | UNIQUE |
| `full_name` | TEXT | YES | — | Extracted from `raw_user_meta_data` or email prefix |
| `role` | TEXT | NO | `'CEO'` | See valid roles below |
| `company_id` | UUID | YES | — | FK → `companies(id)` |
| `avatar_url` | TEXT | YES | — | |
| `mfa_enabled` | BOOLEAN | NO | `false` | |
| `last_login` | TIMESTAMPTZ | YES | — | |
| `created_at` | TIMESTAMPTZ | NO | `now()` | |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | |

**Valid roles (from `is_internal_user()`):** executive, operations, capture_manager, volume_lead, author, admin, CEO, COO, CAP, PM, SA, FIN, CON, DEL, QA, subcontractor, teaming_partner, viewer

**Triggers:** `handle_new_user` (INSERT on auth.users → creates profiles row)  
**Indexes:** PK on `id`, UNIQUE on `email`  
**Data:** 3 rows (Mary's test accounts)

### 2.2 `companies` — Tenant Root

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `name` | TEXT | NO | — | |
| `domain` | TEXT | YES | — | |
| `solo_mode` | BOOLEAN | NO | `false` | Referenced by `is_user_solo_mode()` |
| `trial_ends_at` | TIMESTAMPTZ | YES | — | Set by `handle_new_company` trigger |
| `subscription_tier` | TEXT | YES | `'trial'` | |
| `settings` | JSONB | YES | `'{}'` | |
| `created_at` | TIMESTAMPTZ | NO | `now()` | |

**Triggers:** `handle_new_company` (sets 14-day trial on INSERT)  
**Data:** 1 row (Mission Meets Tech)

### 2.3 `opportunities` — Pipeline Core

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `company_id` | UUID | YES | — | FK → `companies(id)` |
| `title` | TEXT | NO | — | |
| `nickname` | TEXT | YES | — | |
| `description` | TEXT | YES | — | |
| `solicitation_number` | TEXT | YES | — | |
| `agency` | TEXT | YES | — | |
| `value` | NUMERIC | YES | — | Contract ceiling ($) |
| `pwin` | INTEGER | YES | — | CHECK 0–100 |
| `status` | TEXT | NO | `'Identification'` | Pipeline stage name |
| `submission_date` | DATE | YES | — | |
| `created_by` | UUID | YES | — | FK → `profiles(id)` |
| `tags` | TEXT[] | YES | — | |
| `metadata` | JSONB | YES | `'{}'` | |
| `created_at` | TIMESTAMPTZ | NO | `now()` | |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | |

**Data:** 5 rows

**⚠ SCHEMA DRIFT WARNING:** The Phase 1 `supabase-client.js` maps different column names: `name` (not `title`), `contract_value` (not `value`), `win_probability` (not `pwin`), `due_date` (column may not exist per GROUND_TRUTH), `shipley_phase` (not `status`). Before building Next.js queries, run this in Supabase SQL Editor to get the actual columns:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'opportunities'
ORDER BY ordinal_position;
```

### 2.4 `roles` — Reference Table

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `name` | TEXT | NO | — | UNIQUE |
| `display_name` | TEXT | NO | — | |
| `description` | TEXT | YES | — | |
| `type` | TEXT | YES | `'internal'` | internal / external |
| `is_active` | BOOLEAN | NO | `true` | |
| `created_at` | TIMESTAMPTZ | NO | `now()` | |

**Data:** 11 rows

### 2.5 `pipeline_stages` — Shipley Phase Config

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `name` | TEXT | NO | — | |
| `display_name` | TEXT | NO | — | |
| `stage_order` | INTEGER | NO | — | Sort order |
| `color` | TEXT | YES | — | Hex for UI |
| `is_active` | BOOLEAN | NO | `true` | |
| `created_at` | TIMESTAMPTZ | NO | `now()` | |

**Data:** 10 rows

### 2.6 `activity_log` — User Activity

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `user_id` | UUID | YES | — | FK → `profiles(id)` |
| `action` | TEXT | NO | — | |
| `entity_type` | TEXT | YES | — | |
| `entity_id` | UUID | YES | — | |
| `description` | TEXT | YES | — | |
| `metadata` | JSONB | YES | `'{}'` | |
| `created_at` | TIMESTAMPTZ | NO | `now()` | |

**Data:** 8 rows

### 2.7 `audit_logs` — Immutable (NIST AU-9)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `user_id` | UUID | YES | — | FK → `profiles(id)` |
| `action` | TEXT | NO | — | |
| `table_name` | TEXT | NO | — | |
| `record_id` | UUID | YES | — | |
| `old_values` | JSONB | YES | — | |
| `new_values` | JSONB | YES | — | |
| `ip_address` | INET | YES | — | |
| `created_at` | TIMESTAMPTZ | NO | `now()` | |

**Triggers:** `audit_logs_immutable` — RAISES EXCEPTION on UPDATE/DELETE  
**Data:** 2 rows

### 2.8 CUI Tables (Restricted Access)

| Table | CUI Category | Rows | Authorized Roles | RLS Function |
|-------|-------------|------|-----------------|-------------|
| `pricing_items` | SP-PROPIN | 0 | CEO, COO, CAP, FIN | `can_access_sensitive()` |
| `labor_categories` | SP-PROPIN | 35 | CEO, COO, CAP, FIN | `can_access_sensitive()` |
| `competitors` | OPSEC | 3 | CEO, COO, CAP | Role-list check |
| `competitor_ghosts` | OPSEC | 0 | CEO, COO, CAP | Role-list check |
| `intel_collection` | OPSEC | 0 | CEO, COO, CAP | Role-list check |
| `personnel_records` | SP-PRVCY | 0 | CEO, COO, DEL, Admin | Role-list check |

---

## 3. Supabase Auth Flow

### Providers Enabled

- **Email/password:** YES — signups open, email confirmation disabled
- **Social (Google, GitHub, etc.):** NO
- **Phone/SMS:** NO
- **SSO/SAML:** NO

### Signup → Profile Creation

1. User calls `supabase.auth.signUp({ email, password })`
2. Supabase creates row in `auth.users`
3. `handle_new_user` trigger fires, inserting into `public.profiles`:
   - `id` = `NEW.id` (from auth.users)
   - `email` = `NEW.email`
   - `full_name` = `COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))`
   - `role` = `'CEO'` ← **WARNING: Must change to 'viewer' before multi-user**

### Session & Refresh

**Current state: DOES NOT EXIST in frontend code.**

- No `signIn()` call in any HTML/JS file
- No session cookie management
- No token refresh middleware
- `supabase-client.js` creates an anonymous Supabase client with the anon key — no auth session

**Phase 2 will implement:** `@supabase/ssr` with cookie-based sessions and Next.js middleware refresh.

### Role Derivation

Roles are stored in `profiles.role` (not JWT custom claims). All RLS helper functions (`is_admin()`, `is_internal_user()`, `can_access_sensitive()`) query `profiles.role` via `auth.uid()` at query time.

---

## 4. RLS Policies

### Global State

All 200 tables have RLS enabled. The following policies are verified from GROUND_TRUTH_v2 and project knowledge:

### Helper Functions (All Deployed)

| Function | Returns | Checks |
|----------|---------|--------|
| `is_authenticated()` | boolean | `auth.uid() IS NOT NULL` |
| `is_admin()` | boolean | `profiles.role IN ('executive','operations','admin','CEO','COO')` |
| `is_internal_user()` | boolean | `profiles.role IN (15 internal roles)` |
| `can_access_sensitive()` | boolean | `profiles.role IN ('executive','operations','admin','CEO','COO','FIN')` |
| `get_user_role()` | text | Returns `profiles.role` for `auth.uid()` |
| `get_my_role()` | text | Same, defaults to `'viewer'` |
| `get_my_company_id()` | uuid | Returns `profiles.company_id` for `auth.uid()` |

### Per-Table Policy Summary (MVP Tables)

| Table | RLS | SELECT | INSERT | UPDATE | DELETE |
|-------|-----|--------|--------|--------|--------|
| `profiles` | ✅ | Own row OR `is_admin()` | Via trigger only | Own row OR `is_admin()` | — |
| `companies` | ✅ | `is_authenticated()` | `is_admin()` | `is_admin()` | — |
| `opportunities` | ✅ | `is_internal_user()` OR partner_access check | `is_internal_user()` | `is_internal_user()` | — |
| `roles` | ✅ | `is_authenticated()` | — | — | — |
| `pipeline_stages` | ✅ | `is_authenticated()` | — | — | — |
| `activity_log` | ✅ | `is_internal_user()` | `is_authenticated()` | — | — |
| `audit_logs` | ✅ | `is_admin()` | `is_authenticated()` | ❌ BLOCKED by trigger | ❌ BLOCKED by trigger |
| `pricing_items` | ✅ | `can_access_sensitive()` | `can_access_sensitive()` | — | — |
| `labor_categories` | ✅ | `can_access_sensitive()` | — | — | — |
| `competitors` | ✅ | Role-list (CEO/COO/CAP) | — | — | — |

**⚠ UNSUPPORTED:** Exact policy names and verbatim USING/WITH CHECK clauses are not available without a `pg_dump` of policy definitions. The logic above is derived from GROUND_TRUTH_v2 function descriptions and `Database_Schema_Documentation.docx`. To make this authoritative, run:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 5. Operational Checks

### Local Setup (Phase 2 — Next.js)

```bash
# Clone and setup
cd C:\Users\MaryWomack\Desktop\missionpulse-frontend
git checkout v2-development

# Install dependencies (after Next.js scaffold is created)
npm install

# Copy env template
cp .env.example .env.local
# Fill in Supabase keys

# Run dev server
npm run dev
```

### Verify RLS (Run in Supabase SQL Editor)

```sql
-- Confirm all MVP tables have RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles','companies','opportunities','roles','pipeline_stages','activity_log','audit_logs')
ORDER BY tablename;

-- Confirm helper functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('is_authenticated','is_admin','is_internal_user','can_access_sensitive','get_user_role','get_my_company_id');

-- Confirm audit immutability trigger
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public' AND event_object_table = 'audit_logs';
```

### Tests

**Existing:** `test_agents.py` — pytest suite for FastAPI backend (uses mock headers, not real auth). Will be deprecated when FastAPI is replaced.

**Phase 2 deliverable:** Playwright E2E tests (do not exist yet — defined in PHASE_2_RULES.md as Sprint 0).

---

## 6. Evidence Map

| Claim | Source | Method | Status |
|-------|--------|--------|--------|
| 200 tables with RLS | GROUND_TRUTH_v2.md | SQL query `pg_tables` on 2026-02-19 | ✅ VERIFIED |
| 37 tables with data | GROUND_TRUTH_v2.md | SQL query `pg_stat_user_tables` | ✅ VERIFIED |
| `handle_new_user` trigger deployed | GROUND_TRUTH_v2.md | `pg_trigger` + `pg_proc` queries | ✅ VERIFIED |
| `audit_logs_immutable` trigger | GROUND_TRUTH_v2.md | `pg_trigger` query | ✅ VERIFIED |
| All 6 RBAC helper functions deployed | GROUND_TRUTH_v2.md | `information_schema.routines` | ✅ VERIFIED |
| pgvector with 6 embeddings | GROUND_TRUTH_v2.md | Row count query | ✅ VERIFIED |
| 3 profiles exist | GROUND_TRUTH_v2.md | Row count query | ✅ VERIFIED |
| Email auth, no confirmation | GROUND_TRUTH_v2.md | Supabase dashboard inspection | ✅ VERIFIED |
| Supabase instance = djuviwarqdvlbgcfuupa | supabase-client.js line 23 | Code inspection | ✅ VERIFIED |
| Exact `opportunities` column names | — | — | ⚠ UNSUPPORTED — needs `information_schema` query |
| Exact RLS policy USING clauses | — | — | ⚠ UNSUPPORTED — needs `pg_policies` query |
| `profiles` column list | Database_Schema_Documentation.docx + GROUND_TRUTH_v2 | Inference from function logic | ⚠ PARTIAL — verify with `information_schema` |

### Assumptions (Non-Authoritative)

1. **`opportunities` columns** — Schema shown in §2.3 is reconstructed from `Database_Schema_Documentation.docx` and `supabase-client.js` field mappings. The two sources disagree on column names (`title` vs `name`, `value` vs `contract_value`, `pwin` vs `win_probability`). Must verify with live `information_schema` query.

2. **`profiles` has `company_id` column** — Inferred from `get_my_company_id()` function logic. Not directly confirmed.

3. **`profiles` has `avatar_url` and `updated_at`** — Common Supabase pattern but not explicitly confirmed in GROUND_TRUTH.

---

*Mission Meets Tech — Mission. Technology. Transformation.*  
*AI GENERATED — REQUIRES HUMAN REVIEW*
