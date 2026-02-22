# Phase J Sync Architecture -- Cloud Document Synchronization Engine

**MissionPulse v1.3 | Sprint 29-31 | Phase J**

---

## 1. Overview

The Phase J Sync Engine provides bidirectional document synchronization between MissionPulse and three cloud storage providers: **OneDrive**, **Google Drive**, and **SharePoint**. It enables proposal teams to author content in their preferred cloud editors (Word Online, Excel Online, PowerPoint Online, Google Docs, Google Sheets) while MissionPulse remains the single source of truth for compliance, versioning, and cross-document coordination.

Key capabilities:

- **Webhook-driven change detection** -- Cloud providers push change notifications to MissionPulse rather than requiring polling.
- **Section-level diffing** -- The diff engine operates at both line-level (LCS-based) and named-section level to produce precise change summaries.
- **Three-way conflict resolution** -- When both MissionPulse and cloud content diverge from a common base, the system detects conflicting regions and offers keep-MP, keep-cloud, or merge strategies.
- **Debounced sync queue** -- An in-memory priority queue batches and deduplicates sync operations to avoid API rate-limit pressure.
- **Immutable version history** -- Every content change is recorded in `document_versions` with a diff summary for audit trail compliance.

---

## 2. System Architecture

```
                                     MissionPulse Frontend
                                     (Next.js App Router)
                                            |
                                            v
 +--------------------+    Webhook    +-------------------+
 |  Cloud Providers   | ------------> |   Sync Manager    |
 |                    |    POST       | (sync-manager.ts) |
 | - OneDrive (Graph) |               +--------+----------+
 | - Google Drive     |                        |
 | - SharePoint       |               +--------v----------+
 +--------------------+               |    Diff Engine     |
        ^                             | (diff-engine.ts)   |
        |                             +--------+-----------+
        |    Push                              |
        |                             +--------v-----------+
 +------+-------------+               | Conflict Resolver  |
 |   Cloud Adapters   |               | (conflict-         |
 |                    |               |  resolver.ts)      |
 | - Word Online      |               +--------+-----------+
 | - Excel Online     |                        |
 | - PPTX Online      |               +--------v-----------+
 | - Google Docs      |               |   Version Tracker  |
 | - Google Sheets    |               | (version-          |
 +--------------------+               |  tracker.ts)       |
        ^                             +--------+-----------+
        |                                      |
        |    Content                  +--------v-----------+
        |    Fetch/Push               |    Sync Queue      |
        +-----------------------------| (sync-queue.ts)    |
                                      +--------+-----------+
                                               |
                                      +--------v-----------+
                                      |   Supabase DB      |
                                      |                    |
                                      | - document_sync_   |
                                      |   state            |
                                      | - sync_conflicts   |
                                      | - document_versions|
                                      | - audit_logs       |
                                      +--------------------+
```

**Data flow summary:**

1. Cloud providers deliver webhooks to the Sync Manager.
2. The Sync Manager fetches cloud content via the appropriate Cloud Adapter.
3. The Diff Engine computes line-level or section-level differences.
4. The Conflict Resolver determines if both sides have diverged.
5. If no conflict, changes are applied. If conflict, a `sync_conflicts` record is created for user resolution.
6. The Version Tracker records an immutable snapshot after every resolved sync.
7. The Sync Queue debounces and prioritizes outbound push operations.

---

## 3. Sync Flow

### 3.1 Inbound (Cloud to MissionPulse)

| Step | Action | Module |
|------|--------|--------|
| 1 | Webhook received from cloud provider | `processWebhook()` in `sync-manager.ts` |
| 2 | Extract `cloud_file_id` from provider-specific payload | `extractCloudFileId()` internal helper |
| 3 | Look up matching `document_sync_state` record | Supabase query on `(cloud_provider, cloud_file_id)` |
| 4 | Set `sync_status` to `'syncing'` | `updateSyncStatus()` |
| 5 | Fetch current cloud content via provider API | `fetchCloudContent()` |
| 6 | Load current MissionPulse content from `proposal_sections` | Supabase query |
| 7 | Run conflict detection (three-way or direct) | `detectConflict()` in `conflict-resolver.ts` |
| 8a | **No conflict, cloud changed** -- Pull cloud content into MissionPulse | Direct update to `proposal_sections` |
| 8b | **Conflict detected** -- Create conflict record for user resolution | `createConflictRecord()`, status set to `'conflict'` |
| 8c | **No changes** -- Mark as synced | `updateSyncStatus('synced')` |

### 3.2 Outbound (MissionPulse to Cloud)

| Step | Action | Module |
|------|--------|--------|
| 1 | User edits content in MissionPulse | Application layer |
| 2 | `syncToCloud()` called with document ID, content, and provider | `sync-manager.ts` |
| 3 | Set `sync_status` to `'syncing'` | `updateSyncStatus()` |
| 4 | Fetch current cloud content for diff comparison | `fetchCloudContent()` |
| 5 | Compute diff between previous cloud content and new MissionPulse content | `computeDiff()` + `summarizeDiff()` |
| 6 | Push content to cloud provider via HTTP PUT | Provider-specific upload URL |
| 7 | Record new version in `document_versions` | Supabase insert |
| 8 | Update `document_sync_state` with `'synced'` status and timestamps | Supabase update |

### 3.3 Queue-Mediated Sync

The `SyncQueue` adds a debounce layer (default 5000ms) between edits and actual API calls:

1. Caller invokes `enqueue()` with a `SyncQueueItem` (document ID, provider, action, priority).
2. Duplicate entries for the same document+action are replaced (deduplication).
3. Items are sorted by priority (lower number = higher priority).
4. After the debounce interval, `processQueue()` processes all items in order.
5. Failed items are re-enqueued up to `MAX_RETRIES` (3) with decremented priority.
6. `flush()` bypasses the debounce for user-initiated sync.

---

## 4. Cloud Adapters

Each adapter encapsulates the API-specific logic for a single cloud document type. All adapters follow the same pattern: token management, content push, content pull, and a URL helper.

### 4.1 Word Online Adapter

**File:** `lib/sync/adapters/word-online.ts`
**API:** Microsoft Graph API v1.0 (`graph.microsoft.com`)
**Purpose:** Sync proposal section narrative content (technical volumes, management volumes, etc.) with Word Online documents.

Key functions:
- `pushToWordOnline(companyId, cloudFileId, sections)` -- Pushes named sections as markdown-style headings to the Word document body.
- `pullFromWordOnline(companyId, cloudFileId)` -- Pulls content and parses it into named sections via heading detection.
- `extractSections(graphContent)` -- Splits markdown-style content (`# Heading`) into a `Record<string, string>` map.
- `verifyCUIWatermark(content)` -- Checks for CUI marking patterns (CUI, CUI//SP-CTI, CUI//SP-EXPT) per NIST SP 800-171.

### 4.2 Excel Online Adapter

**File:** `lib/sync/adapters/excel-online.ts`
**API:** Microsoft Graph API v1.0 (Workbook endpoints)
**Purpose:** Sync pricing and cost volumes stored in Excel workbooks. Supports LCAT (Labor Category) structure mapping for government contract pricing.

Key functions:
- `pushToExcelOnline(companyId, cloudFileId, cells)` -- Pushes cell values via Graph API batch endpoint (batches of 20).
- `pullFromExcelOnline(companyId, cloudFileId)` -- Pulls the used range from the default worksheet and returns a flat cell map.
- `extractCells(sheetData)` -- Converts Graph worksheet range response to `{ "A1": value, "B2": value }` format.
- `mapLCATStructure(cells)` -- Maps columns A/B/C to labor category, rate, and hours (skipping the header row).

### 4.3 PPTX Online Adapter

**File:** `lib/sync/adapters/pptx-online.ts`
**API:** Microsoft Graph API v1.0 (Presentations endpoints)
**Purpose:** Sync orals presentations and gate review decks with PowerPoint Online.

Key functions:
- `pushToPptxOnline(companyId, cloudFileId, slides)` -- Pushes an array of slide payloads (title, body, notes) to the presentation.
- `pullFromPptxOnline(companyId, cloudFileId)` -- Pulls structured slide data including titles, body text, and speaker notes.
- `extractSlideContent(slideData)` -- Parses Graph API slide response into `SlideContent[]` with index, title, body, and notes.

### 4.4 Google Docs Adapter

**File:** `lib/sync/adapters/google-docs.ts`
**API:** Google Docs API v1 (`docs.googleapis.com`) + Google Drive API v3
**Purpose:** Sync proposal section narrative content with Google Docs. Supports push notifications for real-time change detection.

Key functions:
- `pushToGoogleDocs(companyId, fileId, sections)` -- Clears the document body and inserts new content via `batchUpdate` API.
- `pullFromGoogleDocs(companyId, fileId)` -- Reads the document body, extracts paragraph text with heading detection, and parses into named sections.
- `registerPushNotification(companyId, fileId, webhookUrl)` -- Registers a Drive push notification channel (24-hour expiry) for real-time change webhooks.
- `verifyCUIWatermark(content)` -- CUI marking verification identical to the Word Online adapter.

### 4.5 Google Sheets Adapter

**File:** `lib/sync/adapters/google-sheets.ts`
**API:** Google Sheets API v4 (`sheets.googleapis.com`) + Google Drive API v3
**Purpose:** Sync pricing and cost volumes stored in Google Sheets. Supports LCAT structure mapping.

Key functions:
- `pushToGoogleSheets(companyId, fileId, cells)` -- Pushes cell values via `values:batchUpdate` with `USER_ENTERED` input option.
- `pullFromGoogleSheets(companyId, fileId)` -- Reads all values from the default sheet and returns a flat cell map.
- `extractCells(sheetData)` -- Converts Sheets API value range to `{ "A1": value }` format with numeric coercion.
- `mapLCATStructure(cells)` -- Same LCAT mapping logic as the Excel adapter.

---

## 5. Conflict Resolution

### 5.1 Detection Strategy

Conflict detection is performed in `conflict-resolver.ts` using a three-way comparison when a base version is available, or a direct comparison otherwise.

**Three-way logic:**
1. Compare MissionPulse content against the base version to determine `mpChanged`.
2. Compare cloud content against the base version to determine `cloudChanged`.
3. If only one side changed, there is no conflict -- the changed side wins.
4. If both sides changed, scan line-by-line to identify **conflict regions** where both sides differ from the base at the same line positions.

**Conflict regions** are returned as `{ lineStart, lineEnd }` ranges identifying exactly which lines are in dispute.

### 5.2 Resolution Strategies

| Strategy | Value | Behavior |
|----------|-------|----------|
| **Keep MissionPulse** | `keep_mp` | Discard cloud changes; push MP content to cloud |
| **Keep Cloud** | `keep_cloud` | Accept cloud content; overwrite MP content |
| **Merge** | `merge` | Line-level merge with conflict markers (`<<<<<<< MissionPulse` / `>>>>>>> Cloud`) |

The merge strategy uses `getMergedContent()` which performs a line-by-line comparison:
- Identical lines are kept once.
- Lines present only in one version are preserved.
- Lines that differ are wrapped in Git-style conflict markers for manual review.

### 5.3 Side-by-Side Diff Viewer

The frontend displays conflicts using data from the diff engine:
- **Additions** (green) -- Lines present only in the new version.
- **Deletions** (red) -- Lines present only in the old version.
- **Modifications** (amber) -- Lines changed between versions.
- **Unchanged count** -- Total number of identical lines for context.

### 5.4 Resolution Audit Trail

When a conflict is resolved via `resolveConflict()`:
1. The `sync_conflicts` record is updated with `resolution`, `resolved_by`, and `resolved_at`.
2. The `document_sync_state` is cleared to `'synced'`.
3. An `audit_logs` entry is created with action `sync_conflict_resolved` for NIST AU-9 compliance.

---

## 6. Database Schema

### 6.1 `document_sync_state`

Tracks the synchronization state between a MissionPulse document and its cloud counterpart.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Auto-generated primary key |
| `document_id` | `uuid` | References the MissionPulse document (e.g., `proposal_sections.id`) |
| `company_id` | `uuid` FK | References `companies.id` (RLS scope) |
| `cloud_provider` | `text` | One of: `onedrive`, `google_drive`, `sharepoint` |
| `cloud_file_id` | `text` | Provider-specific file identifier |
| `sync_status` | `text` | One of: `idle`, `syncing`, `synced`, `conflict`, `error` |
| `last_sync_at` | `timestamptz` | Timestamp of last successful sync |
| `last_cloud_edit_at` | `timestamptz` | Last edit detected from cloud provider |
| `last_mp_edit_at` | `timestamptz` | Last edit made in MissionPulse |
| `cloud_web_url` | `text` | Web URL for opening the document in its cloud editor |
| `metadata` | `jsonb` | Provider-specific metadata (watch channel IDs, edit source, etc.) |
| `created_at` | `timestamptz` | Record creation timestamp |
| `updated_at` | `timestamptz` | Last update timestamp |

**Unique constraint:** `(document_id, cloud_provider)` -- one sync link per provider per document.

### 6.2 `sync_conflicts`

Records detected conflicts between MissionPulse and cloud versions for audit and resolution.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Auto-generated primary key |
| `document_id` | `uuid` | The document in conflict |
| `section_id` | `uuid` | Optional: specific section within the document |
| `company_id` | `uuid` FK | References `companies.id` (RLS scope) |
| `mp_version` | `jsonb` | MissionPulse side: `{ content, updated_at, updated_by? }` |
| `cloud_version` | `jsonb` | Cloud side: `{ content, updated_at, source? }` |
| `resolution` | `text` | One of: `keep_mp`, `keep_cloud`, `merge`, `pending` |
| `resolved_by` | `uuid` FK | References `profiles.id` -- who resolved it |
| `resolved_at` | `timestamptz` | When the conflict was resolved |
| `created_at` | `timestamptz` | When the conflict was detected |

### 6.3 `document_versions`

Immutable version history with full content snapshots and diff summaries.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Auto-generated primary key |
| `document_id` | `uuid` | The versioned document |
| `company_id` | `uuid` FK | References `companies.id` (RLS scope) |
| `version_number` | `integer` | Monotonically increasing version number per document |
| `source` | `text` | Origin of this version: `missionpulse`, `word_online`, `excel_online`, `pptx_online`, `google_docs`, `google_sheets` |
| `snapshot` | `jsonb` | Full content snapshot at this version |
| `diff_summary` | `jsonb` | Compact change summary: `{ additions, deletions, modifications, sections_changed? }` |
| `created_by` | `uuid` FK | References `profiles.id` |
| `created_at` | `timestamptz` | Version creation timestamp |

**Unique constraint:** `(document_id, version_number)` -- ensures monotonic versioning.

---

## 7. Security

### 7.1 CUI Watermark Preservation

Both the Word Online and Google Docs adapters include `verifyCUIWatermark()` which checks for standard CUI marking patterns before and after sync operations:

- `CUI`
- `CONTROLLED UNCLASSIFIED INFORMATION`
- `CUI//SP-CTI` (Specified -- Controlled Technical Information)
- `CUI//SP-EXPT` (Specified -- Export Controlled)

This ensures compliance with NIST SP 800-171 and CMMC control SC-13 for CUI handling.

### 7.2 Audit Logging

All sync operations produce immutable audit records:

| Action | When | NIST Control |
|--------|------|-------------|
| `sync_initialized` | New sync link created | AU-9 |
| `sync_conflict_resolved` | Conflict resolution applied | AU-9, AC-3 |
| `COORDINATION_EXECUTE` | Coordination rule fired | AU-9 |

Audit logs are written to the `audit_logs` table which is immutable (insert-only, no updates or deletes per RLS policy).

### 7.3 Row Level Security

All Phase J tables enforce company-scoped RLS policies:

```sql
USING (company_id IN (
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
))
```

This ensures:
- Users can only view/modify sync state, conflicts, versions, rules, and logs belonging to their own company.
- Cross-company data access is impossible at the database level regardless of application logic.
- The `coordination_log` table is SELECT-only for users (insert is done via service role).

### 7.4 Token Management

OAuth tokens for cloud providers are stored encrypted in the `integrations` table. Each adapter:

1. Retrieves the encrypted credentials for the user's company.
2. Checks token expiry with a 60-second buffer.
3. Refreshes the token via the provider's refresh endpoint if expired.
4. Persists the new token back to the database.
5. Returns `null` if the token cannot be obtained, causing the sync operation to fail gracefully.
