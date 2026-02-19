# STABILIZATION_ROADMAP.md — MissionPulse Platform Foundation

**Approved:** 2026-02-18
**Order:** API-001 → DB-001 → AUTH-001 → AUDIT-001
**Parallel track:** PROJ-001 ships under A-minus rules (see Projects Endpoint Plan)

---

## Ticket 1: API-001 — Truth Alignment

**Goal:** Make documentation match reality. No agent or developer should be misled.

### Acceptance Criteria

1. `REALITY.md` committed to repo root — single source of truth for current state
2. `ROUTES.md` committed to repo root — lists only live endpoints with file/line evidence
3. All 37 aspirational `.md` files moved to `docs/future/` directory
4. Each moved file gets a `STATUS: NOT IMPLEMENTED` header block
5. A new root `README.md` replaces the current one (which claims a `backend/app/` structure that doesn't exist)
6. Root README points to `REALITY.md` for architecture and `ROUTES.md` for API reference

### Files Touched

| Action | File | Notes |
|--------|------|-------|
| Create | `REALITY.md` | Ground truth document |
| Create | `ROUTES.md` | Live endpoint inventory |
| Replace | `README.md` | New root README reflecting actual state |
| Move | 37 `.md` files | To `docs/future/` |
| Create | `docs/future/STATUS_HEADER.md` | Template for the NOT IMPLEMENTED notice |

### Verification

- `ls docs/future/*.md | wc -l` → 37
- `head -3 docs/future/MISSIONPULSE_DATABASE_SCHEMA.md` → shows STATUS: NOT IMPLEMENTED header
- `cat README.md` → references REALITY.md, no mention of `backend/app/routes/`
- `cat ROUTES.md` → lists exactly 8 endpoints matching `main.py` + `agents.py`

### Estimated Effort: 1 session (~1-2 hours)

---

## Ticket 2: DB-001 — Canonical Database Connection

**Goal:** Backend Python connects to Supabase `djuviwarqdvlbgcfuupa` via `supabase-py`. SQLite silos stop growing.

### Acceptance Criteria

1. `supabase-py` added to `requirements.txt` with pinned version
2. New `supabase_client.py` (Python) module provides initialized Supabase client
3. Connection config reads from environment variables (not hardcoded)
4. `token_tracker.py` migrated from `sqlite3` to Supabase
5. `playbook_engine.py` migrated from `sqlite3` to Supabase
6. Supabase tables `token_usage` and `playbook_entries` created via SQL Editor
7. Local `.db` files no longer created on startup
8. Existing functionality preserved (token tracking, playbook injection still work)

### Files Touched

| Action | File | Notes |
|--------|------|-------|
| Create | `supabase_client.py` | Python Supabase client init (env vars, singleton pattern) |
| Modify | `token_tracker.py` | Replace `sqlite3` imports/calls with `supabase-py` |
| Modify | `playbook_engine.py` | Replace `sqlite3` imports/calls with `supabase-py` |
| Modify | `requirements.txt` | Add `supabase>=2.0.0` (pinned) |
| SQL (manual) | Supabase Dashboard | CREATE TABLE for `token_usage`, `playbook_entries` |

### Pre-Implementation Requirement

SQL for new tables must be drafted and approved BEFORE modifying Python code:

```sql
-- Draft for review (DO NOT RUN until approved)
CREATE TABLE IF NOT EXISTS token_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    opportunity_id TEXT,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    estimated_cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS playbook_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    user_prompt TEXT NOT NULL,
    assistant_response TEXT NOT NULL,
    quality_rating TEXT NOT NULL DEFAULT 'review',
    keywords TEXT[] DEFAULT '{}',
    use_count INTEGER DEFAULT 0,
    effectiveness_score NUMERIC(5,2) DEFAULT 0,
    created_by TEXT DEFAULT '',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Verification

- `python -c "from supabase_client import get_client; print(get_client())"` → no error
- Token tracker writes to Supabase: query `SELECT count(*) FROM token_usage` after agent chat → >0
- Playbook engine reads from Supabase: `GET /api/agents/capture/chat` with `include_playbook=true` → response includes playbook matches
- No `.db` files created in working directory after fresh start
- All existing `test_agents.py` tests pass

### Estimated Effort: 2 sessions (~4-6 hours)

---

## Ticket 3: AUTH-001 — Supabase JWT Verification

**Goal:** Replace header stub with real identity. RBAC becomes enforceable.

### Acceptance Criteria

1. `get_current_user_stub` replaced by `get_current_user` in new `auth.py` module
2. `get_current_user` validates Supabase JWT from `Authorization: Bearer <token>` header
3. JWT is verified against Supabase project JWT secret
4. User role resolved from JWT claims or `profiles` table lookup
5. Missing/expired/invalid token → `401 Unauthorized`
6. Valid token + insufficient role → `404 Not Found` (invisible RBAC preserved)
7. `X-User-Role` / `X-User-Id` / `X-User-Org-Type` headers ignored entirely
8. Test suite updated: fixtures use real or mocked JWT tokens, not custom headers

### Files Touched

| Action | File | Notes |
|--------|------|-------|
| Create | `auth.py` | `get_current_user()`, JWT verification, role resolution |
| Modify | `agents.py` | Replace all `Depends(get_current_user_stub)` → `Depends(get_current_user)` |
| Modify | `test_agents.py` | Replace header fixtures with JWT fixtures |
| Modify | `requirements.txt` | Ensure `PyJWT` or `python-jose` is actively used |

### BLOCKED Until

- DB-001 complete (need Supabase connection for `profiles` table lookup)
- Supabase `profiles` table must exist with `role` column (verify or create)

### Verification

- `curl /api/agents` (no header) → `401`
- `curl /api/agents -H "Authorization: Bearer <valid_executive>"` → 200 + 8 agents
- `curl /api/agents -H "Authorization: Bearer <valid_subcontractor>"` → 200 + filtered (5 agents)
- `curl /api/agents -H "X-User-Role: executive"` → `401` (old path dead)
- `curl /api/agents -H "Authorization: Bearer expired_token"` → `401`
- `pytest test_agents.py -v` → all pass with new JWT fixtures

### Estimated Effort: 2 sessions (~4-6 hours)

---

## Ticket 4: AUDIT-001 — Audit Log Writes

**Goal:** Every write operation is logged with real identity. SSP claims become defensible.

### Acceptance Criteria

1. `audit_service.py` module exists with `log_event()` function
2. `audit_logs` table exists in Supabase (create if missing)
3. Every agent chat call logs: `user_id`, `agent_id`, `action=AGENT_CHAT`, `ip_address`, `timestamp`
4. Every token usage record logs: `user_id`, `action=TOKEN_USAGE`, `metadata` with amounts
5. `user_id` comes from authenticated JWT (not stub) — depends on AUTH-001
6. Audit table is append-only: no UPDATE or DELETE permitted (enforced by RLS policy)
7. SSP narrative for AU-3 updated to reference actual `audit_service.py` implementation

### Files Touched

| Action | File | Notes |
|--------|------|-------|
| Create | `audit_service.py` | `log_event()` writes to Supabase `audit_logs` table |
| Modify | `agents.py` | Add `audit_service.log_event()` calls to chat/analyze endpoints |
| Modify | `token_tracker.py` | Add audit call on token record writes |
| SQL (manual) | Supabase Dashboard | CREATE TABLE `audit_logs` + RLS (append-only policy) |

### BLOCKED Until

- AUTH-001 complete (audit logs with stub identity are worthless)
- DB-001 complete (need Supabase connection)

### Verification

- Chat with agent → `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 1` → row exists with correct `user_id`, `agent_id`
- Attempt `DELETE FROM audit_logs` via SQL Editor with anon key → blocked by RLS
- `AUDIT-001` completion note references specific file/line that satisfies AU-3

### Estimated Effort: 1 session (~2-3 hours)

---

## Total Stabilization Estimate

| Ticket | Sessions | Hours | Blocks |
|--------|----------|-------|--------|
| API-001 | 1 | 1-2 | None |
| DB-001 | 2 | 4-6 | None |
| AUTH-001 | 2 | 4-6 | DB-001 |
| AUDIT-001 | 1 | 2-3 | AUTH-001 |
| **Total** | **6** | **11-17** | Sequential dependency chain |

**PROJ-001 (projects endpoint)** ships in parallel with API-001, using A-minus guardrails.

---

*Mission Meets Tech — Mission. Technology. Transformation.*
