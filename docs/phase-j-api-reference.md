# Phase J API Reference

**MissionPulse v1.3 | Sprints 29-31 | Phase J**

All functions listed below are Next.js server actions (marked `'use server'`) unless noted as pure utility functions. Return types use the standard `ActionResult` pattern:

```typescript
type ActionResult<T = void> = { success: true; data?: T } | { success: false; error: string }
```

---

## 1. Sync Manager

**File:** `lib/sync/sync-manager.ts`

### `processWebhook`

```typescript
async function processWebhook(
  provider: CloudProvider,
  payload: Record<string, unknown>
): Promise<void>
```

Process an incoming webhook notification from a cloud provider. Extracts the cloud file ID from the provider-specific payload, looks up the matching `document_sync_state` record, fetches the current cloud content, runs conflict detection, and either pulls the cloud content (if no conflict) or creates a conflict record.

| Parameter | Type | Description |
|-----------|------|-------------|
| `provider` | `CloudProvider` | `'onedrive'`, `'google_drive'`, or `'sharepoint'` |
| `payload` | `Record<string, unknown>` | Raw webhook payload from the cloud provider |

**Returns:** `void` -- Side effects are database writes (sync state, conflict records).

---

### `fetchCloudContent`

```typescript
async function fetchCloudContent(
  documentId: string,
  provider: CloudProvider
): Promise<{ content: string; lastModified: string } | null>
```

Fetch the current content and metadata of a document from its cloud provider. Looks up the `cloud_file_id` from `document_sync_state`, retrieves an OAuth token, fetches the raw content and metadata, and returns both.

| Parameter | Type | Description |
|-----------|------|-------------|
| `documentId` | `string` | MissionPulse document UUID |
| `provider` | `CloudProvider` | Target cloud provider |

**Returns:** `{ content: string; lastModified: string }` on success, `null` on failure.

---

### `syncToCloud`

```typescript
async function syncToCloud(
  documentId: string,
  content: string,
  provider: CloudProvider
): Promise<ActionResult>
```

Push content from MissionPulse to the cloud provider. Fetches the current cloud content for diff computation, pushes the new content via HTTP PUT, records a new version in `document_versions`, and updates the sync state.

| Parameter | Type | Description |
|-----------|------|-------------|
| `documentId` | `string` | MissionPulse document UUID |
| `content` | `string` | Content to push |
| `provider` | `CloudProvider` | Target cloud provider |

**Returns:** `ActionResult` -- `{ success: true }` or `{ success: false, error: string }`.

---

### `getSyncStatus`

```typescript
async function getSyncStatus(
  documentId: string
): Promise<DocumentSyncState | null>
```

Get the current sync status for a document by querying `document_sync_state`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `documentId` | `string` | MissionPulse document UUID |

**Returns:** Full `DocumentSyncState` object or `null` if no sync is configured.

---

### `initializeSync`

```typescript
async function initializeSync(
  documentId: string,
  provider: CloudProvider,
  cloudFileId: string,
  companyId: string
): Promise<ActionResult>
```

Initialize sync for a document by creating a `document_sync_state` record. Called when a user first connects a document to a cloud file. Rejects if sync already exists for this document+provider combination. Writes an `audit_logs` entry with action `sync_initialized`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `documentId` | `string` | MissionPulse document UUID |
| `provider` | `CloudProvider` | Cloud provider to connect |
| `cloudFileId` | `string` | Provider-specific file identifier |
| `companyId` | `string` | Company UUID for RLS scope |

**Returns:** `ActionResult`.

---

## 2. Conflict Resolver

**File:** `lib/sync/conflict-resolver.ts`

### `detectConflict`

```typescript
async function detectConflict(
  mpContent: string,
  cloudContent: string,
  baseContent: string | null
): Promise<{
  hasConflict: boolean
  mpChanged: boolean
  cloudChanged: boolean
  conflictRegions: { lineStart: number; lineEnd: number }[]
}>
```

Detect whether MissionPulse and cloud content have diverged from a common base. Uses three-way comparison when `baseContent` is provided; falls back to direct comparison otherwise. Returns line-range conflict regions when both sides have changed.

| Parameter | Type | Description |
|-----------|------|-------------|
| `mpContent` | `string` | Current MissionPulse content |
| `cloudContent` | `string` | Current cloud content |
| `baseContent` | `string \| null` | Common ancestor content (null for direct comparison) |

**Returns:** Object with `hasConflict`, change flags, and `conflictRegions[]`.

---

### `resolveConflict`

```typescript
async function resolveConflict(
  conflictId: string,
  resolution: ConflictResolution,
  userId: string
): Promise<ActionResult>
```

Resolve an existing conflict by updating the `sync_conflicts` record with the chosen resolution. Clears the conflict status on `document_sync_state` and writes an `audit_logs` entry for AU-9 compliance.

| Parameter | Type | Description |
|-----------|------|-------------|
| `conflictId` | `string` | UUID of the `sync_conflicts` record |
| `resolution` | `ConflictResolution` | `'keep_mp'`, `'keep_cloud'`, or `'merge'` (not `'pending'`) |
| `userId` | `string` | UUID of the resolving user |

**Returns:** `ActionResult`.

---

### `getMergedContent`

```typescript
async function getMergedContent(
  mpContent: string,
  cloudContent: string
): Promise<string>
```

Produce merged content from MissionPulse and cloud versions using line-level merge. Identical lines are kept once. Lines present in only one version are preserved. Conflicting lines are wrapped in Git-style conflict markers:

```
<<<<<<< MissionPulse
MP line content
=======
Cloud line content
>>>>>>> Cloud
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `mpContent` | `string` | MissionPulse version |
| `cloudContent` | `string` | Cloud version |

**Returns:** Merged content string with conflict markers where applicable.

---

### `createConflictRecord`

```typescript
async function createConflictRecord(
  documentId: string,
  sectionId: string | null,
  companyId: string,
  mpVersion: SyncConflict['mp_version'],
  cloudVersion: SyncConflict['cloud_version']
): Promise<ActionResult<{ conflictId: string }>>
```

Insert a new `sync_conflicts` record and set the document's sync status to `'conflict'`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `documentId` | `string` | Document UUID |
| `sectionId` | `string \| null` | Optional section UUID for section-level conflicts |
| `companyId` | `string` | Company UUID |
| `mpVersion` | `{ content: string; updated_at: string; updated_by?: string }` | MissionPulse side data |
| `cloudVersion` | `{ content: string; updated_at: string; source?: string }` | Cloud side data |

**Returns:** `ActionResult<{ conflictId: string }>` with the new conflict record ID.

---

## 3. Diff Engine

**File:** `lib/sync/diff-engine.ts`

### `computeDiff`

```typescript
async function computeDiff(
  oldContent: string,
  newContent: string
): Promise<DiffResult>
```

Compute a line-by-line diff between two content strings using an LCS (Longest Common Subsequence) algorithm. Groups consecutive changes into blocks and classifies them as additions, deletions, or modifications.

| Parameter | Type | Description |
|-----------|------|-------------|
| `oldContent` | `string` | Previous content |
| `newContent` | `string` | Updated content |

**Returns:** `DiffResult` -- `{ additions: DiffBlock[], deletions: DiffBlock[], modifications: DiffBlock[], unchanged: number }`.

---

### `computeSectionDiff`

```typescript
async function computeSectionDiff(
  oldSections: Record<string, string>,
  newSections: Record<string, string>
): Promise<DiffResult>
```

Compute a section-level diff between two sets of named sections. Each key represents a section name. Identifies added sections, removed sections, and modified sections.

| Parameter | Type | Description |
|-----------|------|-------------|
| `oldSections` | `Record<string, string>` | Previous section map |
| `newSections` | `Record<string, string>` | Updated section map |

**Returns:** `DiffResult` with section-level `DiffBlock` entries (path = section name).

---

### `summarizeDiff`

```typescript
async function summarizeDiff(
  diff: DiffResult
): Promise<{ additions: number; deletions: number; modifications: number }>
```

Summarize a diff result into compact counts. Used for `document_versions.diff_summary`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `diff` | `DiffResult` | Output from `computeDiff` or `computeSectionDiff` |

**Returns:** `{ additions: number; deletions: number; modifications: number }`.

---

## 4. Sync Queue

**File:** `lib/sync/sync-queue.ts`

The sync queue is a server-side singleton with debounced processing. Module constants:

- `SYNC_DEBOUNCE_MS = 5000` -- Minimum time between queue flushes.
- `MAX_RETRIES = 3` -- Maximum retry attempts per item.

### `enqueue`

```typescript
async function enqueue(item: SyncQueueItem): Promise<void>
```

Add an item to the sync queue. Deduplicates by replacing any existing entry with the same `documentId` and `action`. Items are sorted by priority (lower = higher priority). Automatically schedules a debounced flush.

| Parameter | Type | Description |
|-----------|------|-------------|
| `item` | `SyncQueueItem` | `{ id, documentId, provider, action, priority, enqueuedAt, attempts }` |

---

### `processQueue`

```typescript
async function processQueue(): Promise<{
  processed: number
  failed: number
  remaining: number
}>
```

Process all items currently in the queue. Items are processed in priority order. Failed items are re-enqueued up to `MAX_RETRIES` with decremented priority. Returns no-op counts if already processing.

**Returns:** `{ processed, failed, remaining }` counts.

---

### `flush`

```typescript
async function flush(): Promise<{
  processed: number
  failed: number
  remaining: number
}>
```

Immediately flush and process the queue, bypassing the debounce timer. Used for user-initiated sync operations.

**Returns:** Same as `processQueue`.

---

### `getQueueLength`

```typescript
async function getQueueLength(): Promise<number>
```

Get the current number of items in the queue.

---

### `getPendingItems`

```typescript
async function getPendingItems(
  documentId: string
): Promise<SyncQueueItem[]>
```

Get all pending queue items for a specific document.

| Parameter | Type | Description |
|-----------|------|-------------|
| `documentId` | `string` | Document UUID to filter by |

---

### `removeFromQueue`

```typescript
async function removeFromQueue(
  documentId: string
): Promise<number>
```

Remove all pending items for a specific document. Returns the number of items removed.

| Parameter | Type | Description |
|-----------|------|-------------|
| `documentId` | `string` | Document UUID to remove |

---

### `createQueueItem`

```typescript
async function createQueueItem(
  documentId: string,
  provider: CloudProvider,
  action: 'push' | 'pull' | 'resolve',
  priority?: number
): Promise<SyncQueueItem>
```

Factory function that creates a `SyncQueueItem` with sensible defaults (random UUID, current timestamp, 0 attempts, default priority 5).

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `documentId` | `string` | -- | Document UUID |
| `provider` | `CloudProvider` | -- | Target cloud provider |
| `action` | `'push' \| 'pull' \| 'resolve'` | -- | Sync operation type |
| `priority` | `number` | `5` | Lower = higher priority |

---

## 5. Coordination Engine

**File:** `lib/sync/coordination-engine.ts`

### `executeCoordination`

```typescript
async function executeCoordination(
  ruleId: string,
  triggerDocumentId: string,
  companyId: string
): Promise<ActionResult>
```

Execute a single coordination rule. Loads the rule, extracts the source value from the trigger document's latest version snapshot, applies the configured transform, writes updated versions to all matching target documents, and logs the execution to `coordination_log` and `audit_logs`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `ruleId` | `string` | UUID of the coordination rule |
| `triggerDocumentId` | `string` | Document whose change triggered this rule |
| `companyId` | `string` | Company UUID for RLS scope |

**Returns:** `ActionResult` -- succeeds even when rule is skipped (no matching targets or source field not found).

---

### `previewCascade`

```typescript
async function previewCascade(
  ruleId: string,
  newValue: unknown
): Promise<CascadePreviewItem[]>
```

Preview what would change if a coordination rule fired with a given value. **Read-only** -- does not modify any data. Returns an array of preview items showing affected documents and the before/after field values.

| Parameter | Type | Description |
|-----------|------|-------------|
| `ruleId` | `string` | UUID of the coordination rule |
| `newValue` | `unknown` | Simulated new source value |

**Returns:** `CascadePreviewItem[]` (empty array if rule not found or no targets matched).

---

### `getActiveRules`

```typescript
async function getActiveRules(
  companyId: string
): Promise<CoordinationRule[]>
```

Fetch all active (`is_active = true`) coordination rules for a company, ordered by `created_at` descending.

| Parameter | Type | Description |
|-----------|------|-------------|
| `companyId` | `string` | Company UUID |

**Returns:** `CoordinationRule[]` (empty array on error).

---

## 6. Coordination Rules

**File:** `lib/sync/coordination-rules.ts`

### `createRule`

```typescript
async function createRule(
  data: Omit<CoordinationRule, 'id' | 'created_at' | 'updated_at'>
): Promise<ActionResult>
```

Create a new coordination rule. Validates document types against the known set (15 valid types), validates the transform type, validates non-empty field paths, rejects self-referencing rules, and writes an `audit_logs` entry with action `CREATE`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `Omit<CoordinationRule, 'id' \| 'created_at' \| 'updated_at'>` | Rule data excluding auto-generated fields |

**Returns:** `ActionResult`.

---

### `updateRule`

```typescript
async function updateRule(
  ruleId: string,
  updates: Partial<Pick<CoordinationRule,
    'source_field_path' | 'target_field_path' | 'transform_type' | 'is_active' | 'description'
  >>
): Promise<ActionResult>
```

Update an existing coordination rule. Only specified fields are changed. Validates transform type and field paths if provided. Writes an `audit_logs` entry with action `UPDATE` listing the changed field names.

| Parameter | Type | Description |
|-----------|------|-------------|
| `ruleId` | `string` | UUID of the rule to update |
| `updates` | `Partial<Pick<CoordinationRule, ...>>` | Fields to change |

**Returns:** `ActionResult`.

---

### `deleteRule`

```typescript
async function deleteRule(
  ruleId: string
): Promise<ActionResult>
```

Soft-delete a coordination rule by setting `is_active = false`. The record is preserved for audit trail purposes. Writes an `audit_logs` entry with action `DELETE` and `soft_delete: true`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `ruleId` | `string` | UUID of the rule to deactivate |

**Returns:** `ActionResult`.

---

### `getRulesByCompany`

```typescript
async function getRulesByCompany(
  companyId: string
): Promise<CoordinationRule[]>
```

Fetch all coordination rules (both active and inactive) for a company, ordered by `created_at` descending.

| Parameter | Type | Description |
|-----------|------|-------------|
| `companyId` | `string` | Company UUID |

**Returns:** `CoordinationRule[]` (empty array on error).

---

## 7. Version Tracker

**File:** `lib/sync/version-tracker.ts`

### `recordVersion`

```typescript
async function recordVersion(
  documentId: string,
  companyId: string,
  source: string,
  content: Record<string, unknown>
): Promise<ActionResult>
```

Create a new version record for a document. Auto-computes the next `version_number`. If a previous version exists, computes a diff summary and identifies changed top-level sections.

| Parameter | Type | Description |
|-----------|------|-------------|
| `documentId` | `string` | Document UUID |
| `companyId` | `string` | Company UUID for RLS scope |
| `source` | `string` | Origin identifier (e.g., `'missionpulse'`, `'google_docs'`) |
| `content` | `Record<string, unknown>` | Full document snapshot |

**Returns:** `ActionResult`.

---

### `getVersionHistory`

```typescript
async function getVersionHistory(
  documentId: string,
  limit?: number
): Promise<DocumentVersion[]>
```

Fetch version history for a document, ordered by `version_number` descending (most recent first).

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `documentId` | `string` | -- | Document UUID |
| `limit` | `number` | `50` | Maximum versions to return |

**Returns:** `DocumentVersion[]` (empty array on error).

---

### `getVersionDiff`

```typescript
async function getVersionDiff(
  versionId1: string,
  versionId2: string
): Promise<DiffResult | null>
```

Compare two specific versions by computing a diff on their serialized snapshots. Both versions are fetched in parallel.

| Parameter | Type | Description |
|-----------|------|-------------|
| `versionId1` | `string` | The "old" version UUID (left side of diff) |
| `versionId2` | `string` | The "new" version UUID (right side of diff) |

**Returns:** `DiffResult` or `null` if either version cannot be found.

---

## 8. Cloud Binder

**File:** `lib/utils/cloud-binder-assembly.ts`

### `assembleCloudBinder`

```typescript
async function assembleCloudBinder(
  opportunityId: string
): Promise<ActionResult<{ url: string }>>
```

Assemble a cloud-aware proposal binder as a ZIP archive. Fetches all `proposal_sections` for the opportunity, queries sync status from `document_sync_state`, generates a JSON manifest with full sync metadata, packages section content as `.txt` files organized by volume, and uploads the ZIP to Supabase Storage. Returns a signed download URL valid for 1 hour.

| Parameter | Type | Description |
|-----------|------|-------------|
| `opportunityId` | `string` | Opportunity UUID |

**Returns:** `ActionResult<{ url: string }>` with signed download URL.

---

### `getArtifactStatuses`

```typescript
async function getArtifactStatuses(
  opportunityId: string
): Promise<ArtifactStatus[]>
```

Fetch sync status for all proposal artifacts in an opportunity. Joins `proposal_sections` with `document_sync_state` to produce a combined status view including volume name, sync status, cloud provider, last editor info, and word count.

| Parameter | Type | Description |
|-----------|------|-------------|
| `opportunityId` | `string` | Opportunity UUID |

**Returns:** `ArtifactStatus[]` (empty array if no sections found).

---

## 9. Timeline Utils

**File:** `lib/proposals/timeline-utils.ts`

All functions in this module are pure TypeScript utilities (no `'use server'` directive, no async, no database access).

### `daysBetween`

```typescript
function daysBetween(dateA: string, dateB: string): number
```

Calculate the absolute number of days between two ISO date strings.

---

### `getMilestoneColor`

```typescript
function getMilestoneColor(type: MilestoneType): string
```

Return a Tailwind `text-*` color class for a milestone type.

| Type | Class |
|------|-------|
| `gate_review` | `text-purple-400` |
| `color_team` | `text-amber-400` |
| `submission` | `text-red-400` |
| `debrief` | `text-blue-400` |
| `kickoff` | `text-emerald-400` |
| `draft_due` | `text-cyan-400` |
| `final_due` | `text-rose-400` |
| `custom` | `text-slate-400` |

---

### `getMilestoneBgColor`

```typescript
function getMilestoneBgColor(type: MilestoneType): string
```

Return a Tailwind `bg-*` color class for timeline markers/dots.

---

### `getMilestoneIcon`

```typescript
function getMilestoneIcon(type: MilestoneType): string
```

Return a lucide-react icon name string for a milestone type (e.g., `'ShieldCheck'` for `gate_review`).

---

### `getStatusColor`

```typescript
function getStatusColor(status: MilestoneStatus): string
```

Return combined Tailwind classes (background + text + border) for a milestone status badge.

| Status | Classes |
|--------|---------|
| `upcoming` | `bg-blue-500/15 text-blue-300 border-blue-500/30` |
| `in_progress` | `bg-amber-500/15 text-amber-300 border-amber-500/30` |
| `completed` | `bg-emerald-500/15 text-emerald-300 border-emerald-500/30` |
| `missed` | `bg-red-500/15 text-red-300 border-red-500/30` |
| `cancelled` | `bg-slate-500/15 text-slate-400 border-slate-500/30` |

---

### `sortMilestones`

```typescript
function sortMilestones(milestones: ProposalMilestone[]): ProposalMilestone[]
```

Return a new array of milestones sorted by `scheduled_date` ascending (earliest first). Does not mutate the input.

---

### `getTimelineRange`

```typescript
function getTimelineRange(milestones: ProposalMilestone[]): {
  start: string
  end: string
  totalDays: number
}
```

Calculate the date range spanning all milestones. Returns today-based defaults with `totalDays: 0` if the array is empty.

---

### `calculatePosition`

```typescript
function calculatePosition(date: string, start: string, totalDays: number): number
```

Map a date to a 0-100 percentage position within a timeline range. Returns `50` if `totalDays` is 0. Clamps output to `[0, 100]`.

---

### `formatMilestoneType`

```typescript
function formatMilestoneType(type: MilestoneType): string
```

Convert a milestone type slug to a human-readable label (e.g., `'gate_review'` becomes `"Gate Review"`).

---

### `formatMilestoneStatus`

```typescript
function formatMilestoneStatus(status: MilestoneStatus): string
```

Convert a milestone status slug to a human-readable label (e.g., `'in_progress'` becomes `"In Progress"`).

---

### `formatDate`

```typescript
function formatDate(iso: string): string
```

Format an ISO date string to `"Feb 22, 2026"` style.

---

### `formatDateShort`

```typescript
function formatDateShort(iso: string): string
```

Format an ISO date string to `"Feb 22"` style (no year).

---

## 10. Cloud Adapters

### 10.1 Word Online

**File:** `lib/sync/adapters/word-online.ts`

#### `pushToWordOnline`

```typescript
async function pushToWordOnline(
  companyId: string,
  cloudFileId: string,
  sections: Record<string, string>
): Promise<ActionResult>
```

Push section content to a Word Online document via Microsoft Graph API. Concatenates sections with markdown-style headings and uploads as the document body.

#### `pullFromWordOnline`

```typescript
async function pullFromWordOnline(
  companyId: string,
  cloudFileId: string
): Promise<{ sections: Record<string, string>; lastModified: string } | null>
```

Pull content from a Word Online document. Fetches raw content and metadata, parses into named sections via heading detection.

#### `extractSections`

```typescript
function extractSections(graphContent: string): Record<string, string>
```

Parse markdown-style content into named sections. Splits on `# Heading` / `## Heading` / `### Heading` patterns.

#### `verifyCUIWatermark`

```typescript
function verifyCUIWatermark(content: string): boolean
```

Verify CUI marking presence. Returns `true` if any standard CUI marker is found.

#### `getWordOnlineUrl`

```typescript
async function getWordOnlineUrl(
  companyId: string,
  cloudFileId: string
): Promise<string | null>
```

Get the Word Online web URL via Graph API metadata.

---

### 10.2 Excel Online

**File:** `lib/sync/adapters/excel-online.ts`

#### `pushToExcelOnline`

```typescript
async function pushToExcelOnline(
  companyId: string,
  cloudFileId: string,
  cells: Record<string, string | number>
): Promise<ActionResult>
```

Push cell values to an Excel Online workbook via Graph API batch endpoint. Processes cells in batches of 20.

#### `pullFromExcelOnline`

```typescript
async function pullFromExcelOnline(
  companyId: string,
  cloudFileId: string
): Promise<{ cells: Record<string, string | number>; lastModified: string } | null>
```

Pull the used range from the default worksheet and return as a flat cell map.

#### `extractCells`

```typescript
function extractCells(
  sheetData: Record<string, unknown>
): Record<string, string | number>
```

Convert Graph worksheet range response (`{ values, address }`) to flat `{ "A1": value }` format.

#### `mapLCATStructure`

```typescript
function mapLCATStructure(
  cells: Record<string, string | number>
): LCATRow[]
```

Map flat cell data to LCAT pricing structure. Column A = labor category, B = rate, C = hours. Skips header row.

#### `getExcelOnlineUrl`

```typescript
async function getExcelOnlineUrl(
  companyId: string,
  cloudFileId: string
): Promise<string | null>
```

Get the Excel Online web URL via Graph API metadata.

---

### 10.3 PPTX Online

**File:** `lib/sync/adapters/pptx-online.ts`

#### `pushToPptxOnline`

```typescript
async function pushToPptxOnline(
  companyId: string,
  cloudFileId: string,
  slides: { title: string; body: string; notes: string }[]
): Promise<ActionResult>
```

Push slide content to a PowerPoint Online presentation via Graph API.

#### `pullFromPptxOnline`

```typescript
async function pullFromPptxOnline(
  companyId: string,
  cloudFileId: string
): Promise<{ slides: SlideContent[]; lastModified: string } | null>
```

Pull structured slide data from a PowerPoint Online presentation. Returns `SlideContent[]` with `slideIndex`, `title`, `body`, and `notes` for each slide.

#### `extractSlideContent`

```typescript
function extractSlideContent(
  slideData: Record<string, unknown>[]
): SlideContent[]
```

Parse Graph API slide response into structured `SlideContent` objects.

#### `getPptxOnlineUrl`

```typescript
async function getPptxOnlineUrl(
  companyId: string,
  cloudFileId: string
): Promise<string | null>
```

Get the PowerPoint Online web URL via Graph API metadata.

---

### 10.4 Google Docs

**File:** `lib/sync/adapters/google-docs.ts`

#### `pushToGoogleDocs`

```typescript
async function pushToGoogleDocs(
  companyId: string,
  fileId: string,
  sections: Record<string, string>
): Promise<ActionResult>
```

Push section content to a Google Doc via `batchUpdate` API. Clears existing body content and inserts new text with heading markers.

#### `pullFromGoogleDocs`

```typescript
async function pullFromGoogleDocs(
  companyId: string,
  fileId: string
): Promise<{ sections: Record<string, string>; lastModified: string } | null>
```

Pull content from a Google Doc. Reads the document body, extracts text with heading detection (markdown-style and Google Docs `namedStyleType`), and parses into named sections.

#### `registerPushNotification`

```typescript
async function registerPushNotification(
  companyId: string,
  fileId: string,
  webhookUrl: string
): Promise<ActionResult>
```

Register a Drive push notification channel for real-time change detection. Channel expires after 24 hours. Stores channel metadata in `document_sync_state.metadata`.

#### `extractSections`

```typescript
function extractSections(docContent: string): Record<string, string>
```

Parse Google Docs content into named sections. Detects headings via markdown patterns and ALL-CAPS line detection.

#### `verifyCUIWatermark`

```typescript
function verifyCUIWatermark(content: string): boolean
```

Verify CUI marking presence (identical logic to Word Online adapter).

#### `getGoogleDocsUrl`

```typescript
function getGoogleDocsUrl(fileId: string): string
```

Return the deterministic Google Docs editor URL: `https://docs.google.com/document/d/<fileId>/edit`. No API call needed.

---

### 10.5 Google Sheets

**File:** `lib/sync/adapters/google-sheets.ts`

#### `pushToGoogleSheets`

```typescript
async function pushToGoogleSheets(
  companyId: string,
  fileId: string,
  cells: Record<string, string | number>
): Promise<ActionResult>
```

Push cell values to a Google Sheet via `values:batchUpdate` with `USER_ENTERED` input option.

#### `pullFromGoogleSheets`

```typescript
async function pullFromGoogleSheets(
  companyId: string,
  fileId: string
): Promise<{ cells: Record<string, string | number>; lastModified: string } | null>
```

Pull all values from the default sheet and return as a flat cell map with numeric coercion.

#### `extractCells`

```typescript
function extractCells(
  sheetData: Record<string, unknown>
): Record<string, string | number>
```

Convert Sheets API value range response (`{ values, range }`) to flat `{ "A1": value }` format. Performs numeric coercion for string values that represent numbers.

#### `mapLCATStructure`

```typescript
function mapLCATStructure(
  cells: Record<string, string | number>
): LCATRow[]
```

Map flat cell data to LCAT pricing structure. Same logic as the Excel Online adapter.

#### `getGoogleSheetsUrl`

```typescript
function getGoogleSheetsUrl(fileId: string): string
```

Return the deterministic Google Sheets editor URL: `https://docs.google.com/spreadsheets/d/<fileId>/edit`. No API call needed.
