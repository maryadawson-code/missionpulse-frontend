# GROUND_TRUTH_v2.md — MissionPulse Database Reality (From Live Supabase Export)

**Generated:** 2026-02-19  
**Method:** Direct Supabase SQL queries against `djuviwarqdvlbgcfuupa`  
**Previous assessment:** REALITY.md (2026-02-18) claimed "only 1 table confirmed." **That was wrong.**

---

## The Big Picture

| Metric | REALITY.md Said | Actual |
|--------|----------------|--------|
| Tables in Supabase | ~1 confirmed | **200 tables, all with RLS enabled** |
| Tables with data | 1 (opportunities) | **37 tables have rows** |
| RLS helper functions | "UNKNOWN if deployed" | **All 5 deployed + 20 more custom functions** |
| Auth trigger | "Does not exist" | **`handle_new_user` trigger auto-creates profiles** |
| Vector search | Not mentioned | **pgvector installed, 6 embeddings stored** |
| Audit immutability | "No write code exists" | **`audit_logs_immutable` trigger enforces NIST AU-9** |
| Profile records | "Zero code reads/writes" | **3 profiles exist** |

**Bottom line:** The database buildout happened. It's far more mature than the code audit suggested. The gap is that the *frontend and backend don't use it yet* — not that it doesn't exist.

---

## Tables With Data (37 total — ranked by row count)

### Tier 1: Seed/Reference Data (10+ rows)

| Table | Rows | Purpose |
|-------|------|---------|
| `labor_categories` | 35 | Labor cat rate definitions |
| `hubspot_field_mapping` | 18 | CRM field mapping |
| `hitl_queue` | 12 | Human-in-the-loop review queue |
| `hubspot_field_mappings` | 11 | CRM field mapping (duplicate table?) |
| `roles` | 11 | System role definitions |
| `playbook_items` | 10 | Playbook golden examples |
| `playbook_lessons` | 10 | Lessons learned entries |
| `pipeline_stages` | 10 | Shipley pipeline stage config |

### Tier 2: Operational Data (5–9 rows)

| Table | Rows | Purpose |
|-------|------|---------|
| `deal_sources` | 9 | Opportunity source tracking |
| `activity_log` | 8 | User activity events |
| `ai_routing_rules` | 8 | AI agent routing config |
| `risks` | 8 | Risk register entries |
| `knowledge_documents` | 8 | RAG knowledge base docs |
| `stage_mappings` | 8 | Pipeline stage mappings |
| `submissions` | 8 | Proposal submissions |
| `contracts` | 8 | Contract records |
| `partners` | 7 | Partner/teaming records |
| `solo_mode_phase_config` | 6 | Solo mode phase config |
| `knowledge_embeddings` | 6 | Vector embeddings (pgvector) |
| `discriminators` | 5 | Win theme discriminators |
| `risk_mitigations` | 5 | Risk mitigation actions |
| `opportunities` | 5 | Pipeline opportunities |
| `orals_questions` | 5 | Orals prep questions |

### Tier 3: Minimal Data (1–4 rows)

| Table | Rows | Purpose |
|-------|------|---------|
| `solo_task_outputs` | 4 | Solo mode outputs |
| `opportunity_comments` | 3 | Opportunity discussion |
| `competitors` | 3 | Competitor records |
| **`profiles`** | **3** | **User profiles (auth-linked)** |
| `opportunity_assignments` | 3 | Team assignments to opps |
| `audit_logs` | 2 | Immutable audit trail |
| `solo_gate_approvals` | 2 | Solo mode gate decisions |
| **`users`** | **2** | **User accounts** |
| `gate_reviews` | 1 | Shipley gate review |
| `pricing_models` | 1 | Pricing model |
| `projects` | 1 | Project record |
| `partner_access` | 1 | Partner access grant |
| `solo_proposals` | 1 | Solo mode proposal |
| **`companies`** | **1** | **Company record (Mission Meets Tech)** |

### Empty Tables: ~163 tables with 0 rows

Schema exists, RLS enabled, but no data. These are ready to be populated when frontend modules wire up.

---

## Custom Functions (Deployed & Verified)

### Security/RBAC Functions

| Function | Returns | Logic |
|----------|---------|-------|
| `is_authenticated()` | boolean | `auth.uid() IS NOT NULL` |
| `is_admin()` | boolean | Role in: executive, operations, admin, CEO, COO |
| `is_internal_user()` | boolean | Role in: executive, operations, capture_manager, volume_lead, author, admin, CEO, COO, CAP, PM, SA, FIN, CON, DEL, QA |
| `can_access_sensitive()` | boolean | Role in: executive, operations, admin, CEO, COO, FIN |
| `get_user_role()` | text | Returns role from profiles (2 overloads) |
| `get_my_role()` | text | Returns role via `auth.uid()`, defaults to 'viewer' |
| `get_user_company_id()` | uuid/text | Returns company_id from profiles (2 overloads) |
| `get_my_company_id()` | uuid | Company_id via `auth.uid()` |
| `is_mfa_enabled()` | boolean | Checks `mfa_enabled` column in profiles |
| `requires_mfa()` | boolean | True for CEO, COO, Admin, CAP, FIN |
| `check_mfa_compliance()` | boolean | Combines requires_mfa + is_mfa_enabled |
| `is_account_locked()` | boolean | Checks auth_lockout table |
| `is_user_solo_mode()` | boolean | Checks company solo_mode flag |

### Trigger Functions

| Function | Fires On | Logic |
|----------|----------|-------|
| **`handle_new_user`** | **INSERT on auth.users** | **Auto-creates profile row with email, name, role='CEO'** |
| `handle_new_company` | INSERT on companies | Sets 14-day trial, creates sample opportunity |
| `audit_logs_immutable` | UPDATE/DELETE on audit_logs | **Raises exception — enforces NIST AU-9 immutability** |
| `auto_revoke_partner_access` | UPDATE on opportunities | Revokes partner access when status → Submitted |
| `playbook_search_vector_update` | INSERT/UPDATE on playbook | Updates full-text search vector |
| `generate_lesson_code` | INSERT on lessons_learned | Auto-generates LL-YYYYMM-NNNN codes |
| `generate_question_number` | INSERT on rfi_questions | Auto-generates Q-NNN codes |
| `generate_report_code` | INSERT on executive_reports | Auto-generates RPT-YYYYMMDD-NNN codes |
| `generate_risk_id_code` | INSERT on risk_register | Auto-generates R-NNN codes |
| `ensure_single_default_filter` | INSERT/UPDATE on saved_filters | Enforces single default |
| `check_deliverable_overdue` | UPDATE on contract_deliverables | Auto-marks overdue |

### Utility Functions

| Function | Purpose |
|----------|---------|
| `get_or_create_chat_session` | Find recent session or create new (1hr window) |
| `add_chat_message` | Insert message + update session counters |
| `log_cui_classification` | Log CUI classification decisions to audit |
| `increment_votes` / `decrement_votes` | Feature suggestion voting |
| `refresh_audit_consolidated` | Refresh materialized audit view |

### pgvector (Installed)

Vector extension is active with `halfvec`, `sparsevec`, `vector` types and HNSW/IVFFlat index support. Used by `knowledge_embeddings` table (6 rows).

---

## Auth Architecture (Revised Assessment)

### What Actually Exists

1. **Supabase Auth is configured:** Email provider enabled, signups open, no email confirmation
2. **`handle_new_user` trigger deployed:** When someone signs up via Supabase Auth, a `profiles` row is auto-created with role='CEO'
3. **3 profiles exist:** Someone has signed up (likely Mary's test accounts)
4. **All RLS helper functions query `profiles.role`:** The auth→profile→RLS chain is designed and deployed

### What's Missing

1. **Frontend login UI:** No `signIn()` call in any HTML/JS file
2. **Backend JWT verification:** Still using header stub
3. **Session management:** No middleware to refresh tokens
4. **MFA enforcement:** Functions exist (`requires_mfa`, `is_mfa_enabled`) but no UI

### The Auth Gap Is UI-Only

The database security layer is built. The gap is a login page + session handling in the frontend/backend. This is a much smaller lift than building auth from scratch.

---

## Revised Risk Assessment

| Previous Risk | Revised Status |
|--------------|---------------|
| "AI agent builds against non-existent architecture" | **PARTIALLY RESOLVED** — 200 tables exist, but 163 are empty |
| "Auditor finds SSP claims unsupported by code" | **PARTIALLY RESOLVED** — RLS, audit immutability, and helper functions are deployed. Login UI is the gap. |
| "Data written to SQLite lost on redeploy" | **STILL TRUE** — token_usage and playbook_entries need Supabase migration (tables already exist in Supabase!) |
| "New developer assumes JWT auth exists" | **PARTIALLY TRUE** — auth trigger exists, login UI doesn't |

---

## Key Decisions for Phase 2

1. **`profiles` is the auth pivot table.** All RLS functions query it. The Next.js login flow must create/use profiles via `handle_new_user` trigger.

2. **`opportunities` has 5 rows** (not 12 per earlier count). Either rows were deleted or pg_stat is stale. Verify in Supabase Table Editor.

3. **Two duplicate tables exist:** `hubspot_field_mapping` (18 rows) and `hubspot_field_mappings` (11 rows). Need to consolidate.

4. **pgvector is ready.** 6 embeddings already stored. RAG/knowledge search can be wired immediately.

5. **SQLite migration is trivial.** Supabase already has `playbook_entries`, `playbook_items`, `playbook_lessons`, `token_usage` tables. Just need to point the Python backend at Supabase instead of local SQLite.

---

*Mission Meets Tech — Mission. Technology. Transformation.*  
*AI GENERATED — REQUIRES HUMAN REVIEW*
