# CURRENT_STATE.md — MissionPulse System Truth

**Version:** 3.1
**Last Updated:** 2026-02-28
**Verified against:** Live `information_schema.columns` exports + build verification + production readiness audit
**Authority:** This is the single source of truth for "what exists right now."

---

## 1. System Overview

### What Is Locked (Database Layer)

The Supabase PostgreSQL database is the production-hardened layer.

- 200+ tables, all with RLS enabled
- 37+ tables contain data (see GROUND_TRUTH_v2.md for full inventory)
- 25+ custom functions deployed (RBAC helpers, triggers, utilities)
- `handle_new_user` trigger auto-creates profiles on signup
- `audit_logs_immutable` trigger enforces NIST AU-9
- pgvector installed with embeddings stored
- 3 new billing tables: `subscription_plans`, `company_subscriptions`, `token_ledger`

### What Is Built (Frontend — v1.0 through v1.2)

Next.js 14 App Router application. All 16 v1.0 modules production-ready. v1.1 integrations and v1.2 collaboration features complete. 61 compiled routes. 8 AI agents operational.

### Environments

| Environment | URL | Branch | Host |
|------------|-----|--------|------|
| Production | missionpulse.netlify.app | `main` | Netlify |
| Staging | Preview deploys | `v2-development` | Netlify |
| Database | djuviwarqdvlbgcfuupa.supabase.co | — | Supabase |

### Repository

- **Single repo:** `missionpulse-frontend`
- **Branches:** `main` (production), `v2-development` (staging/dev) — synced
- **Domain:** missionpulse.ai (migrated from missionpulse.io on 2026-02-28)

---

## 2. Sprint Status

### v1.0 — Core Platform (S3–S18): ALL COMPLETE

All 16 modules production-ready. 61 compiled routes. Build: CLEAR.

| Sprint | Focus | Status |
|--------|-------|--------|
| S3 | Dashboard, Pipeline CRUD, War Room, Layout | COMPLETE |
| S4 | Shared DataTable, FormModal, shadcn/ui | COMPLETE |
| S5 | Opportunity Detail Tabs | COMPLETE |
| S6 | Pipeline table migration to DataTable | COMPLETE |
| S7 | Admin Panel + User Management | COMPLETE |
| S8 | Proposal Swimlane + Section Editor | COMPLETE |
| S9 | Compliance Matrix + Shredder | COMPLETE |
| S10 | AI Agent Pipeline + AskSage | COMPLETE |
| S11 | AI Chat + Solo Mode | COMPLETE |
| S12 | Token Usage Dashboard + Analytics | COMPLETE |
| S13 | HubSpot + SAM.gov Integrations | COMPLETE |
| S14 | Notifications + Activity Feed | COMPLETE |
| S15 | Settings + User Preferences | COMPLETE |
| S16 | Document Management + Upload | COMPLETE |
| S17 | Orals Prep + Post-Award | COMPLETE |
| S18 | Launch Readiness + Strategy | COMPLETE |

### v1.1 — Integrations & Performance (S19–S24): ALL COMPLETE

| Sprint | Focus | Status |
|--------|-------|--------|
| S19 | Performance & Analytics Foundation (Redis, indexes) | COMPLETE |
| S20 | Token Budget & Billing (Stripe, $149/$499/$2,500 pricing) | COMPLETE |
| S21 | Advanced Doc Gen (PPTX/XLSX/DOCX binders) | COMPLETE |
| S22 | Salesforce + GovWin IQ | COMPLETE |
| S23 | M365 + Slack | COMPLETE |
| S24 | Playbook v2 + Voice Profile | COMPLETE |

**S20 Amendments Applied:**
- A-1: Pricing $149/$499/$2,500 monthly (supersedes $99/$199/$299)
- A-2: Annual billing with 17% discount
- A-3: `annual_price` column on `subscription_plans`

### v1.2 — Collaboration & Proactive AI (S25–S28): ALL COMPLETE

| Sprint | Focus | Status |
|--------|-------|--------|
| S25 | USAspending + FPDS federal data | COMPLETE |
| S26 | Google Workspace + DocuSign | COMPLETE |
| S27 | Advanced RAG + Proactive AI + Fine-tuning | COMPLETE |
| S28 | Real-time Collab + Commenting + Teams | COMPLETE |

### GTM Extension (S-GTM-1 through S-GTM-3): NOT STARTED

Defined in `ROADMAP_GTM_EXTENSION.md`. Parallel track — does not consume S19–S28 numbers.

| Sprint | Focus | Status | Depends On |
|--------|-------|--------|-----------|
| S-GTM-1 | Multi-Model AI Abstraction | NOT STARTED | S19 (AI pipeline) |
| S-GTM-2 | Paid Pilot Infrastructure | NOT STARTED | S20 (billing) |
| S-GTM-3 | Public Marketing & Revenue Pages | NOT STARTED | None |

---

## 3. Database Schema (Key Tables)

### 3.1 `profiles` — Auth Pivot Table (13 columns)

Every RLS helper function queries this table. `handle_new_user` trigger inserts here on signup.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK, FK → `auth.users(id)` |
| `email` | varchar | UNIQUE |
| `full_name` | varchar | |
| `role` | varchar | Default 'Partner', trigger overrides to 'CEO' |
| `company_id` | uuid | FK → `companies(id)` |
| `status` | text | Default 'active' |

**No `mfa_enabled` column exists.** MFA functions reference it but it's not deployed.

### 3.2 `opportunities` — Pipeline Core (46 columns)

| Concept | Use This | Ignore |
|---------|----------|--------|
| Title | `title` | NOT `name` |
| Value | `ceiling` | NOT `contract_value` |
| Win prob | `pwin` | NOT `win_probability` |
| Phase | `phase` | NOT `shipley_phase`, `pipeline_stage` |
| Owner | `owner_id` | NOT `created_by` |

### 3.3 Billing Tables (Sprint 20 — NEW)

| Table | Purpose |
|-------|---------|
| `subscription_plans` | Plan definitions: name, slug, monthly_price, annual_price, token limits, features |
| `company_subscriptions` | Per-company: plan_id, status, billing_interval, Stripe IDs |
| `token_ledger` | Per-period: allocated, consumed, purchased, overage tokens |

---

## 4. Required Truth Files

| File | Purpose | Status |
|------|---------|--------|
| `database.types.ts` | Generated DB types | PRESENT (3 billing types manually added) |
| `roles_permissions_config.json` | RBAC matrix | PRESENT (v9.5) |
| `GROUND_TRUTH_v2.md` | Database reality audit | PRESENT |
| `PHASE_2_RULES.md` | Framework rules | PRESENT |
| `ROADMAP_v1.1_v1.2.md` | v1.1/v1.2 sprint plan | PRESENT |
| `ROADMAP_GTM_EXTENSION.md` | GTM parallel track | PRESENT |

---

## 5. Known Tech Debt

| Issue | Severity | Status |
|-------|----------|--------|
| `mfa_enabled` column missing from profiles | HIGH | OPEN — add column or remove SSP claims |
| `handle_new_user` defaults to CEO | HIGH | OPEN — change to 'viewer' before multi-user |
| 3 types manually added to `database.types.ts` | MEDIUM | OPEN — run SQL migration then `supabase gen types` to regenerate |
| `pwin` + `win_probability` duplicate columns | MEDIUM | Mitigated — code uses `pwin` only |
| `phase` + `shipley_phase` + `pipeline_stage` triplicates | MEDIUM | Mitigated — code uses `phase` only |
| `hubspot_field_mapping` + `hubspot_field_mappings` duplicate tables | LOW | Consolidation pending |
| 6 lint warnings (unused vars in Sprint 28 realtime code) | LOW | Non-blocking |
| GTM Amendments A-1/A-2/A-3 already applied to S20 code | INFO | Amendments are implemented |

---

## 6. Production Readiness Audit (2026-02-28)

### P0 — Backend Audit: COMPLETE
- 79/79 server actions verified as real Supabase queries (zero mocks)
- Fixed: Embeddings placeholder replaced with real ILIKE search
- Fixed: Landing page pricing updated to $149/$499/$2,500 (Amendment A-1)
- Fixed: Deleted dev-only `/api/seed` route
- Fixed: Created 6 OAuth callback routes (Salesforce, Slack, M365, DocuSign, Google, GovWin)
- Fixed: Migrated 14 files from missionpulse.io → missionpulse.ai
- Fixed: Added audit trail logging to 15 server actions across 7 files
- Fixed: Race condition in vote increment (now uses atomic RPC)

### P1 — Auth E2E: COMPLETE
- Fixed: Created `/reset-password` page + ResetPasswordForm (was 404)
- Fixed: Signup handles email confirmation (shows message instead of redirect)
- Fixed: Middleware only redirects auth-only routes, not all public routes
- Fixed: Open redirect vulnerability in auth callback (`next` param validation)
- Fixed: MFA enforcement in login flow (AAL check → redirect to /mfa)
- Fixed: MFA page rewritten for dual-mode (challenge + enrollment)
- Fixed: `requireMFA()` helper enforces AAL2 on CUI modules (pricing, blackhat, strategy)

### P2 — Module Verification: COMPLETE
- RFP Shredder: 100% wired (upload → parse → extract), zero mocks
- Compliance / Iron Dome: 100% wired (per-opp matrix + cross-opp aggregation)
- Notification System: Functional (page, bell, dropdown)
- Audit Trail: AU-9 compliant (30 files write audit_logs, immutable trigger)
- Fixed: Added immutable audit_logs to 7 shredder/compliance actions

### P3 — Testing & Docs: COMPLETE
- Fixed: 12 Playwright E2E test failures (stale selectors, deprecated syntax)
- Fixed: Deleted legacy smoke.spec.ts (.html routes)
- Fixed: Production config domain → missionpulse.ai
- Fixed: Added `test:e2e` and `test:e2e:prod` scripts to package.json
- Fixed: Stale missionpulse.io in seed-demo.ts

### Health Check (2026-02-28)

```
Build:            PASS (0 errors)
Type Safety:      PASS (0 errors, 0 as any)
Lint:             PASS (6 warnings)
Route Audit:      PASS (61 routes)
Auth Flow:        PASS (login, signup, reset, MFA, OAuth callbacks)
MFA Enforcement:  PASS (AAL2 on pricing, blackhat, strategy)
Audit Compliance: PASS (AU-9 immutability, 30+ files logging)
E2E Tests:        FIXED (12 failures resolved)
Overall:          CLEAR
```

---

## 7. Next Steps

**Option A — S-GTM-1 (Multi-Model AI Abstraction):**
Decouple from AskSage. Provider-agnostic interface. CUI-aware routing.

**Option B — S-GTM-2 (Paid Pilot Infrastructure):**
30-day pilots, engagement scoring, conversion tracking. Depends on S20 (done).

**Option C — S-GTM-3 (Public Marketing Pages):**
Public pricing page, 8(a) toolkit landing, newsletter. No dependencies.

---

*Mission Meets Tech — Mission. Technology. Transformation.*
*Last verified: 2026-02-28*
