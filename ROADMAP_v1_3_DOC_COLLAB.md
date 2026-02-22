# MissionPulse v1.3 Roadmap Extension — Document Collaboration Loop

**From Document Generation to Document Collaboration**
3 Sprints • 14 Tickets • Phase J

Supersedes nothing — extends ROADMAP_v1.1_v1.2.md (S19–S28)
Sprint numbering continues from S28. Ticket numbering continues from T-28.5.
Depends on: S21 (doc gen engines), S23 (M365 OAuth), S26 (Google OAuth), S28 (real-time collab)

**PROPRIETARY — Mission Meets Tech, LLC — February 2026**

---

## 1. Strategic Context

### 1.1 Why This Extension

The MissionPulse product walkthrough demonstrates a Document Collaboration Loop — the ability to generate proposals in MissionPulse, edit them in Word Online / Excel Online / PowerPoint Online / Google Docs, and sync changes back bidirectionally. This is the differentiator that makes MissionPulse the place where proposals are **written**, not just managed.

The v1.1/v1.2 roadmap (S19–S28) covers the prerequisites: document generation engines (T-21.1–21.4), M365 OAuth + OneDrive file storage (T-23.1), Google Workspace file storage (T-26.1), and real-time presence + section locking (T-28.1–28.2). But those tickets stop at **file-level** operations (save to OneDrive, open in Word Online). They do not cover:

- **Content-level bidirectional sync** — edits made in Word Online flowing back into MissionPulse section content
- **Cross-document coordination** — a pricing rate change in Excel cascading to Word narratives and PPT summary slides
- **PowerPoint Online deep integration** — open/edit/sync for PPTX (only Word and Drive are ticketed)
- **Cloud-synced binder assembly** — pulling the latest human-edited cloud versions (not just generated versions)
- **Parallel multi-artifact collaboration** — unified view of 3+ users editing different artifact types simultaneously
- **Version diffing across cloud edits** — tracking section-level changes as documents move between platforms
- **Proposal timeline visualization** — Gantt-style milestone board for gate dates, color teams, and submission deadlines
- **Work breakdown board** — section × owner matrix with progress tracking (distinct from Swimlane Kanban)

### 1.2 What This Unlocks

Without Phase J, MissionPulse generates documents. With Phase J, MissionPulse **orchestrates** the entire document lifecycle across every tool GovCon teams already use. This is the capability shown in the investor walkthrough.

### 1.3 Phase Map

| Phase | Sprints | What Ships |
|-------|---------|------------|
| J: Document Collaboration Loop (v1.3) | S29–S31 | Bidirectional content sync, cross-doc coordination, cloud binder, parallel artifact view, version diffing, proposal timeline, work breakdown board |

### 1.4 Sprint Cadence

Same rules as v1.1/v1.2:

| Parameter | Value |
|-----------|-------|
| Sprint Length | Maximize delivery per sprint. No fixed time constraint. |
| Tickets per Sprint | 4–5 (packed for throughput) |
| Validation | npm run build must pass for every ticket |
| Branch | All work on v2-development. Merge to main per release. |
| Deploy | Staging auto-deploys on push. Production = manual merge. |
| v1.3 Target | Q1 2027 |

### 1.5 Execution Rules

Same as v1.1/v1.2. Additionally:
- All Microsoft Graph API calls go through lib/integrations/m365/ (extends T-23.1 OAuth)
- All Google API calls go through lib/integrations/google/ (extends T-26.1 OAuth)
- Webhook handlers must be idempotent (same event processed twice = same result)
- All sync operations logged to integration_sync_log (from S22)
- CUI markings must survive round-trip through cloud editing (verify on sync-back)

---

## 2. AMENDMENTS TO EXISTING TICKETS

These are NOT new tickets. They add acceptance criteria to v1.1/v1.2 tickets to prepare for Phase J.

### Amendment A-J1: T-23.1 M365 OAuth + OneDrive — Add Webhook Registration

**Change:** T-23.1 currently establishes OAuth and file-level operations. Add Microsoft Graph webhook subscription so MissionPulse receives change notifications when files are edited in OneDrive/Word Online.

**Add to T-23.1 acceptance criteria:**
- [ ] Register Microsoft Graph webhook subscription for file change notifications on MissionPulse OneDrive folders
- [ ] Webhook endpoint: /api/webhooks/m365 (validates subscription, processes change notifications)
- [ ] Store webhook subscription ID in integration_configs for renewal (subscriptions expire after 3 days, auto-renew via cron)
- [ ] Change notification payload parsed and queued for sync processing

**Add to T-23.1 files:** app/api/webhooks/m365/route.ts, lib/integrations/m365/webhooks.ts

---

### Amendment A-J2: T-26.1 Google Workspace — Add Drive Push Notifications

**Change:** T-26.1 currently establishes OAuth and file-level operations. Add Google Drive push notifications so MissionPulse receives change notifications when files are edited in Google Docs/Sheets/Slides.

**Add to T-26.1 acceptance criteria:**
- [ ] Register Google Drive push notification channel for MissionPulse folders
- [ ] Webhook endpoint: /api/webhooks/google-drive (validates token, processes change notifications)
- [ ] Channel auto-renewal (Google channels expire, renew via cron)
- [ ] Change notification queued for sync processing

**Add to T-26.1 files:** app/api/webhooks/google-drive/route.ts, lib/integrations/google/webhooks.ts

---

### Amendment A-J3: T-21.4 Enhanced Binder Assembly — Add Cloud Source Option

**Change:** T-21.4 currently assembles binders from generated documents. Add a "Pull from Cloud" option that fetches the latest version from OneDrive/Google Drive instead of the generated version, with sync status verification.

**Add to T-21.4 acceptance criteria:**
- [ ] "Use cloud version" toggle per volume in binder assembly UI
- [ ] When toggled, fetch latest file from OneDrive/Google Drive instead of local generated version
- [ ] Sync status badge per volume: Synced ✓ / Out of Sync ⚠ / Not Connected —
- [ ] Warning if cloud version is older than last MissionPulse edit

---

## 3. PHASE J: Document Collaboration Loop (v1.3)

Goal: Make MissionPulse the orchestration layer for proposal documents across Word Online, Excel Online, PowerPoint Online, and Google Docs. Edits in any tool sync back. Changes in one document cascade to related documents. The binder always reflects the latest truth.

---

### SPRINT 29 — Bidirectional Sync Engine + Cloud Editing

*Core sync infrastructure. Content-level bidirectional sync for Word, Excel, and PowerPoint via Microsoft Graph. Google Docs sync via Drive API. Section-level change tracking.*

#### T-29.1 Bidirectional Content Sync Engine

Core infrastructure for content-level sync between MissionPulse and cloud office suites. Sync manager handles: detecting changes (via webhooks from A-J1/A-J2), fetching updated content, diffing against MissionPulse version, applying changes to proposal sections, and logging sync operations. This is the foundation all cloud editing tickets depend on.

**Acceptance Criteria:**
- [ ] lib/sync/sync-manager.ts: SyncManager class orchestrating all sync operations
- [ ] Change detection: process webhook payloads from M365 and Google, identify which proposal section changed
- [ ] Content extraction: parse DOCX/XLSX/PPTX content via existing doc gen engines (reverse direction)
- [ ] Diff engine: section-level diff between cloud version and MissionPulse version (not character-level)
- [ ] Conflict detection: flag if both MissionPulse and cloud version changed since last sync
- [ ] Conflict resolution UI: side-by-side diff with "Keep MissionPulse" / "Keep Cloud" / "Merge" options
- [ ] Sync status per document: synced / syncing / conflict / not_connected
- [ ] All sync operations logged to integration_sync_log with direction, section_id, diff_summary
- [ ] Sync queue: debounce rapid changes (5s window), process in order
- [ ] npm run build passes

**Depends on:** T-23.1 (M365 OAuth), T-26.1 (Google OAuth), T-21.1/21.2/21.3 (doc gen engines for content parsing)
**Files:** lib/sync/sync-manager.ts, lib/sync/diff-engine.ts, lib/sync/conflict-resolver.ts, lib/sync/sync-queue.ts, components/features/sync/ConflictResolutionModal.tsx

---

#### T-29.2 Word Online Deep Integration

Extend T-23.1's "Open in Word Online" to full bidirectional content sync. When a user edits a technical volume in Word Online, section content syncs back to MissionPulse. Track changes from Word Online preserved and visible in MissionPulse's track-changes UI.

**Acceptance Criteria:**
- [ ] "Edit in Word Online" button on proposal section detail view (opens Word Online via Graph API deep link)
- [ ] Microsoft Graph webhook fires on save → SyncManager processes → section content updated in MissionPulse
- [ ] Track changes from Word Online mapped to MissionPulse track-changes component (accept/reject in either tool)
- [ ] Presence indicator: show "Editing in Word Online" badge on section when user has file open externally
- [ ] CUI banners survive round-trip: verify CUI portion marks preserved after Word Online edit
- [ ] Section-level granularity: if user edits §1.1, only §1.1 updates (not entire document)
- [ ] "AI GENERATED — REQUIRES HUMAN REVIEW" watermark removed from sections after first human edit in Word Online
- [ ] npm run build passes

**Depends on:** T-29.1, T-23.1
**Files:** lib/sync/adapters/word-online.ts, components/features/proposals/WordOnlineButton.tsx

---

#### T-29.3 Excel Online Deep Integration

Bidirectional sync for pricing workbooks and compliance matrices. When a user edits an LCAT rate or adds a CLIN in Excel Online, changes sync back to MissionPulse's Pricing module data model. CUI handling verified on round-trip.

**Acceptance Criteria:**
- [ ] "Edit in Excel Online" button on Pricing module and Compliance Matrix views
- [ ] Graph API deep link opens specific workbook in Excel Online
- [ ] Webhook fires on save → SyncManager processes → pricing data updated in MissionPulse
- [ ] Cell-level mapping: LCAT rates, CLIN totals, wrap rates mapped to MissionPulse pricing model fields
- [ ] Formula preservation: Excel formulas maintained (MissionPulse reads calculated values, not formulas)
- [ ] CUI banner verified on round-trip: diagonal hatching pattern preserved
- [ ] Pricing module UI reflects Excel changes within 30s of save
- [ ] npm run build passes

**Depends on:** T-29.1, T-23.1, T-21.2 (XLSX engine)
**Files:** lib/sync/adapters/excel-online.ts, components/features/pricing/ExcelOnlineButton.tsx

---

#### T-29.4 PowerPoint Online Deep Integration

Bidirectional sync for presentation decks. When a user edits a gate decision deck or orals prep slides in PowerPoint Online, changes sync back. New slide content mapped to MissionPulse structured data where applicable.

**Acceptance Criteria:**
- [ ] "Edit in PowerPoint Online" button on Orals Prep and Launch Control modules
- [ ] Graph API deep link opens specific deck in PowerPoint Online
- [ ] Webhook fires on save → SyncManager processes → deck metadata updated in MissionPulse
- [ ] Slide content sync: text changes in slides reflected in MissionPulse's corresponding data fields
- [ ] Speaker notes sync: notes edited in PPT Online update orals prep content
- [ ] Branding preservation: MMT theme (Primary Cyan headers, Deep Navy backgrounds) verified on round-trip
- [ ] npm run build passes

**Depends on:** T-29.1, T-23.1, T-21.1 (PPTX engine)
**Files:** lib/sync/adapters/pptx-online.ts, components/features/orals/PowerPointButton.tsx

---

#### T-29.5 Google Docs + Sheets Deep Integration

Bidirectional sync for Google Workspace users (alternative to M365 path). Google Docs for volumes, Google Sheets for pricing. Same section-level sync as Word/Excel but via Google Drive API + Apps Script.

**Acceptance Criteria:**
- [ ] "Edit in Google Docs" button on proposal section views
- [ ] "Edit in Google Sheets" button on Pricing module
- [ ] Google Drive push notification fires on save → SyncManager processes → section content updated
- [ ] Section-level mapping for Docs (same granularity as Word Online)
- [ ] Cell-level mapping for Sheets (same granularity as Excel Online)
- [ ] Watermark handling: Google Docs watermark overlay for CUI content (since Docs doesn't support native watermarks, use header/footer text)
- [ ] Partner access scope: external partners see only their assigned sections (same RBAC as T-28.1 scoping)
- [ ] npm run build passes

**Depends on:** T-29.1, T-26.1
**Files:** lib/sync/adapters/google-docs.ts, lib/sync/adapters/google-sheets.ts, components/features/proposals/GoogleDocsButton.tsx

---

### SPRINT 30 — Cross-Document Intelligence + Cloud Binder

*Cross-document coordination engine. Version history with cloud diffing. Cloud-synced binder assembly. Parallel artifact collaboration view.*

#### T-30.1 Cross-Document Coordination Engine

The intelligence layer that cascades changes across related documents. When a pricing rate changes in Excel, the Word narrative referencing that rate auto-updates. When a key personnel change happens in a staffing section, the PPT org chart slide updates. Configurable coordination rules.

**Acceptance Criteria:**
- [ ] lib/sync/coordination-engine.ts: CoordinationEngine class with configurable rules
- [ ] Rule types: field-reference (Excel cell → Word paragraph), section-mirror (Word section → PPT slide), aggregate (Excel totals → Word summary)
- [ ] Coordination rules stored in coordination_rules table (source_doc_type, source_field, target_doc_type, target_field, transform)
- [ ] Default rules shipped for common GovCon patterns:
  - LCAT hourly rate (Excel) → rate references in Technical Volume (Word) → pricing summary slide (PPT)
  - Key personnel name/role (Word) → org chart slide (PPT) → staffing matrix (Excel)
  - Compliance status (Excel matrix) → executive summary compliance paragraph (Word) → gate readiness slide (PPT)
- [ ] Cascade execution: change in source triggers update to all targets (max 2 hops to prevent infinite loops)
- [ ] Cascade log: record what changed, what was updated, what the previous value was
- [ ] User notification: "Rate change in Excel updated 3 sections in Technical Volume and 1 slide in Gate Deck"
- [ ] Cascade preview: before applying, show user what will change with approve/reject
- [ ] npm run build passes

**Depends on:** T-29.1, T-29.2, T-29.3, T-29.4
**Files:** lib/sync/coordination-engine.ts, lib/sync/coordination-rules.ts, components/features/sync/CascadePreview.tsx, SQL migration for coordination_rules

---

#### T-30.2 Version History + Cloud Diff Tracking

Track version history across cloud edits. Every sync event creates a version snapshot. UI shows version timeline with section-level change counts (e.g., "v0.3 → v0.4: 3 sections updated, 1 section added"). Diff view between any two versions.

**Acceptance Criteria:**
- [ ] document_versions table: version_number, document_id, source (missionpulse/word_online/excel_online/ppt_online/google_docs), snapshot JSONB, sections_changed, sections_added, sections_removed, created_by, created_at
- [ ] Version created on every sync event and every manual save in MissionPulse
- [ ] Version timeline UI on document detail page: compact list showing "v0.3 → v0.4: 3 sections updated" with source icon (Word/Excel/PPT/Docs logo)
- [ ] Diff view: select any two versions, see section-by-section changes (additions green, deletions red, modifications yellow)
- [ ] Version restore: roll back to any previous version (creates new version, not destructive)
- [ ] Version count badge on document cards in Swimlane
- [ ] Audit trail: version events logged to audit_logs
- [ ] npm run build passes

**Depends on:** T-29.1
**Files:** lib/sync/version-tracker.ts, components/features/proposals/VersionTimeline.tsx, components/features/proposals/VersionDiff.tsx, SQL migration for document_versions

---

#### T-30.3 Cloud-Synced Binder Assembly

Upgrade T-21.4's binder assembly to pull from the latest cloud-synced version of each volume. Per-volume sync status verification. Assembly log showing where each file was pulled from and its sync state.

**Acceptance Criteria:**
- [ ] Binder assembly UI shows per-volume source selector: "Generated" / "OneDrive" / "Google Drive" with last-sync timestamp
- [ ] Sync status badge per volume: ✓ Synced (green) / ⚠ Out of Sync (amber) / ✗ Not Connected (gray)
- [ ] "Out of Sync" volumes show warning: "Cloud version is newer. Sync before assembling?"
- [ ] One-click "Sync All" button: fetch latest cloud version for all connected volumes
- [ ] Assembly log: table showing volume name, source, version number, sync status, file size, last editor
- [ ] Assembled binder ZIP includes sync manifest (JSON file listing source, version, and hash per volume)
- [ ] Total page count displayed after assembly: "[N] pages from [M] cloud-synced documents"
- [ ] CUI verification: automated check that CUI markings survived cloud round-trip for all applicable volumes
- [ ] npm run build passes

**Depends on:** T-21.4, T-29.1, T-30.2
**Files:** lib/utils/cloud-binder-assembly.ts, components/features/launch/CloudBinderPanel.tsx, components/features/launch/SyncStatusBadge.tsx

---

#### T-30.4 Parallel Multi-Artifact Collaboration View

Dashboard view showing all active editors across all artifact types for an opportunity. Real-time feed of editing activity. Unified status showing which volumes are being edited, by whom, and in which tool.

**Acceptance Criteria:**
- [ ] Collaboration dashboard page at /dashboard/proposals/[id]/collaboration
- [ ] Real-time activity feed: "[Name] editing §1.1 in Word Online" / "[Name] updated CLIN 003 in Excel Online"
- [ ] Artifact status grid: rows = volumes/artifacts, columns = status (In Progress / In Review / Synced / Conflict)
- [ ] Editor avatars on each artifact with tool icon (Word/Excel/PPT/Docs)
- [ ] Tool distribution chart: mini pie showing "3 in Word, 1 in Excel, 1 in PPT"
- [ ] Click any artifact → opens detail view with version timeline and latest diff
- [ ] Supabase Realtime subscription for live updates (no polling)
- [ ] RBAC: proposal_manager and above can view; executive sees all opportunities
- [ ] npm run build passes

**Depends on:** T-28.1 (presence), T-29.1 (sync engine)
**Files:** app/(dashboard)/proposals/[id]/collaboration/page.tsx, components/features/collaboration/ArtifactStatusGrid.tsx, components/features/collaboration/ActivityFeed.tsx, components/features/collaboration/ToolDistribution.tsx

---

### SPRINT 31 — Proposal Workspace UX + v1.3 Ship

*Proposal timeline visualization. Work breakdown board. v1.3 regression testing. Production deploy.*

#### T-31.1 Proposal Timeline + Milestone Board

Gantt-style timeline view for each opportunity showing all key dates: gate reviews, color team sessions, draft deadlines, submission date. Milestones auto-populated from opportunity record. Drag-to-reschedule with cascade warnings.

**Acceptance Criteria:**
- [ ] Timeline view at /dashboard/proposals/[id]/timeline
- [ ] Gantt bars for: Gate 0–3 reviews, Pink/Red/Gold Team, section draft deadlines, submission date
- [ ] Auto-populated from opportunity dates (gate_dates JSONB, submission_deadline)
- [ ] Drag-to-reschedule: moving a gate date warns if downstream dates need adjustment
- [ ] Today marker: vertical line showing current date against timeline
- [ ] Deadline proximity alerts: amber at 7 days, red at 3 days, pulsing at 1 day
- [ ] Calendar export: push selected milestones to Outlook (T-23.2) or Google Calendar (T-26.1)
- [ ] Print-friendly view for kickoff meetings
- [ ] npm run build passes

**Depends on:** T-5.1 (Opportunity Detail), T-23.2 (Outlook Calendar), T-26.1 (Google Calendar)
**Files:** app/(dashboard)/proposals/[id]/timeline/page.tsx, components/features/proposals/GanttTimeline.tsx, components/features/proposals/MilestoneBar.tsx, lib/proposals/timeline-utils.ts

---

#### T-31.2 Work Breakdown Board

Section × Owner matrix view for proposal work breakdown. Each cell shows section title, assigned author, status, word count, and deadline. Drag-to-assign sections to team members. Progress roll-up by volume and by team member.

**Acceptance Criteria:**
- [ ] Work breakdown view at /dashboard/proposals/[id]/breakdown
- [ ] Matrix layout: rows = proposal sections (grouped by volume), columns = status (Not Started / Drafting / Review / Complete)
- [ ] Section cards show: title, assignee avatar, word count, deadline, sync status icon
- [ ] Drag-to-assign: drop a section onto a team member to reassign
- [ ] Volume roll-up: progress bar per volume showing % sections complete
- [ ] Team roll-up: per-person view showing their assigned sections and status
- [ ] Filter by: volume, assignee, status, deadline proximity
- [ ] Links to Swimlane (T-6.3) for detailed task tracking within a section
- [ ] RBAC: proposal_manager can assign; volume_lead can reassign within their volume; authors see their sections
- [ ] npm run build passes

**Depends on:** T-6.3 (Swimlane), T-28.1 (presence)
**Files:** app/(dashboard)/proposals/[id]/breakdown/page.tsx, components/features/proposals/WorkBreakdownMatrix.tsx, components/features/proposals/SectionCard.tsx, components/features/proposals/TeamRollup.tsx

---

#### T-31.3 v1.3 Integration Regression Testing

End-to-end test suite covering all Phase J features. Verify: bidirectional sync round-trips, cross-document cascades, cloud binder assembly, CUI preservation through cloud editing, conflict resolution flows.

**Acceptance Criteria:**
- [ ] Playwright tests for: Word Online sync round-trip, Excel Online sync round-trip, PPT Online sync round-trip, Google Docs sync round-trip
- [ ] Cross-document coordination tests: rate change in Excel → verify Word and PPT updated
- [ ] Cloud binder tests: verify assembly pulls latest cloud version, sync status accurate
- [ ] CUI preservation tests: verify CUI markings survive round-trip through each cloud tool
- [ ] Conflict resolution tests: simulate simultaneous edits, verify conflict UI appears, resolution works
- [ ] Version history tests: verify version created on each sync, diff view accurate
- [ ] Mock Microsoft Graph and Google Drive APIs for CI (no live API calls)
- [ ] All tests pass in CI pipeline
- [ ] npm run build passes

**Depends on:** All S29–S31 tickets
**Files:** tests/sync/*.spec.ts, tests/collaboration/*.spec.ts, tests/mocks/graph-api.ts, tests/mocks/google-drive-api.ts

---

#### T-31.4 v1.3 Production Deploy + Documentation

Merge v2-development to main. Update user documentation covering document collaboration features. Release notes. Walkthrough video script for the Document Collaboration Loop.

**Acceptance Criteria:**
- [ ] v2-development merged to main via PR with full CI pass
- [ ] Production deploy verified at missionpulse.io
- [ ] User docs updated: sync setup guide, cross-document coordination rules, cloud binder walkthrough
- [ ] Release notes document: v1.3 changelog with screenshots
- [ ] Video script: 3-minute walkthrough matching investor demo flow
- [ ] npm run build passes on main branch

**Depends on:** T-31.3
**Files:** docs/release-notes-v1.3.md, docs/user-guide/sync-setup.md, docs/user-guide/cloud-binder.md, docs/user-guide/cross-doc-coordination.md

---

## 4. Schema Additions Required

New tables needed for Phase J. All require RLS policies, audit triggers, and `supabase gen types` after migration.

| Table | Sprint | Purpose |
|-------|--------|---------|
| document_sync_state | S29 | Per-document sync status: document_id, cloud_provider (m365/google), cloud_file_id, sync_status (synced/syncing/conflict/disconnected), last_sync_at, last_cloud_edit_at, last_mp_edit_at |
| sync_conflicts | S29 | Conflict records: document_id, section_id, mp_version JSONB, cloud_version JSONB, resolution (pending/keep_mp/keep_cloud/merged), resolved_by, resolved_at |
| coordination_rules | S30 | Cross-document rules: source_doc_type, source_field_path, target_doc_type, target_field_path, transform_type (direct/template/aggregate), is_active, company_id |
| coordination_log | S30 | Cascade execution log: rule_id, trigger_document_id, affected_documents JSONB, changes_applied JSONB, status (applied/previewed/rejected), executed_at |
| document_versions | S30 | Version snapshots: document_id, version_number, source (missionpulse/word_online/excel_online/ppt_online/google_docs/google_sheets), snapshot JSONB, diff_summary JSONB, created_by, created_at |
| proposal_milestones | S31 | Timeline events: opportunity_id, milestone_type (gate_review/color_team/draft_deadline/submission), title, scheduled_date, actual_date, status (upcoming/in_progress/completed/overdue) |
| section_assignments | S31 | Work breakdown: section_id, assignee_id (FK profiles), volume, status (not_started/drafting/review/complete), word_count, deadline, assigned_by, assigned_at |

---

## 5. Dependency Chain

| Ticket | Blocks | Risk |
|--------|--------|------|
| T-23.1 + A-J1 (M365 OAuth + Webhooks) | T-29.2, T-29.3, T-29.4 | All M365 cloud editing depends on webhook infrastructure. Must ship with S23. |
| T-26.1 + A-J2 (Google OAuth + Push Notifications) | T-29.5 | Google Docs/Sheets sync depends on push notification channel. Must ship with S26. |
| T-29.1 (Sync Engine) | T-29.2, T-29.3, T-29.4, T-29.5, T-30.1, T-30.2, T-30.3 | Core infrastructure. Every other Phase J ticket depends on this. Build first. |
| T-29.2 + T-29.3 + T-29.4 (Cloud Editing) | T-30.1 (Cross-Doc) | Coordination engine needs all three adapters to cascade between doc types. |
| T-30.1 (Coordination Engine) | T-30.3 (Cloud Binder) | Binder needs to know which docs are coordinated to verify consistency. |
| T-30.2 (Version History) | T-30.3 (Cloud Binder) | Binder references version numbers for manifest. |
| T-21.4 + A-J3 (Binder Upgrade) | T-30.3 | Cloud binder extends the base binder assembly. |

---

## 6. Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Microsoft Graph API rate limits | Sync delays during heavy editing | Medium | Debounce sync queue (5s window). Batch API calls. Exponential backoff. Monitor Graph API quotas per tenant. |
| Google Drive push notification reliability | Missed changes, stale data | Medium | Polling fallback every 60s as safety net. Push notifications are primary, polling is belt-and-suspenders. |
| CUI markings stripped by cloud editors | Compliance violation | High | Automated CUI verification on every sync-back. Block merge if CUI marks missing. Alert compliance officer. |
| Cross-document cascade loops | Infinite update cycle | Medium | Max 2 cascade hops. Visited-document set per cascade execution. Circuit breaker if >10 updates in single cascade. |
| Conflict resolution UX complexity | Users confused by merge UI | Medium | Default to "Keep Cloud" (human edits win). Show simple side-by-side diff. Advanced merge only for power users. |
| Large document sync latency | Slow experience on big proposals | Medium | Sync at section level (not full document). Delta updates only (changed sections). Background processing with optimistic UI. |
| OAuth token expiry during long editing sessions | Sync failure mid-work | Low | Token refresh middleware in oauth-manager.ts. Re-auth prompt if refresh fails. Queue pending syncs for retry after re-auth. |
| Scope creep into real-time co-editing (Google Docs style) | v1.3 delayed indefinitely | High | Phase J is section-level sync, NOT character-level co-editing. Section locking (T-28.1) prevents simultaneous edits to same section. Character-level co-editing is v2.0. |

---

## 7. What Phase J Is NOT

To prevent scope creep, these capabilities are explicitly **out of scope** for v1.3:

| Capability | Why Not v1.3 | When |
|------------|-------------|------|
| Character-level co-editing (Google Docs style) | Requires CRDT/OT infrastructure. Section locking is sufficient for GovCon workflows. | v2.0 |
| Offline editing with sync-on-reconnect | Requires local-first architecture. Web-only is fine for v1.3. | v2.0 |
| Mobile editing | Responsive web covers mobile viewing. Native mobile editing is v2.0. | v2.0 |
| AI-assisted conflict resolution | "AI suggests merge" is a v2.0 enhancement. v1.3 shows diffs, human decides. | v2.0 |
| Embedded Office editors (WOPI host) | Hosting Word/Excel inside MissionPulse iframe requires WOPI licensing. v1.3 uses deep links to Office Online. | v2.0 |

---

**PROPRIETARY — Mission Meets Tech, LLC — February 2026**
