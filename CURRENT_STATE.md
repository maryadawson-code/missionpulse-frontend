# CURRENT_STATE.md — MissionPulse System Truth

**Version:** 2.0  
**Generated:** 2026-02-19  
**Verified against:** Live `information_schema.columns` exports from `djuviwarqdvlbgcfuupa`  
**Authority:** This is the single source of truth for "what exists right now."

---

## 1. System Overview

### What Is Locked (Database Layer)

The Supabase PostgreSQL database is the production-hardened layer. It is **not being rebuilt** — it is being **wired to a new frontend**.

- 200 tables, all with RLS enabled
- 37 tables contain data (see GROUND_TRUTH_v2.md for full inventory)
- 25+ custom functions deployed (RBAC helpers, triggers, utilities)
- `handle_new_user` trigger auto-creates profiles on signup
- `audit_logs_immutable` trigger enforces NIST AU-9
- pgvector installed with 6 embeddings stored

### What Is Changing (Phase 2 — Next.js Migration)

The frontend migrates from standalone HTML files (React CDN + Tailwind CDN) to a Next.js 14 App Router application. The Python/FastAPI backend is replaced by Next.js server components and route handlers that query Supabase directly.

### Environments

| Environment | URL | Branch | Host |
|------------|-----|--------|------|
| Production | missionpulse.netlify.app | `main` | Netlify |
| Staging | Preview deploys | `v2-development` | Netlify |
| Database | djuviwarqdvlbgcfuupa.supabase.co | — | Supabase |
| Legacy API | missionpulse-api.onrender.com | — | Render (deprecated) |

### Repository

- **Single repo:** `missionpulse-frontend` at `C:\Users\MaryWomack\Desktop\missionpulse-frontend`
- **No second repo.** `missionpulse-v1` does NOT exist on desktop.
- **Branches:** `main` (production), `v2-development` (staging/dev)

---

## 2. Database Schema (Verified from Live Exports)

### 2.1 `profiles` — Auth Pivot Table (13 columns, 3 rows)

Every RLS helper function queries this table. `handle_new_user` trigger inserts here on signup.

| # | Column | Type | Nullable | Default | Notes |
|---|--------|------|----------|---------|-------|
| 1 | `id` | uuid | NO | — | PK, FK → `auth.users(id)` ON DELETE CASCADE |
| 2 | `email` | varchar | NO | — | UNIQUE |
| 3 | `full_name` | varchar | YES | — | From `raw_user_meta_data` or email prefix |
| 4 | `role` | varchar | YES | `'Partner'` | **Column default is 'Partner'.** `handle_new_user` trigger overrides to 'CEO'. |
| 5 | `company` | varchar | YES | — | Company name (text). See also `company_id`. |
| 6 | `phone` | varchar | YES | — | |
| 7 | `avatar_url` | text | YES | — | |
| 8 | `preferences` | jsonb | YES | `'{}'` | User preference store |
| 9 | `created_at` | timestamptz | YES | `now()` | |
| 10 | `updated_at` | timestamptz | YES | `now()` | |
| 11 | `company_id` | uuid | YES | — | FK → `companies(id)`. Coexists with `company` (varchar). |
| 12 | `status` | text | YES | `'active'` | Account status |
| 13 | `last_login` | timestamptz | YES | — | |

**⚠ CRITICAL FINDINGS:**

1. **No `mfa_enabled` column exists.** GROUND_TRUTH_v2.md listed `is_mfa_enabled()`, `requires_mfa()`, and `check_mfa_compliance()` as deployed functions. These functions either query a different table or are broken. **Must verify before referencing MFA in SSP claims.**

2. **Dual company reference:** Both `company` (varchar — display name) and `company_id` (uuid — FK) exist. RLS functions use `get_my_company_id()` which queries `company_id`. The `company` varchar field is for display.

3. **Role default is 'Partner', not 'CEO'.** The `handle_new_user` trigger hardcodes `role = 'CEO'` which overrides the column default. If someone inserts into profiles directly (bypassing the trigger), they get 'Partner'.

**Valid roles (from RBAC helper functions):** executive, operations, capture_manager, volume_lead, author, admin, CEO, COO, CAP, PM, SA, FIN, CON, DEL, QA, subcontractor, teaming_partner, viewer, Partner

---

### 2.2 `opportunities` — Pipeline Core (46 columns, 5 rows)

**Verified from live `information_schema` export on 2026-02-19.**

| # | Column | Type | Nullable | Default | Notes |
|---|--------|------|----------|---------|-------|
| 1 | `id` | uuid | NO | `gen_random_uuid()` | PK |
| 2 | `title` | varchar | NO | — | Primary display name |
| 3 | `nickname` | varchar | YES | — | Short name |
| 4 | `description` | text | YES | — | |
| 5 | `agency` | varchar | YES | — | Contracting agency |
| 6 | `sub_agency` | varchar | YES | — | |
| 7 | `contract_vehicle` | varchar | YES | — | IDIQ, BPA, etc. |
| 8 | `naics_code` | varchar | YES | — | |
| 9 | `set_aside` | varchar | YES | — | SDVOSB, 8(a), etc. |
| 10 | `ceiling` | numeric | YES | — | Contract dollar value |
| 11 | `period_of_performance` | varchar | YES | — | PoP description |
| 12 | `due_date` | timestamptz | YES | — | Proposal due date |
| 13 | `phase` | varchar | YES | `'Gate 1'` | Shipley gate (Gate 1–6) |
| 14 | `status` | varchar | YES | `'Active'` | Active, Won, Lost, No-Bid |
| 15 | `priority` | varchar | YES | `'Medium'` | Low, Medium, High, Critical |
| 16 | `pwin` | integer | YES | `50` | Win probability (0–100) |
| 17 | `go_no_go` | varchar | YES | — | Go/No-Go decision |
| 18 | `incumbent` | varchar | YES | — | Current contract holder |
| 19 | `solicitation_number` | varchar | YES | — | |
| 20 | `sam_url` | text | YES | — | SAM.gov listing URL |
| 21 | `notes` | text | YES | — | |
| 22 | `owner_id` | uuid | YES | — | FK → `profiles(id)` — opportunity owner |
| 23 | `created_at` | timestamptz | YES | `now()` | |
| 24 | `updated_at` | timestamptz | YES | `now()` | |
| 25 | `hubspot_deal_id` | text | YES | — | HubSpot CRM link |
| 26 | `hubspot_synced_at` | timestamptz | YES | — | Last HubSpot sync |
| 27 | `deal_source` | text | YES | `'manual'` | manual, hubspot, sam_gov |
| 28 | `pipeline_stage` | text | YES | `'qualification'` | ⚠ DUPLICATE — prefer `phase` |
| 29 | `close_date` | date | YES | — | Expected close |
| 30 | `contact_email` | text | YES | — | Primary contact email |
| 31 | `contact_name` | text | YES | — | Primary contact name |
| 32 | `sam_opportunity_id` | text | YES | — | SAM.gov ID |
| 33 | `govwin_id` | text | YES | — | GovWin tracking ID |
| 34 | `place_of_performance` | text | YES | — | |
| 35 | `is_recompete` | boolean | YES | `false` | |
| 36 | `bd_investment` | numeric | YES | `0` | B&P spend tracking ($) |
| 37 | `tags` | ARRAY | YES | — | Text array |
| 38 | `custom_properties` | jsonb | YES | `'{}'` | User-facing metadata |
| 39 | `company_id` | uuid | YES | — | FK → `companies(id)` |
| 40 | `win_probability` | integer | YES | `50` | ⚠ DUPLICATE of `pwin` |
| 41 | `shipley_phase` | text | YES | — | ⚠ DUPLICATE of `phase` |
| 42 | `submission_date` | timestamptz | YES | — | |
| 43 | `award_date` | timestamptz | YES | — | |
| 44 | `pop_start` | timestamptz | YES | — | Period of performance start |
| 45 | `pop_end` | timestamptz | YES | — | Period of performance end |
| 46 | `metadata` | jsonb | YES | `'{}'` | System metadata |

**⚠ DUPLICATE COLUMN STANDARDIZATION:**

| Concept | Use This | Ignore These | Rationale |
|---------|----------|-------------|-----------|
| Win probability | `pwin` (col 16) | `win_probability` (col 40) | Shorter, same default, more readable |
| Pipeline stage | `phase` (col 13, default 'Gate 1') | `shipley_phase` (col 41), `pipeline_stage` (col 28) | Has default value, maps to Shipley gates |
| Lifecycle status | `status` (col 14, default 'Active') | — | Active/Won/Lost/No-Bid |
| Metadata | `custom_properties` (col 38) | `metadata` (col 46) | User-facing vs system |

**Phase 1 JS → Actual DB Column Mapping:**

| supabase-client.js used | Actual column | Match? |
|------------------------|---------------|--------|
| `name` | `title` | ❌ WRONG |
| `contractValue` / `contract_value` | `ceiling` | ❌ WRONG |
| `winProbability` / `win_probability` | `pwin` (preferred) | ⚠ DUPLICATE EXISTS |
| `shipleyPhase` / `shipley_phase` | `phase` (preferred) | ⚠ DUPLICATE EXISTS |
| `dueDate` / `due_date` | `due_date` | ✅ CORRECT |
| `primaryContact` | `contact_name` + `contact_email` | ❌ SPLIT |

---

### 2.3 Other Tables (Not Yet Verified)

| Table | Rows | Verified? | Notes |
|-------|------|-----------|-------|
| `companies` | 1 | ❌ | Run info_schema query to verify |
| `roles` | 11 | ❌ | |
| `pipeline_stages` | 10 | ❌ | |
| `activity_log` | 8 | ❌ | |
| `audit_logs` | 2 | ❌ | Immutability trigger verified |
| `labor_categories` | 35 | ❌ | CUI // SP-PROPIN |
| `competitors` | 3 | ❌ | CUI // OPSEC |

To verify any table:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'TABLE_NAME_HERE'
ORDER BY ordinal_position;
```

---

## 3. Supabase Auth Flow

### Providers

- **Email/password:** YES — signups open, email confirmation disabled
- **Social, Phone, SSO:** NO

### Signup → Profile Creation

1. `supabase.auth.signUp({ email, password })` → row in `auth.users`
2. `handle_new_user` trigger → row in `profiles` with `role = 'CEO'`
3. Column default is `'Partner'` but trigger overrides to `'CEO'`
4. **⚠ Change trigger to `'viewer'` before multi-user launch**

### Session Management

**Does not exist.** No `signIn()`, no cookies, no refresh. Phase 2 implements `@supabase/ssr`.

### Role Derivation

`profiles.role` queried by all RLS functions via `auth.uid()`. Not in JWT claims.

---

## 4. RLS & Helper Functions

### Core Functions (Verified Deployed)

| Function | Checks `profiles.role` IN |
|----------|--------------------------|
| `is_admin()` | executive, operations, admin, CEO, COO |
| `is_internal_user()` | 15 internal roles |
| `can_access_sensitive()` | executive, operations, admin, CEO, COO, FIN |
| `get_user_role()` | Returns role, defaults to 'viewer' |
| `get_my_company_id()` | Returns `company_id` from profiles |
| `is_authenticated()` | `auth.uid() IS NOT NULL` |

### MFA Functions (⚠ LIKELY BROKEN)

| Function | Expects | Reality |
|----------|---------|---------|
| `is_mfa_enabled()` | `profiles.mfa_enabled` column | **Column does not exist** |
| `requires_mfa()` | Hardcoded role check | Roles exist, no enforcement |
| `check_mfa_compliance()` | Combines above | **Broken** |

**Action:** Either add `ALTER TABLE profiles ADD COLUMN mfa_enabled BOOLEAN DEFAULT false;` or remove MFA references from SSP.

---

## 5. Known Schema Debt

| Issue | Severity | Recommended Action |
|-------|----------|-------------------|
| `mfa_enabled` column missing | **HIGH** | Add to profiles OR remove MFA SSP claims |
| `handle_new_user` defaults to CEO | **HIGH** | Change to 'viewer' before multi-user |
| `pwin` + `win_probability` duplicates | MEDIUM | Use `pwin` in Next.js. Ignore `win_probability`. |
| `phase` + `shipley_phase` + `pipeline_stage` triplicates | MEDIUM | Use `phase` for gates, `status` for lifecycle |
| `company` (varchar) + `company_id` (uuid) on profiles | LOW | `company_id` for FK/RLS. `company` for display. |
| `hubspot_field_mapping` + `hubspot_field_mappings` | LOW | Consolidate later |
| 163 empty tables | LOW | Populate as modules wire up |

---

## 6. Evidence Map

| Claim | Source | Status |
|-------|--------|--------|
| `profiles` has 13 columns, no `mfa_enabled` | Live info_schema export 2/19 | ✅ VERIFIED |
| `profiles.role` defaults to `'Partner'` | Live export | ✅ VERIFIED |
| `opportunities` has 46 columns | Live info_schema export 2/19 | ✅ VERIFIED |
| `ceiling` is dollar field (not `value`) | Live export | ✅ VERIFIED |
| `owner_id` is profile FK (not `created_by`) | Live export | ✅ VERIFIED |
| `pwin` AND `win_probability` both exist | Live export | ✅ VERIFIED |
| 200 tables with RLS, 37 with data | GROUND_TRUTH_v2.md | ✅ VERIFIED |
| `handle_new_user` trigger deployed | GROUND_TRUTH_v2.md | ✅ VERIFIED |
| `audit_logs_immutable` trigger | GROUND_TRUTH_v2.md | ✅ VERIFIED |
| All 6 core RBAC functions | GROUND_TRUTH_v2.md | ✅ VERIFIED |
| Supabase instance ID | supabase-client.js line 23 | ✅ VERIFIED |
| `companies` columns | GROUND_TRUTH inference | ⚠ UNVERIFIED |
| MFA functions query `profiles.mfa_enabled` | GROUND_TRUTH_v2.md claim | ❌ COLUMN MISSING |

---

*Mission Meets Tech — Mission. Technology. Transformation.*  
*AI GENERATED — REQUIRES HUMAN REVIEW*
