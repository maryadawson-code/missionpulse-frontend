// filepath: tests/mocks/sync-data.ts
/**
 * Mock Data for Sync Tests
 * v1.3 Sprint 31
 *
 * Provides realistic mock instances of all sync-related types
 * for use in unit and integration tests.
 *
 * Types from: lib/types/sync.ts
 */

import type {
  DocumentSyncState,
  SyncConflict,
  CoordinationRule,
  DocumentVersion,
  ProposalMilestone,
  SectionAssignment,
  SyncQueueItem,
  CascadePreviewItem,
  CoordinationLogEntry,
  ArtifactStatus,
} from '@/lib/types/sync'

// ─── DocumentSyncState ────────────────────────────────────────

export const mockDocumentSyncState: DocumentSyncState = {
  id: 'dss-001',
  document_id: 'doc-tech-vol-001',
  company_id: 'comp-mission-tech-001',
  cloud_provider: 'google_drive',
  cloud_file_id: 'gd-file-abc123',
  sync_status: 'synced',
  last_sync_at: '2026-02-22T14:30:00Z',
  last_cloud_edit_at: '2026-02-22T14:25:00Z',
  last_mp_edit_at: '2026-02-22T14:20:00Z',
  cloud_web_url: 'https://docs.google.com/document/d/abc123/edit',
  metadata: {
    mimeType: 'application/vnd.google-apps.document',
    revisionId: 'rev-789',
  },
  created_at: '2026-02-01T09:00:00Z',
  updated_at: '2026-02-22T14:30:00Z',
}

export const mockDocumentSyncStateConflict: DocumentSyncState = {
  id: 'dss-002',
  document_id: 'doc-mgmt-vol-001',
  company_id: 'comp-mission-tech-001',
  cloud_provider: 'onedrive',
  cloud_file_id: 'od-file-def456',
  sync_status: 'conflict',
  last_sync_at: '2026-02-22T10:00:00Z',
  last_cloud_edit_at: '2026-02-22T12:00:00Z',
  last_mp_edit_at: '2026-02-22T11:30:00Z',
  cloud_web_url: 'https://onedrive.live.com/edit.aspx?resid=def456',
  metadata: {
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  created_at: '2026-02-05T09:00:00Z',
  updated_at: '2026-02-22T12:00:00Z',
}

// ─── SyncConflict ─────────────────────────────────────────────

export const mockSyncConflict: SyncConflict = {
  id: 'conflict-001',
  document_id: 'doc-mgmt-vol-001',
  section_id: 'sec-approach-001',
  company_id: 'comp-mission-tech-001',
  mp_version: {
    content:
      'Our approach leverages a proven Agile DevSecOps framework with CI/CD pipelines for rapid, secure delivery.',
    updated_at: '2026-02-22T11:30:00Z',
    updated_by: 'user-mary-001',
  },
  cloud_version: {
    content:
      'The proposed approach utilizes iterative Agile methodology with continuous integration for efficient delivery.',
    updated_at: '2026-02-22T12:00:00Z',
    source: 'google_docs',
  },
  resolution: 'pending',
  resolved_by: null,
  resolved_at: null,
  created_at: '2026-02-22T12:01:00Z',
}

export const mockSyncConflictResolved: SyncConflict = {
  id: 'conflict-002',
  document_id: 'doc-tech-vol-001',
  section_id: null,
  company_id: 'comp-mission-tech-001',
  mp_version: {
    content: 'Version 3 of the executive summary.',
    updated_at: '2026-02-20T16:00:00Z',
    updated_by: 'user-john-002',
  },
  cloud_version: {
    content: 'Version 3 of the executive summary with cloud edits.',
    updated_at: '2026-02-20T16:30:00Z',
    source: 'word_online',
  },
  resolution: 'keep_mp',
  resolved_by: 'user-mary-001',
  resolved_at: '2026-02-20T17:00:00Z',
  created_at: '2026-02-20T16:35:00Z',
}

// ─── CoordinationRule ─────────────────────────────────────────

export const mockCoordinationRule: CoordinationRule = {
  id: 'coord-rule-001',
  company_id: 'comp-mission-tech-001',
  source_doc_type: 'cover_letter',
  source_field_path: 'contract_value',
  target_doc_type: 'technical_volume',
  target_field_path: 'header.contract_value',
  transform_type: 'format',
  is_active: true,
  description: 'Propagate formatted contract value from cover letter to all technical volume headers',
  created_at: '2026-02-15T09:00:00Z',
  updated_at: '2026-02-22T10:00:00Z',
}

export const mockCoordinationRuleCopy: CoordinationRule = {
  id: 'coord-rule-002',
  company_id: 'comp-mission-tech-001',
  source_doc_type: 'executive_summary',
  source_field_path: 'program_name',
  target_doc_type: 'past_performance',
  target_field_path: 'header.program_name',
  transform_type: 'copy',
  is_active: true,
  description: 'Copy program name from executive summary to past performance header',
  created_at: '2026-02-16T09:00:00Z',
  updated_at: '2026-02-16T09:00:00Z',
}

export const mockCoordinationRuleAggregate: CoordinationRule = {
  id: 'coord-rule-003',
  company_id: 'comp-mission-tech-001',
  source_doc_type: 'pricing_volume',
  source_field_path: 'line_items.amounts',
  target_doc_type: 'cover_letter',
  target_field_path: 'total_price',
  transform_type: 'aggregate',
  is_active: true,
  description: 'Sum pricing line items and propagate total to cover letter',
  created_at: '2026-02-17T09:00:00Z',
  updated_at: '2026-02-17T09:00:00Z',
}

// ─── DocumentVersion ──────────────────────────────────────────

export const mockDocumentVersion: DocumentVersion = {
  id: 'ver-001',
  document_id: 'doc-tech-vol-001',
  company_id: 'comp-mission-tech-001',
  version_number: 3,
  source: 'missionpulse',
  snapshot: {
    title: 'Technical Volume — DHS Cyber Modernization',
    doc_type: 'technical_volume',
    header: {
      contract_value: '$5,000,000',
      program_name: 'USCIS Modernization',
    },
    sections: {
      approach: 'Our approach leverages proven Agile DevSecOps...',
      staffing: 'Key personnel include 3 senior engineers...',
      past_performance: 'We have successfully delivered 5 similar programs...',
    },
  },
  diff_summary: {
    additions: 2,
    deletions: 0,
    modifications: 1,
    sections_changed: ['sections.approach', 'sections.staffing'],
  },
  created_by: 'user-mary-001',
  created_at: '2026-02-22T14:20:00Z',
}

export const mockDocumentVersionInitial: DocumentVersion = {
  id: 'ver-000',
  document_id: 'doc-tech-vol-001',
  company_id: 'comp-mission-tech-001',
  version_number: 1,
  source: 'missionpulse',
  snapshot: {
    title: 'Technical Volume — DHS Cyber Modernization',
    doc_type: 'technical_volume',
    header: {
      contract_value: '$4,500,000',
      program_name: 'USCIS Modernization',
    },
    sections: {
      approach: 'Initial approach draft.',
    },
  },
  diff_summary: null,
  created_by: 'user-mary-001',
  created_at: '2026-02-01T09:00:00Z',
}

// ─── ProposalMilestone ────────────────────────────────────────

export const mockProposalMilestone: ProposalMilestone = {
  id: 'ms-001',
  opportunity_id: 'opp-dhs-cyber-001',
  company_id: 'comp-mission-tech-001',
  milestone_type: 'color_team',
  title: 'Pink Team Review',
  scheduled_date: '2026-03-15',
  actual_date: null,
  status: 'upcoming',
  notes: 'Full draft required for pink team review. All volumes must be complete.',
  created_by: 'user-mary-001',
  created_at: '2026-02-10T09:00:00Z',
  updated_at: '2026-02-22T10:00:00Z',
}

export const mockProposalMilestoneCompleted: ProposalMilestone = {
  id: 'ms-002',
  opportunity_id: 'opp-dhs-cyber-001',
  company_id: 'comp-mission-tech-001',
  milestone_type: 'kickoff',
  title: 'Proposal Kickoff',
  scheduled_date: '2026-02-01',
  actual_date: '2026-02-01',
  status: 'completed',
  notes: 'Kickoff meeting held with full capture team.',
  created_by: 'user-mary-001',
  created_at: '2026-01-25T09:00:00Z',
  updated_at: '2026-02-01T17:00:00Z',
}

export const mockProposalMilestoneSubmission: ProposalMilestone = {
  id: 'ms-003',
  opportunity_id: 'opp-dhs-cyber-001',
  company_id: 'comp-mission-tech-001',
  milestone_type: 'submission',
  title: 'Final Submission',
  scheduled_date: '2026-06-01',
  actual_date: null,
  status: 'upcoming',
  notes: 'Government submission deadline. No extensions.',
  created_by: 'user-mary-001',
  created_at: '2026-02-10T09:00:00Z',
  updated_at: '2026-02-10T09:00:00Z',
}

// ─── SectionAssignment ────────────────────────────────────────

export const mockSectionAssignment: SectionAssignment = {
  id: 'asgn-001',
  section_id: 'sec-approach-001',
  assignee_id: 'user-john-002',
  company_id: 'comp-mission-tech-001',
  volume: 'Technical Volume',
  status: 'in_progress',
  word_count: 3500,
  deadline: '2026-03-10',
  assigned_by: 'user-mary-001',
  assigned_at: '2026-02-15T09:00:00Z',
  updated_at: '2026-02-22T14:00:00Z',
}

export const mockSectionAssignmentComplete: SectionAssignment = {
  id: 'asgn-002',
  section_id: 'sec-exec-summary-001',
  assignee_id: 'user-mary-001',
  company_id: 'comp-mission-tech-001',
  volume: 'Management Volume',
  status: 'complete',
  word_count: 1200,
  deadline: '2026-03-01',
  assigned_by: 'user-mary-001',
  assigned_at: '2026-02-10T09:00:00Z',
  updated_at: '2026-02-28T16:00:00Z',
}

// ─── SyncQueueItem ────────────────────────────────────────────

export const mockSyncQueueItem: SyncQueueItem = {
  id: 'sq-001',
  documentId: 'doc-tech-vol-001',
  provider: 'google_drive',
  action: 'push',
  priority: 3,
  enqueuedAt: '2026-02-22T14:30:00Z',
  attempts: 0,
}

export const mockSyncQueueItemPull: SyncQueueItem = {
  id: 'sq-002',
  documentId: 'doc-mgmt-vol-001',
  provider: 'onedrive',
  action: 'pull',
  priority: 5,
  enqueuedAt: '2026-02-22T14:31:00Z',
  attempts: 1,
}

// ─── CascadePreviewItem ──────────────────────────────────────

export const mockCascadePreviewItem: CascadePreviewItem = {
  ruleId: 'coord-rule-001',
  ruleDescription: 'Propagate formatted contract value from cover letter to all technical volume headers',
  targetDocType: 'technical_volume',
  targetFieldPath: 'header.contract_value',
  currentValue: '$4,500,000',
  newValue: '$5,000,000',
  documentId: 'doc-tech-vol-001',
  documentTitle: 'Technical Volume — DHS Cyber Modernization',
}

// ─── CoordinationLogEntry ─────────────────────────────────────

export const mockCoordinationLogEntry: CoordinationLogEntry = {
  id: 'clog-001',
  rule_id: 'coord-rule-001',
  trigger_document_id: 'doc-cover-letter-001',
  company_id: 'comp-mission-tech-001',
  affected_documents: ['doc-tech-vol-001', 'doc-mgmt-vol-001'],
  changes_applied: [
    {
      document_id: 'doc-tech-vol-001',
      field_path: 'header.contract_value',
      old_value: '$4,500,000',
      new_value: '$5,000,000',
    },
    {
      document_id: 'doc-mgmt-vol-001',
      field_path: 'header.contract_value',
      old_value: '$4,500,000',
      new_value: '$5,000,000',
    },
  ],
  status: 'applied',
  error_message: null,
  executed_at: '2026-02-22T14:35:00Z',
}

// ─── ArtifactStatus ───────────────────────────────────────────

export const mockArtifactStatus: ArtifactStatus = {
  volumeName: 'Technical Volume',
  documentId: 'doc-tech-vol-001',
  syncStatus: 'synced',
  cloudProvider: 'google_drive',
  lastEditedBy: 'user-mary-001',
  lastEditedAt: '2026-02-22T14:20:00Z',
  editSource: 'missionpulse',
  wordCount: 12500,
}

export const mockArtifactStatusIdle: ArtifactStatus = {
  volumeName: 'Past Performance Volume',
  documentId: 'doc-pp-vol-001',
  syncStatus: 'idle',
  cloudProvider: null,
  lastEditedBy: null,
  lastEditedAt: null,
  editSource: null,
  wordCount: 0,
}
