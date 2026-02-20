> **STATUS: NOT IMPLEMENTED**
> This document describes planned/aspirational architecture.
> See REALITY.md for current system state.
> Moved to docs/future/ on 2026-02-19 per Phase 2 Reset.

---
# MissionPulse

**AI-Powered Proposal Management for Federal Contractors**

Mission Meets Tech â€” *Mission. Technology. Transformation.*

---

## What This Is

MissionPulse helps small government contractors compete against large primes by automating proposal development using Shipley methodology and 8 specialized AI agents.

- **Live frontend:** https://missionpulse.netlify.app
- **Live API:** https://missionpulse-api.onrender.com

## Current Architecture

See **[REALITY.md](REALITY.md)** for the verified ground-truth description of what's running.

See **[ROUTES.md](ROUTES.md)** for the complete list of live API endpoints.

### Quick Stack Summary

| Layer | Tech | Status |
|-------|------|--------|
| Frontend | 29 standalone HTML files (React + Tailwind via CDN) | Live on Netlify |
| API | FastAPI (Python) â€” 8 AI agent endpoints | Live on Render |
| Database | Supabase PostgreSQL (`djuviwarqdvlbgcfuupa`) | Live â€” canonical DB |
| AI | Anthropic Claude via `anthropic` SDK | Live |
| Auth | Header-based stub (TECH-DEBT â€” AUTH-001 planned) | Functional, not secure |

### Key Files

```
main.py                  # FastAPI app factory + router registration
agents.py                # AI agent routes (only route module)
base_agent.py            # Abstract agent base class
token_tracker.py         # Token usage + cost tracking
playbook_engine.py       # Golden examples knowledge base
prompt_manager.py        # System prompt templates
supabase_client.py       # Python Supabase client (backend DB connection)
project_routes.py        # Projects API route
supabase-client.js       # Frontend Supabase client
index.html               # Dashboard entry point
missionpulse-*.html      # Module pages
test_agents.py           # Agent route tests
test_projects.py         # Projects route tests
requirements.txt         # Python dependencies
roles_permissions_config.json  # RBAC role definitions
```

## Stabilization Roadmap

See **[STABILIZATION_ROADMAP.md](STABILIZATION_ROADMAP.md)** for the 4-ticket plan:

1. **API-001** â€” Truth alignment (docs match code) âœ…
2. **DB-001** â€” Canonical DB connection (migrate SQLite â†’ Supabase)
3. **AUTH-001** â€” Real JWT authentication (replace header stub)
4. **AUDIT-001** â€” Audit log writes (compliance-ready logging)

## Aspirational Documentation

Design documents, sprint plans, and architecture specs for features **not yet implemented** are preserved in `docs/future/`. These describe intended architecture and should not be treated as current state.

## Development

```bash
# Run API locally
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Run tests
pytest test_agents.py test_projects.py -v

# Frontend
# Open any .html file or deploy to Netlify (publish dir: ".")
```

## Compliance

CMMC 2.0 Level 2 documentation exists in repo root (`.docx` and `.xlsx` files). **Note:** Several SSP control narratives reference code-level enforcement that is not yet implemented (auth, audit logging, RLS from backend). See REALITY.md Â§5 for the gap analysis.

---

Â© 2026 Mission Meets Tech. All rights reserved. Proprietary and confidential.

