# Changelog — MissionPulse v1.3 (Phase J)

## Document Collaboration Loop

### Sprint 29 — Bidirectional Content Sync Engine
- **T-29.1** SyncManager core with SHA-256 hash change detection, delta-only sync, conflict resolution, exponential backoff retry (3 attempts: 1s, 2s, 4s)
- **T-29.2** Word Online deep integration via Microsoft Graph API — section-level sync, conflict resolution UI, deep link editing
- **T-29.3** Excel Online deep integration — cell-level sync for pricing worksheets (CLIN tables, labor rates, wrap rates)
- **T-29.4** PowerPoint Online deep integration — slide-level sync for Orals and Gate decks with speaker notes
- **T-29.5** Google Docs + Sheets integration via Google Workspace API — same interfaces as M365 providers

### Sprint 30 — Cross-Document Intelligence
- **T-30.1** CoordinationEngine — cascades pricing, compliance, and personnel changes across downstream volumes with dependency graph tracking
- **T-30.2** Version history with cloud diffing — save/retrieve/diff versions from local and cloud sources with visual diff viewer
- **T-30.3** Cloud-synced binder assembly — `pullFromCloud` option to refresh content from OneDrive/Google Drive before ZIP assembly
- **T-30.4** Parallel artifact collaboration view — side-by-side dual-pane editor for cross-referencing two volumes

### Sprint 31 — Workspace UX
- **T-31.1** Proposal timeline with Shipley milestones — Gantt visualization, KPI cards, milestone status tracking (pre-existing, verified)
- **T-31.2** Work breakdown board — section × team member matrix with assignment tracking, progress bars, word counts (pre-existing, verified)
- **T-31.3** v1.3 regression tests — import checks, dependency cycle detection, hash utility tests, migration verification
- **T-31.4** Deploy preparation — changelog, env var verification, clean build + lint

## Environment Variables (New)
No new environment variables required for v1.3. All integrations use existing M365 and Google Workspace OAuth credentials.

## Database Migrations
- `20260222_v1_3_phase_j.sql` — document_sync_state, sync_conflicts, coordination_rules, coordination_log, document_versions, proposal_milestones, section_assignments

## Build Status
- Build: PASS
- Lint: PASS (0 warnings, 0 errors)
- `as any`: 0
- RBAC: 100% dashboard route coverage
