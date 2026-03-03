/**
 * Bidirectional Content Sync Engine — Type Definitions
 * Sprint 29 (T-29.1) — Phase J v1.3
 * © 2026 Mission Meets Tech
 */

export type CloudProvider = 'onedrive' | 'google'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'conflict' | 'error'

export type ChangeType = 'addition' | 'deletion' | 'modification' | 'unchanged'

export type ConflictResolution = 'local' | 'remote' | 'merge'

export interface SyncState {
  documentId: string
  provider: CloudProvider
  cloudFileId: string
  syncStatus: SyncStatus
  lastSyncAt: string | null
  lastCloudEditAt: string | null
  lastMpEditAt: string | null
  cloudWebUrl: string | null
}

export interface SyncConflict {
  id: string
  documentId: string
  sectionId: string | null
  mpVersion: SectionSnapshot
  cloudVersion: SectionSnapshot
  resolution: ConflictResolution | null
  resolvedBy: string | null
  resolvedAt: string | null
  createdAt: string
}

export interface SectionSnapshot {
  content: string
  hash: string
  updatedAt: string
  source: 'local' | 'cloud'
}

export interface SyncDelta {
  sectionId: string
  changeType: ChangeType
  localHash: string
  remoteHash: string
  localContent: string | null
  remoteContent: string | null
}

export interface SyncResult {
  success: boolean
  deltas: SyncDelta[]
  conflicts: SyncConflict[]
  syncedAt: string
}

export interface CloudDocumentSection {
  sectionId: string
  title: string
  content: string
  hash: string
}

export interface SlideContent {
  title: string
  body: string
  speakerNotes: string
}

export interface CellRange {
  range: string
  values: unknown[][]
}
