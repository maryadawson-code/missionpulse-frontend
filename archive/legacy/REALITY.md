# REALITY.md — MissionPulse Ground Truth

**Generated:** 2026-02-18
**Method:** Code inspection only. Where docs conflict with code, code wins.
**Owner:** Mary Womack (Mission Meets Tech)

---

## 1. What Actually Runs

### Backend (Python — FastAPI)

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `main.py` | 266 | FastAPI app factory, CORS, middleware, router registration | **Live** on Render |
| `agents.py` | 799 | 8 AI agent endpoints with RBAC + streaming | **Live** — only route module |
| `base_agent.py` | 599 | Abstract agent class, Anthropic SDK integration | **Live** |
| `token_tracker.py` | 629 | Token usage + cost tracking | **Live** — writes to **local SQLite** |
| `playbook_engine.py` | 646 | Golden examples knowledge base | **Live** — writes to **local SQLite** |
| `prompt_manager.py` | ~600 | System prompt templates per agent | **Live** |
| `app_v3.py` | 1510 | Streamlit portal (separate from FastAPI) | **Live** — parallel app |
| `lessons_v3.py` | ~1200 | Playbook manager for Streamlit | **Live** — Streamlit only |
| `test_agents.py` | 669 | Pytest suite for agent routes | **Tests exist** |

**Total executable Python:** ~6,918 lines across 9 files.

### Frontend (Standalone HTML + JS)

| Component | Count | Purpose |
|-----------|-------|---------|
| HTML module files | 29 | Standalone pages (React+Tailwind via CDN) |
| `supabase-client.js` | 552 lines | Supabase connection + opportunities CRUD |
| `index.html` | 1 | Dashboard entry point |

**Frontend connects to:** Supabase project `djuviwarqdvlbgcfuupa` via anon key.
**Frontend auth:** None. Zero references to `signIn`, `getUser`, or `session` in any HTML or JS file.
**Frontend DB operations:** CRUD on `opportunities` table only.

### Infrastructure

| Service | Config | Actually Used? |
|---------|--------|---------------|
| Render (API hosting) | `missionpulse-api.onrender.com` | **Yes** |
| Netlify (frontend) | `missionpulse.netlify.app` | **Yes** |
| Supabase `djuviwarqdvlbgcfuupa` | PostgreSQL 15 | **Yes** — frontend only |
| Docker Compose (PostgreSQL + Redis) | `docker-compose.yml` | **No** — defined but nothing connects |

---

## 2. Routing Structure

### Live Endpoints (verified from `main.py` + `agents.py`)

| Method | Path | Auth | Source |
|--------|------|------|--------|
| GET | `/api/health` | None | `main.py:186` |
| GET | `/api/version` | None | `main.py:196` |
| GET | `/api/agents` | Stub | `agents.py:384` |
| GET | `/api/agents/{agent_id}` | Stub | `agents.py:415` |
| POST | `/api/agents/{agent_id}/chat` | Stub | `agents.py:442` |
| POST | `/api/agents/{agent_id}/analyze` | Stub | `agents.py` (later in file) |
| GET | `/api/agents/{agent_id}/usage` | Stub | `agents.py` (later in file) |
| GET | `/api/agents/health` | None | `agents.py` (later in file) |

**Prefix:** `/api` — no versioning (`/api/v1` does not exist in code).
**Registration:** `main.py:216` — `app.include_router(agents_router, prefix="/api")`

### Endpoints That Do NOT Exist (despite documentation)

The following are described in README files and project knowledge but have zero code:

- `/auth/*` (12 endpoints: register, login, MFA, refresh, password reset)
- `/users/*` (14 endpoints: profile CRUD, role management, sessions)
- `/opportunities/*` (16 endpoints: pipeline CRUD, SAM.gov sync, gate decisions)
- `/proposals/*` (Shipley workflow, sections, reviews, milestones)
- `/audit/*` (event queries, compliance reports)
- `/playbook/*` (example CRUD, search, QA workflow)

**Total documented-but-missing:** ~60+ endpoints across 5 route modules.

---

## 3. Authentication

### What Exists: Header-Based Stub

```
File: agents.py, lines 310-332
Function: get_current_user_stub(request: Request)
```

- Reads `X-User-Role` header (default: `"executive"` — highest privilege)
- Reads `X-User-Id` header (default: `"user_001"`)
- Reads `X-User-Org-Type` header (default: `"internal"`)
- **No token validation. No cryptographic verification. No session management.**
- Any HTTP client can claim any identity by setting headers.

### RBAC Is Real But Toothless

`check_agent_access()` at `agents.py:335-357` correctly implements:
- 8-level role hierarchy (subcontractor → executive)
- External partner blocking for sensitive agents (pricing, blackhat, strategy)
- Invisible RBAC (returns 404, not 403)

But since identity is self-asserted, RBAC is **security theater**.

### What Does NOT Exist

- JWT token issuance or verification
- Supabase Auth integration
- MFA / TOTP
- Password hashing (passlib is in requirements.txt but never imported)
- Session management
- Token refresh

---

## 4. Data Storage

### Three Databases — No Synchronization

| Database | Used By | Tables Known | Connection |
|----------|---------|-------------|------------|
| **SQLite (local files)** | `token_tracker.py`, `playbook_engine.py` | `token_usage`, `playbook_entries` (+ FTS5 index) | Python `sqlite3` direct |
| **Supabase PostgreSQL** (`djuviwarqdvlbgcfuupa`) | `supabase-client.js` (frontend only) | `opportunities` (confirmed via JS CRUD operations) | Supabase JS SDK, anon key |
| **Docker PostgreSQL** | Nothing | None created | `asyncpg` connection string in docker-compose, zero code uses it |

### Backend Python Cannot Read Supabase Data

The Python backend has **no import of `supabase`**, no connection string to `djuviwarqdvlbgcfuupa`, and no `asyncpg` driver usage. The 12 opportunities worth ~$847M in the Supabase pipeline are invisible to the API.

### Migration Approach: Manual SQL

- No Alembic, Flyway, or migration tooling
- No `.sql` files in the repo
- Schema changes are pasted into Supabase Dashboard SQL Editor
- No version tracking for schema changes
- No rollback capability

---

## 5. Documentation vs. Reality Gap

### By the Numbers

| Category | Doc Claims | Code Reality |
|----------|-----------|--------------|
| Route modules | 6 modules, ~4,700 lines | 1 module, 799 lines |
| API endpoints | ~68 endpoints | 8 endpoints |
| Auth system | JWT + MFA + password reset | Header stub |
| ORM models | 5 SQLAlchemy model files | Zero ORM code |
| Pydantic schemas | 9 schema files | Inline models in agents.py only |
| DB migrations | Alembic implied | No migration tool |
| Audit logging | audit_logs table + triggers | No write code exists |
| RLS policies | 103 policies documented | Only enforced via Supabase JS (frontend); backend bypasses entirely |

### Documentation Inventory (688 KB total)

**37 markdown files** in repo root. Categories:

- **Sprint handoffs/continuations:** 12 files (~150 KB) — describe work to do, not work done
- **Production plans/roadmaps:** 8 files (~200 KB) — aspirational timelines
- **Architecture/schema docs:** 5 files (~100 KB) — describe intended architecture
- **Compliance/security docs:** 4 `.md` + 10 `.docx` files — reference controls enforced by code that doesn't exist

### Risk Assessment

| Risk | Severity | Trigger |
|------|----------|---------|
| AI agent builds against documented (non-existent) architecture | **HIGH** | Every new session |
| Auditor finds SSP claims unsupported by code | **CRITICAL** | Any compliance review |
| New developer assumes JWT auth exists | **HIGH** | Onboarding |
| Data written to SQLite is lost on Render redeploy | **HIGH** | Every deploy |

---

## 6. Locked Architectural Decisions (2026-02-18)

| Decision | Choice | Status |
|----------|--------|--------|
| Route prefix | `/api` | LOCKED |
| Canonical database | Supabase `djuviwarqdvlbgcfuupa` | LOCKED |
| Backend-to-DB method | `supabase-py` SDK | LOCKED |
| Auth (interim) | Keep stub with TECH-DEBT markers | LOCKED — replaced by AUTH-001 |
| Auth (target) | Supabase JWT verification | PLANNED — AUTH-001 |
| New SQLite tables | PROHIBITED | LOCKED |
| Doc cleanup | Move aspirational docs to `docs/future/` | PLANNED — API-001 |

---

## 7. Files in This Repo

### Executable Code (keep in root)

```
main.py                          # FastAPI app factory
agents.py                        # AI agent routes (only route module)
base_agent.py                    # Abstract agent base class
token_tracker.py                 # Token usage tracking (SQLite → migrate to Supabase)
playbook_engine.py               # Playbook learning engine (SQLite → migrate to Supabase)
prompt_manager.py                # System prompt templates
app_v3.py                        # Streamlit portal (separate app)
lessons_v3.py                    # Streamlit playbook manager
test_agents.py                   # Agent test suite
__init__.py                      # Package init
requirements.txt                 # Python dependencies
docker-compose.yml               # Container config (unused but retained)
```

### Frontend (keep in root — Netlify serves from `.`)

```
index.html                       # Dashboard
supabase-client.js               # DB client
missionpulse-*.html              # 28 module pages
missionpulse-*.jsx               # 4 React component files
netlify.toml                     # Netlify config
```

### Config / Brand (keep in root)

```
roles_permissions_config.json    # RBAC definitions
missionpulse_playbook.json       # Playbook seed data
rockit_playbook_v2.json          # Legacy playbook data
tokens.json                      # Design tokens
MISSIONPULSE_V12_DESIGN_SYSTEM.css
MISSIONPULSE_V12_DEMO_DATA.json
MMT_*.png                        # Brand assets
Mission_Meets_Tech_Brand_Package.pdf
```

### Compliance Artifacts (keep — but flag gap between claims and code)

```
MissionPulse_SSP_CMMC_Level2_v2_1.docx
MissionPulse_POAM_CMMC_Level2_v2_1.docx
MissionPulse_CUI_Procedures_v2_1.docx
MissionPulse_Control_Matrix_v2_1.xlsx
Access_Control_Policy.docx
Configuration_Management_Policy.docx
Risk_Management_Policy.docx
Incident_Response_Plan.docx
Database_Schema_Documentation.docx
Evidence_Index.xlsx
Training_Completion_Tracker.xlsx
Tabletop_Exercise_Report.docx
Internal_Review_Report.docx
SSP_Signature_Page.docx
CUI_Data_Flow_Diagram.mermaid
```

### Quarantine to `docs/future/` (aspirational — not implemented)

```
README.md                                    # Claims backend/app/ structure that doesn't exist
README_CHUNK3_SERVICES.md                    # Services not built
MISSIONPULSE_DATABASE_SCHEMA.md              # 55+ tables; only ~1 confirmed in frontend code
MISSIONPULSE_4WEEK_PRODUCTION_PLAN.md
MISSIONPULSE_4WEEK_PRODUCTION_SPRINT_PLAN.md
MISSIONPULSE_PRODUCTION_PHASES.md
MISSIONPULSE_PRODUCTION_SPRINTS.md
MISSIONPULSE_PRODUCTION_ROADMAP.md
MISSIONPULSE_PRODUCTION_LAUNCH.md
MISSIONPULSE_RELEASE_ROADMAP.md
MISSIONPULSE_V2_PRODUCTION_PLAN.md
MISSIONPULSE_V2_SPRINT_PLAN_FINAL.md
MISSIONPULSE_SPRINT_HANDOFF.md
MISSIONPULSE_SPRINT_EXECUTION_PROMPT.md
MISSIONPULSE_SPRINT_CONTINUATION_PROMPT.md
MISSIONPULSE_CONTINUATION_PROMPT.md
MISSIONPULSE_CONTINUATION_PROMPT_V4.md
MISSIONPULSE_CONTINUATION_JAN30.md
MISSIONPULSE_CONTINUATION_JAN30_V2.md
MISSIONPULSE_V2_CONTINUATION_PROMPT.md
MISSIONPULSE_HANDOFF_JAN27.md
MISSIONPULSE_HANDOFF_JAN28_SESSION2.md
MISSIONPULSE_HANDOFF_JAN29.md
MISSIONPULSE_HANDOFF_JAN30_FINAL.md
MISSIONPULSE_HANDOFF_JAN30_SPRINT.md
MISSIONPULSE_V2_HANDOFF_JAN29.md
MISSIONPULSE_TURBO_MODE.md
MISSIONPULSE_INTEGRATION_AUDIT.md
MISSIONPULSE_MVP_GAP_ANALYSIS.md
MISSIONPULSE_TRAINING_PACKAGE.md
MISSIONPULSE_V2_RELEASE_NOTES.md
MISSIONPULSE_V2_LESSONS_LEARNED.md
CHUNK6B_COMPLETION_SUMMARY.md
SPRINT47_HANDOFF.md
DEPLOYMENT_INSTRUCTIONS.md
INVESTOR_DEMO_QUICK_REF.md
01_MissionPulse_Architecture.md
02_Compliance_Overlay_DHA.md
03_Threat_Model_LLM.md
04_Output_Template_SSP.md
missionpulse-ai-architect-system-prompt-v2.md
```

Each quarantined file gets a header:
```
> **STATUS: NOT IMPLEMENTED**
> This document describes planned/aspirational architecture.
> See REALITY.md for current system state.
> Moved to docs/future/ on 2026-02-18 per API-001.
```

---

*Mission Meets Tech — Mission. Technology. Transformation.*
*AI GENERATED — REQUIRES HUMAN REVIEW*
