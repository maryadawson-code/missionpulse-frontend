# Phase J Collaboration Features

**MissionPulse v1.3 | Sprint 30-31 | Phase J**

---

## 1. Overview

Phase J introduces a comprehensive collaboration layer for proposal teams working across MissionPulse and cloud document editors. The collaboration features build on top of the Sync Engine (Sprint 29) and Cross-Document Intelligence (Sprint 30) to provide:

- **Version tracking** with cloud source attribution for every content change.
- **Milestone timelines** with Gantt-style visualization of Shipley process gates.
- **Section assignments** for work breakdown across team members.
- **Cloud binder assembly** that packages all proposal artifacts with sync metadata.
- **Collaboration workspace** as a unified page for monitoring proposal health.

**Source files:**
- `lib/sync/version-tracker.ts` -- Version recording and history
- `lib/proposals/timeline-utils.ts` -- Timeline calculation utilities
- `lib/utils/cloud-binder-assembly.ts` -- ZIP binder generation with sync metadata
- `lib/types/sync.ts` -- TypeScript interfaces for all Phase J data structures

---

## 2. Version Tracking

### 2.1 Automatic Versioning

Every content change -- whether originating from MissionPulse, a cloud editor, or the coordination engine -- is recorded as an immutable version in the `document_versions` table. Each version captures:

- **Full content snapshot** (`jsonb`) -- The complete document state at that point in time.
- **Source attribution** -- Which system produced this version (`missionpulse`, `word_online`, `excel_online`, `pptx_online`, `google_docs`, or `google_sheets`).
- **Diff summary** -- A compact record of how many additions, deletions, and modifications were made relative to the previous version, plus which top-level sections changed.
- **Author** -- The `profiles.id` of the user who triggered the change (when available).
- **Monotonic version number** -- Auto-incremented per document.

### 2.2 Recording Versions

The `recordVersion()` function in `version-tracker.ts` handles the full recording workflow:

1. Authenticates the current user via Supabase auth.
2. Queries the latest existing version for the document.
3. Computes `nextVersionNumber = previousVersionNumber + 1`.
4. If a previous version exists, serializes both snapshots to stable text format (sorted keys) and runs the diff engine to produce a change summary.
5. Detects which top-level snapshot keys changed between versions.
6. Inserts the new version record with snapshot, diff summary, and attribution.

### 2.3 Version History

`getVersionHistory(documentId, limit?)` returns up to 50 versions (configurable) ordered by version number descending. Each entry includes the full snapshot and diff summary, enabling the UI to display a timeline of changes with expandable details.

### 2.4 Version Comparison

`getVersionDiff(versionId1, versionId2)` fetches two specific versions, serializes their snapshots, and runs the diff engine to produce a full `DiffResult` with line-level additions, deletions, and modifications. This powers the side-by-side comparison view in the UI.

### 2.5 Serialization for Diffing

Document snapshots are JSON objects with arbitrary nesting. To perform line-level diffing, the version tracker serializes them to a deterministic text format:

- Top-level keys are sorted alphabetically.
- String values are rendered as `key: value`.
- Nested objects are rendered as `key: {"sorted":"json"}` using `stableStringify()`.
- Arrays use stable JSON with sorted object keys.

This ensures that semantically identical snapshots always produce identical text, avoiding false-positive diffs from JSON key ordering differences.

---

## 3. Milestone Timeline

### 3.1 Overview

The milestone timeline provides a Gantt-style visualization of key Shipley process gates and deadlines for a proposal. Each milestone represents a significant event in the proposal lifecycle (e.g., color team reviews, gate reviews, submission deadline).

### 3.2 Milestone Types

| Type | Color | Icon | Purpose |
|------|-------|------|---------|
| `gate_review` | Purple | ShieldCheck | Shipley decision gate |
| `color_team` | Amber | Palette | Pink/Red/Gold/Blue team reviews |
| `submission` | Red | Send | Final proposal submission date |
| `debrief` | Blue | MessageCircle | Post-submission government debrief |
| `kickoff` | Emerald | Rocket | Proposal effort kickoff |
| `draft_due` | Cyan | FileEdit | Internal draft deadlines |
| `final_due` | Rose | FileCheck2 | Final volume delivery dates |
| `custom` | Slate | Flag | User-defined milestones |

### 3.3 Status Workflow

Milestones progress through the following statuses:

```
upcoming --> in_progress --> completed
                |
                +--> missed
                |
                +--> cancelled
```

| Status | Badge Colors | Meaning |
|--------|-------------|---------|
| `upcoming` | Blue background/text | Scheduled but not started |
| `in_progress` | Amber background/text | Currently active |
| `completed` | Emerald background/text | Successfully completed |
| `missed` | Red background/text | Past scheduled date, not completed |
| `cancelled` | Slate background/text | No longer applicable |

### 3.4 Timeline Calculations

The `timeline-utils.ts` module provides pure TypeScript functions for timeline rendering:

- **`daysBetween(dateA, dateB)`** -- Absolute day count between two ISO dates.
- **`getTimelineRange(milestones)`** -- Computes the earliest start, latest end, and total days spanning all milestones. Returns `{ start, end, totalDays }`.
- **`calculatePosition(date, start, totalDays)`** -- Maps a date to a 0-100 percentage position within the timeline range. Returns 50 (center) if `totalDays` is zero. Clamps to `[0, 100]`.
- **`sortMilestones(milestones)`** -- Returns a new array sorted by `scheduled_date` ascending.

### 3.5 Formatting Helpers

- **`formatMilestoneType(type)`** -- Converts slugs like `gate_review` to `"Gate Review"`.
- **`formatMilestoneStatus(status)`** -- Converts slugs like `in_progress` to `"In Progress"`.
- **`formatDate(iso)`** -- Renders as `"Feb 22, 2026"`.
- **`formatDateShort(iso)`** -- Renders as `"Feb 22"`.
- **`getMilestoneColor(type)`** -- Returns Tailwind text color class for a milestone type.
- **`getMilestoneBgColor(type)`** -- Returns Tailwind background color class for timeline markers.
- **`getMilestoneIcon(type)`** -- Returns the lucide-react icon name for a milestone type.
- **`getStatusColor(status)`** -- Returns combined Tailwind classes (background + text + border) for a status badge.

### 3.6 Database Schema

```sql
CREATE TABLE public.proposal_milestones (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id  uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  company_id      uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  milestone_type  text NOT NULL CHECK (milestone_type IN (
    'gate_review', 'color_team', 'submission', 'debrief',
    'kickoff', 'draft_due', 'final_due', 'custom'
  )),
  title           text NOT NULL,
  scheduled_date  date NOT NULL,
  actual_date     date,
  status          text NOT NULL DEFAULT 'upcoming' CHECK (status IN (
    'upcoming', 'in_progress', 'completed', 'missed', 'cancelled'
  )),
  notes           text,
  created_by      uuid REFERENCES public.profiles(id),
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);
```

**Index:** `idx_proposal_milestones_opp` on `opportunity_id` for fast per-opportunity lookups.

---

## 4. Section Assignments

### 4.1 Work Breakdown Matrix

Section assignments map proposal sections to team members, creating a work breakdown structure. Each assignment tracks:

| Field | Description |
|-------|-------------|
| `section_id` | The proposal section being assigned |
| `assignee_id` | The team member responsible (references `profiles.id`) |
| `volume` | The proposal volume this section belongs to (e.g., "Technical Volume") |
| `status` | Assignment progress: `assigned`, `in_progress`, `review`, or `complete` |
| `word_count` | Current word count for the section (updated as content changes) |
| `deadline` | Due date for this section assignment |
| `assigned_by` | Who created the assignment |

### 4.2 Assignment Status Workflow

```
assigned --> in_progress --> review --> complete
```

| Status | Meaning |
|--------|---------|
| `assigned` | Task assigned but author has not started |
| `in_progress` | Author is actively writing |
| `review` | Section submitted for review |
| `complete` | Section approved and finalized |

### 4.3 Team Rollup

The assignment data supports aggregation views:

- **Per-volume summary:** Total sections, completed sections, total word count per volume.
- **Per-assignee summary:** Number of sections assigned, sections completed, sections overdue.
- **Overall proposal progress:** Percentage of sections at `complete` status.

### 4.4 Database Schema

```sql
CREATE TABLE public.section_assignments (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id   uuid NOT NULL,
  assignee_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id   uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  volume       text,
  status       text NOT NULL DEFAULT 'assigned' CHECK (status IN (
    'assigned', 'in_progress', 'review', 'complete'
  )),
  word_count   integer DEFAULT 0,
  deadline     date,
  assigned_by  uuid REFERENCES public.profiles(id),
  assigned_at  timestamptz DEFAULT now() NOT NULL,
  updated_at   timestamptz DEFAULT now() NOT NULL,
  UNIQUE(section_id, assignee_id)
);
```

**Unique constraint:** `(section_id, assignee_id)` -- one assignment per person per section.

**Indexes:**
- `idx_section_assignments_section` on `section_id`
- `idx_section_assignments_assignee` on `assignee_id`

---

## 5. Cloud Binder Assembly

### 5.1 Overview

The Cloud Binder Assembly function packages all proposal artifacts into a downloadable ZIP archive that includes full sync metadata. This is the "export everything" function used for formal proposal submissions, archival, and offline review.

**Source file:** `lib/utils/cloud-binder-assembly.ts`

### 5.2 Binder Contents

The generated ZIP archive contains:

1. **Volume folders** -- Sections are grouped by their `volume` field into subdirectories (e.g., `Technical_Volume/`, `Pricing_Volume/`, `Unassigned/`).
2. **Section text files** -- Each proposal section's content is exported as a `.txt` file named after the section title.
3. **Sync metadata manifest** -- A JSON file (`<title>_manifest_<date>.json`) at the root of the ZIP containing:

### 5.3 Manifest Structure

```typescript
interface BinderManifest {
  opportunityId: string           // The opportunity this binder covers
  opportunityTitle: string        // Human-readable opportunity name
  assembledAt: string             // ISO timestamp of assembly
  assembledBy: string             // Email of the user who assembled it
  totalSections: number           // Total section count
  totalWordCount: number          // Sum of all section word counts
  syncHealth: number              // 0-100 percentage of sections in synced/idle state
  artifacts: BinderManifestEntry[]  // Per-section metadata
}

interface BinderManifestEntry {
  volumeName: string              // Volume grouping
  sectionTitle: string            // Section title
  sectionId: string               // UUID
  status: string | null           // Section authoring status
  wordCount: number               // Word count for this section
  syncStatus: SyncStatus          // idle | syncing | synced | conflict | error
  cloudProvider: CloudProvider | null  // onedrive | google_drive | sharepoint | null
  cloudWebUrl: string | null      // URL to open in cloud editor
  lastEditedBy: string | null     // Who last edited
  lastEditedAt: string | null     // When last edited
  editSource: DocumentSource | null  // Which system made the last edit
}
```

### 5.4 Sync Health Score

The `syncHealth` field in the manifest is a percentage (0-100) representing how many artifacts are in a healthy sync state (`synced` or `idle`) versus total artifacts. A score of 100 means all sections are fully synchronized; a lower score indicates some sections have conflicts or errors that should be resolved before submission.

### 5.5 Storage and Download

1. The ZIP is generated using the `jszip` library with DEFLATE compression (level 6).
2. The archive is uploaded to Supabase Storage at `documents/binders/<opportunityId>/<title>_CloudBinder_<date>.zip`.
3. A signed download URL is generated with a 1-hour expiry.
4. Both `audit_logs` and `activity_log` entries are created.
5. The collaboration page is revalidated via `revalidatePath()`.

---

## 6. Collaboration Page

### 6.1 Artifact Status Grid

The collaboration page displays a grid of all proposal artifacts (sections) with real-time sync status. The `getArtifactStatuses()` function joins `proposal_sections` with `document_sync_state` to produce a combined view:

| Field | Source | Description |
|-------|--------|-------------|
| `volumeName` | `proposal_sections.volume` | Volume grouping |
| `documentId` | `proposal_sections.id` | Section UUID |
| `syncStatus` | `document_sync_state.sync_status` | Current sync state |
| `cloudProvider` | `document_sync_state.cloud_provider` | Connected cloud provider |
| `lastEditedBy` | `document_sync_state.metadata.last_edited_by` | Who last edited |
| `lastEditedAt` | `document_sync_state.last_cloud_edit_at` or `last_mp_edit_at` | When last edited |
| `editSource` | `document_sync_state.metadata.edit_source` | Which system made the edit |
| `wordCount` | Computed from `proposal_sections.content` | Current word count |

### 6.2 Activity Feed

The collaboration page integrates with the existing `ActivityLog` shared component (`components/features/shared/ActivityLog.tsx`) to display:

- Sync events (initialized, completed, failed)
- Conflict detections and resolutions
- Coordination rule executions
- Binder assembly events
- Section assignment changes

### 6.3 Connected Tools

The collaboration page shows which cloud tools are currently connected to each proposal section, with direct links to open documents in their cloud editors:

- **Word Online** -- Opens via `webUrl` from Graph API metadata
- **Excel Online** -- Opens via `webUrl` from Graph API metadata
- **PowerPoint Online** -- Opens via `webUrl` from Graph API metadata
- **Google Docs** -- Opens via deterministic URL `https://docs.google.com/document/d/<fileId>/edit`
- **Google Sheets** -- Opens via deterministic URL `https://docs.google.com/spreadsheets/d/<fileId>/edit`
