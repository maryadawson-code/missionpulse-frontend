// filepath: lib/types/sync.ts
// v1.3 Phase J — TypeScript interfaces for sync tables
// These match the migration in supabase/migrations/20260222_v1_3_phase_j.sql

// ─── Cloud Provider ────────────────────────────────────────────
export type CloudProvider = 'onedrive' | 'google_drive' | 'sharepoint'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'conflict' | 'error'

export type DocumentSource =
  | 'missionpulse'
  | 'word_online'
  | 'excel_online'
  | 'pptx_online'
  | 'google_docs'
  | 'google_sheets'

export type ConflictResolution = 'keep_mp' | 'keep_cloud' | 'merge' | 'pending'

export type CoordinationTransform = 'copy' | 'format' | 'aggregate' | 'reference'

export type MilestoneType =
  | 'gate_review'
  | 'color_team'
  | 'submission'
  | 'debrief'
  | 'kickoff'
  | 'draft_due'
  | 'final_due'
  | 'custom'

export type MilestoneStatus = 'upcoming' | 'in_progress' | 'completed' | 'missed' | 'cancelled'

export type AssignmentStatus = 'assigned' | 'in_progress' | 'review' | 'complete'

// ─── document_sync_state ───────────────────────────────────────
export interface DocumentSyncState {
  id: string
  document_id: string
  company_id: string
  cloud_provider: CloudProvider
  cloud_file_id: string
  sync_status: SyncStatus
  last_sync_at: string | null
  last_cloud_edit_at: string | null
  last_mp_edit_at: string | null
  cloud_web_url: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

// ─── sync_conflicts ────────────────────────────────────────────
export interface SyncConflict {
  id: string
  document_id: string
  section_id: string | null
  company_id: string
  mp_version: {
    content: string
    updated_at: string
    updated_by?: string
  }
  cloud_version: {
    content: string
    updated_at: string
    source?: string
  }
  resolution: ConflictResolution | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
}

// ─── coordination_rules ────────────────────────────────────────
export interface CoordinationRule {
  id: string
  company_id: string
  source_doc_type: string
  source_field_path: string
  target_doc_type: string
  target_field_path: string
  transform_type: CoordinationTransform
  is_active: boolean
  description: string | null
  created_at: string
  updated_at: string
}

// ─── coordination_log ──────────────────────────────────────────
export interface CoordinationLogEntry {
  id: string
  rule_id: string
  trigger_document_id: string
  company_id: string
  affected_documents: string[]
  changes_applied: {
    document_id: string
    field_path: string
    old_value: unknown
    new_value: unknown
  }[]
  status: 'pending' | 'applied' | 'failed' | 'skipped'
  error_message: string | null
  executed_at: string
}

// ─── document_versions ─────────────────────────────────────────
export interface DocumentVersion {
  id: string
  document_id: string
  company_id: string
  version_number: number
  source: DocumentSource
  snapshot: Record<string, unknown>
  diff_summary: {
    additions: number
    deletions: number
    modifications: number
    sections_changed?: string[]
  } | null
  created_by: string | null
  created_at: string
}

// ─── proposal_milestones ───────────────────────────────────────
export interface ProposalMilestone {
  id: string
  opportunity_id: string
  company_id: string
  milestone_type: MilestoneType
  title: string
  scheduled_date: string
  actual_date: string | null
  status: MilestoneStatus
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

// ─── section_assignments ───────────────────────────────────────
export interface SectionAssignment {
  id: string
  section_id: string
  assignee_id: string
  company_id: string
  volume: string | null
  status: AssignmentStatus
  word_count: number
  deadline: string | null
  assigned_by: string | null
  assigned_at: string
  updated_at: string
}

// ─── Diff Engine Types ─────────────────────────────────────────
export interface DiffResult {
  additions: DiffBlock[]
  deletions: DiffBlock[]
  modifications: DiffBlock[]
  unchanged: number
}

export interface DiffBlock {
  path: string
  content: string
  lineStart?: number
  lineEnd?: number
}

// ─── Sync Queue Types ──────────────────────────────────────────
export interface SyncQueueItem {
  id: string
  documentId: string
  provider: CloudProvider
  action: 'push' | 'pull' | 'resolve'
  priority: number
  enqueuedAt: string
  attempts: number
}

// ─── Cascade Types ─────────────────────────────────────────────
export interface CascadePreviewItem {
  ruleId: string
  ruleDescription: string | null
  targetDocType: string
  targetFieldPath: string
  currentValue: unknown
  newValue: unknown
  documentId: string
  documentTitle: string
}

// ─── Artifact Status Types ─────────────────────────────────────
export interface ArtifactStatus {
  volumeName: string
  documentId: string
  syncStatus: SyncStatus
  cloudProvider: CloudProvider | null
  lastEditedBy: string | null
  lastEditedAt: string | null
  editSource: DocumentSource | null
  wordCount: number
}
