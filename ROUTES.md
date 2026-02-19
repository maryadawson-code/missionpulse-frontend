# ROUTES.md — MissionPulse Live API Endpoints

**Generated:** 2026-02-18
**Source of truth:** Code inspection of `main.py` and `agents.py`
**Base URL:** `https://missionpulse-api.onrender.com`
**Prefix:** `/api` (no versioning)

---

## Live Endpoints

| Method | Path | Auth | RBAC | Source File | Line |
|--------|------|------|------|-------------|------|
| GET | `/api/health` | None | None | `main.py` | 186 |
| GET | `/api/version` | None | None | `main.py` | 196 |
| GET | `/api/agents` | Stub | Role-filtered list | `agents.py` | 384 |
| GET | `/api/agents/{agent_id}` | Stub | 404 if unauthorized | `agents.py` | 415 |
| POST | `/api/agents/{agent_id}/chat` | Stub | 404 if unauthorized | `agents.py` | 442 |
| POST | `/api/agents/{agent_id}/analyze` | Stub | 404 if unauthorized | `agents.py` | ~550 |
| GET | `/api/agents/{agent_id}/usage` | Stub | 404 if unauthorized | `agents.py` | ~650 |
| GET | `/api/agents/health` | None | None | `agents.py` | ~700 |

**Total live endpoints:** 8

## Auth Details

- **Mechanism:** HTTP header stub (`X-User-Role`, `X-User-Id`, `X-User-Org-Type`)
- **Default (no headers):** `executive` role, `user_001` ID, `internal` org
- **Security:** None. Any client can claim any role.
- **Status:** TECH-DEBT — to be replaced by AUTH-001 (Supabase JWT)

## RBAC Details

- **Hierarchy:** subcontractor < teaming_partner < consultant < author < volume_lead < capture_manager < operations < executive
- **Invisible RBAC:** Unauthorized → 404 (not 403)
- **External blocked agents:** pricing, blackhat, strategy
- **Config source:** `agents.py:291-303` + `roles_permissions_config.json`

## Planned Endpoints (not yet implemented)

| Ticket | Path | Status |
|--------|------|--------|
| PROJ-001 | `POST /api/projects` | Approved — awaiting implementation |
| AUTH-001 | `/api/auth/*` | Planned — stabilization roadmap |
| Future | `/api/opportunities/*` | Not started |
| Future | `/api/proposals/*` | Not started |
| Future | `/api/users/*` | Not started |

---

*Last verified: 2026-02-18 via code inspection*
