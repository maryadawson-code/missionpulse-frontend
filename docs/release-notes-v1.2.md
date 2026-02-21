# MissionPulse v1.2 Release Notes

**Release Date:** Q4 2026
**Branch:** v2-development merged to main

---

## What's New in v1.2

### Real-time Collaboration
- **Live presence indicators** — See who's viewing or editing each opportunity in real-time
- **Section-level locking** — Claim sections for editing with automatic 30-minute release to prevent conflicts
- **Conflict detection** — If two users edit the same section, last-save-wins with full diff visibility

### In-app Commenting
- **Threaded comments** on proposal sections with one level of replies
- **@role mentions** — Tag entire role groups (e.g., @capture_manager, @contracts) to notify relevant team members
- **Resolve/reopen** workflow to track comment status
- **Comment count badges** on swimlane section cards

### Microsoft Teams Integration
- **Teams tab app** — Embed MissionPulse opportunity dashboard directly in Teams channels
- **Meeting scheduling** — Create Teams meetings for gate reviews and color team sessions from MissionPulse
- **Adaptive cards** — Gate approval requests delivered as interactive Teams cards with Approve/Reject buttons
- **Activity feed sync** — War Room activity streamed to linked Teams channels

### Federal Data Sources
- **USAspending.gov** — Award history, prime/sub relationships, and 5-year spending trends per agency/NAICS
- **FPDS** — Contract action search, vendor history, and pricing benchmarks feeding into the Pricing Agent

### Google Workspace
- **Google Drive** — Save generated documents directly to Drive with organized folder structure
- **Google Calendar** — Push gate review dates, color team sessions, and submission deadlines
- **Google Docs** — Open proposal volumes in Google Docs for collaborative editing

### DocuSign E-Signature
- **Gate decision signatures** — Route Go/No-Go approval documents for executive e-signature
- **NDA routing** — Multi-party sequential signing for partner/subcontractor NDAs
- **Status tracking** — Pending, Signed, Declined status visible in opportunity detail
- **Signed document archival** — Automatically attached to opportunity record

### Advanced RAG Pipeline
- **Semantic chunking** — Document splits respect section boundaries, not arbitrary token windows
- **Hybrid search** — Combined vector (pgvector) + keyword (pg_trgm) search with Reciprocal Rank Fusion
- **Cross-encoder re-ranking** — Top candidates re-scored for higher precision Playbook matching

### Cross-Proposal Knowledge Graph
- **Entity extraction** — Automatically identifies agencies, contract vehicles, personnel, technologies from uploaded proposals
- **Relationship mapping** — "Show me every proposal where we mentioned FHIR integration"
- **Knowledge context** — AI agents automatically retrieve relevant entity context

### Proactive AI
- **Deadline risk alerts** — Daily velocity-based assessment flags at-risk sections before they slip
- **Missing section detection** — Scans compliance matrix against proposal tree to find gaps
- **Gap reports** — Actionable gap report with severity badges and suggested fixes

### Model Fine-tuning Pipeline
- **Training data export** — Accepted AI outputs exported as JSONL prompt/completion pairs
- **Quality filtering** — Minimum confidence score, human-accepted only, duplicate detection
- **Job management** — Queue, monitor, and cancel fine-tuning jobs from the admin panel
- **Executive-only access** — RBAC-gated to executive roles

### Data Migration Tools
- **Import wizard** — 4-step CSV/XLSX import with column mapping, validation, and preview
- **Bulk upload** — Drag-and-drop for opportunities, contacts, and past performance narratives
- **24-hour undo** — Rollback imported batches within 24 hours

---

## Improvements from v1.1

- All v1.1 features remain operational: Redis caching, token budget enforcement, Stripe billing, PPTX/XLSX/DOCX generation, Salesforce, GovWin IQ, M365 OneDrive/Calendar, Slack, Playbook v2

---

## Security

- OAuth token storage verified for all integrations (encrypted credentials)
- RLS policies verified for all new data flows
- CUI/OPSEC banners maintained on sensitive modules
- Full security audit checklist in `docs/security-audit-v1.2.md`

---

## Technical Details

- **Build:** 0 errors, 0 type errors
- **Routes:** 40+ compiled routes
- **Dependencies:** All pinned, no known vulnerabilities
- **Supabase:** 200+ tables, all RLS-enabled
- **AI Agents:** 8 operational via AskSage gateway

---

**PROPRIETARY — Mission Meets Tech, LLC — 2026**
