/**
 * SyncManager — Bidirectional Content Sync Engine
 * Sprint 29 (T-29.1) — Phase J v1.3
 *
 * Manages bidirectional sync between MissionPulse sections and
 * cloud documents (OneDrive / Google Drive). Uses SHA-256 hash
 * comparison for change detection with delta-only transmission.
 *
 * © 2026 Mission Meets Tech
 */

import { createClient } from '@/lib/supabase/server'
import { contentHash, hashesMatch } from './hash'
import type {
  CloudProvider,
  SyncState,
  SyncDelta,
  SyncConflict,
  SyncResult,
  SectionSnapshot,
  ConflictResolution,
  ChangeType,
} from './types'

// ─── Retry config ───────────────────────────────────────────────
const MAX_RETRIES = 3
const BACKOFF_BASE_MS = 1000

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < MAX_RETRIES - 1) {
        await new Promise(r => setTimeout(r, BACKOFF_BASE_MS * Math.pow(2, attempt)))
      }
    }
  }
  throw lastError
}

// ─── SyncManager ────────────────────────────────────────────────

export class SyncManager {
  private documentId: string | null = null
  private provider: CloudProvider | null = null
  private companyId: string | null = null
  private cloudFileId: string | null = null
  private paused = false

  /**
   * Connect to a cloud document for sync.
   */
  async initialize(
    documentId: string,
    provider: CloudProvider,
    companyId: string,
    cloudFileId: string
  ): Promise<SyncState> {
    this.documentId = documentId
    this.provider = provider
    this.companyId = companyId
    this.cloudFileId = cloudFileId
    this.paused = false

    const supabase = await createClient()
    const { data: existing } = await supabase
      .from('document_sync_state')
      .select('*')
      .eq('document_id', documentId)
      .eq('cloud_provider', provider)
      .single()

    if (existing) {
      return mapToSyncState(existing)
    }

    const { data: created, error } = await supabase
      .from('document_sync_state')
      .insert({
        document_id: documentId,
        company_id: companyId,
        cloud_provider: provider,
        cloud_file_id: cloudFileId,
        sync_status: 'idle',
      })
      .select()
      .single()

    if (error || !created) {
      throw new Error(`Failed to initialize sync: ${error?.message}`)
    }

    return mapToSyncState(created)
  }

  /**
   * Begin watching a section for changes and compute deltas.
   */
  async startSync(
    sectionId: string,
    localContent: string,
    remoteContent: string
  ): Promise<SyncResult> {
    if (this.paused || !this.documentId || !this.provider || !this.companyId) {
      return { success: false, deltas: [], conflicts: [], syncedAt: new Date().toISOString() }
    }

    const supabase = await createClient()

    // Update status to syncing
    await supabase
      .from('document_sync_state')
      .update({ sync_status: 'syncing', updated_at: new Date().toISOString() })
      .eq('document_id', this.documentId)
      .eq('cloud_provider', this.provider)

    const localHash = await contentHash(localContent)
    const remoteHash = await contentHash(remoteContent)
    const deltas: SyncDelta[] = []
    const conflicts: SyncConflict[] = []

    if (hashesMatch(localHash, remoteHash)) {
      // No changes
      deltas.push({
        sectionId,
        changeType: 'unchanged',
        localHash,
        remoteHash,
        localContent: null,
        remoteContent: null,
      })
    } else {
      // Detect change type
      const changeType: ChangeType = !localContent
        ? 'addition'
        : !remoteContent
          ? 'deletion'
          : 'modification'

      if (changeType === 'modification') {
        // Check for conflict: both sides changed since last sync
        const { data: lastState } = await supabase
          .from('document_sync_state')
          .select('last_sync_at, last_cloud_edit_at, last_mp_edit_at')
          .eq('document_id', this.documentId)
          .eq('cloud_provider', this.provider)
          .single()

        const lastSync = lastState?.last_sync_at ? new Date(lastState.last_sync_at) : null
        const cloudEdit = lastState?.last_cloud_edit_at ? new Date(lastState.last_cloud_edit_at) : null
        const mpEdit = lastState?.last_mp_edit_at ? new Date(lastState.last_mp_edit_at) : null

        const bothChanged = lastSync && cloudEdit && mpEdit &&
          cloudEdit > lastSync && mpEdit > lastSync

        if (bothChanged) {
          // Conflict detected
          const now = new Date().toISOString()
          const mpSnapshot: SectionSnapshot = {
            content: localContent,
            hash: localHash,
            updatedAt: now,
            source: 'local',
          }
          const cloudSnapshot: SectionSnapshot = {
            content: remoteContent,
            hash: remoteHash,
            updatedAt: now,
            source: 'cloud',
          }

          const { data: conflict } = await supabase
            .from('sync_conflicts')
            .insert({
              document_id: this.documentId,
              section_id: sectionId,
              company_id: this.companyId,
              mp_version: JSON.parse(JSON.stringify(mpSnapshot)),
              cloud_version: JSON.parse(JSON.stringify(cloudSnapshot)),
            })
            .select()
            .single()

          if (conflict) {
            conflicts.push({
              id: conflict.id,
              documentId: conflict.document_id,
              sectionId: conflict.section_id,
              mpVersion: mpSnapshot,
              cloudVersion: cloudSnapshot,
              resolution: null,
              resolvedBy: null,
              resolvedAt: null,
              createdAt: conflict.created_at,
            })
          }

          await supabase
            .from('document_sync_state')
            .update({ sync_status: 'conflict', updated_at: new Date().toISOString() })
            .eq('document_id', this.documentId)
            .eq('cloud_provider', this.provider)

          return { success: false, deltas, conflicts, syncedAt: new Date().toISOString() }
        }
      }

      // No conflict — delta sync
      deltas.push({
        sectionId,
        changeType,
        localHash,
        remoteHash,
        localContent: changeType === 'modification' ? localContent : null,
        remoteContent: changeType === 'modification' ? remoteContent : null,
      })
    }

    // Update sync state
    const now = new Date().toISOString()
    await supabase
      .from('document_sync_state')
      .update({
        sync_status: 'synced',
        last_sync_at: now,
        updated_at: now,
      })
      .eq('document_id', this.documentId)
      .eq('cloud_provider', this.provider)

    return { success: true, deltas, conflicts, syncedAt: now }
  }

  /**
   * Halt sync without disconnecting.
   */
  pauseSync(): void {
    this.paused = true
  }

  /**
   * Resume sync after pause.
   */
  resumeSync(): void {
    this.paused = false
  }

  /**
   * Resolve a conflict with specified strategy.
   */
  async resolveConflict(
    conflictId: string,
    resolution: ConflictResolution,
    userId: string
  ): Promise<boolean> {
    return withRetry(async () => {
      const supabase = await createClient()
      const now = new Date().toISOString()

      const { error } = await supabase
        .from('sync_conflicts')
        .update({
          resolution,
          resolved_by: userId,
          resolved_at: now,
        })
        .eq('id', conflictId)

      if (error) throw new Error(`Failed to resolve conflict: ${error.message}`)

      // If document still has conflicts, keep status; otherwise set to synced
      if (this.documentId && this.provider) {
        const { data: remaining } = await supabase
          .from('sync_conflicts')
          .select('id')
          .eq('document_id', this.documentId)
          .is('resolution', null)

        const newStatus = (remaining && remaining.length > 0) ? 'conflict' : 'synced'
        await supabase
          .from('document_sync_state')
          .update({ sync_status: newStatus, updated_at: now })
          .eq('document_id', this.documentId)
          .eq('cloud_provider', this.provider)
      }

      return true
    })
  }

  /**
   * Get current sync state for a document.
   */
  async getSyncState(documentId: string, provider: CloudProvider): Promise<SyncState | null> {
    const supabase = await createClient()
    const { data } = await supabase
      .from('document_sync_state')
      .select('*')
      .eq('document_id', documentId)
      .eq('cloud_provider', provider)
      .single()

    return data ? mapToSyncState(data) : null
  }

  /**
   * Get all unresolved conflicts for a document.
   */
  async getConflicts(documentId: string): Promise<SyncConflict[]> {
    const supabase = await createClient()
    const { data } = await supabase
      .from('sync_conflicts')
      .select('*')
      .eq('document_id', documentId)
      .is('resolution', null)
      .order('created_at', { ascending: false })

    return (data ?? []).map(c => ({
      id: c.id,
      documentId: c.document_id,
      sectionId: c.section_id,
      mpVersion: c.mp_version as unknown as SectionSnapshot,
      cloudVersion: c.cloud_version as unknown as SectionSnapshot,
      resolution: c.resolution as ConflictResolution | null,
      resolvedBy: c.resolved_by,
      resolvedAt: c.resolved_at,
      createdAt: c.created_at,
    }))
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function mapToSyncState(row: Record<string, unknown>): SyncState {
  return {
    documentId: row.document_id as string,
    provider: row.cloud_provider as CloudProvider,
    cloudFileId: row.cloud_file_id as string,
    syncStatus: row.sync_status as SyncState['syncStatus'],
    lastSyncAt: (row.last_sync_at as string) ?? null,
    lastCloudEditAt: (row.last_cloud_edit_at as string) ?? null,
    lastMpEditAt: (row.last_mp_edit_at as string) ?? null,
    cloudWebUrl: (row.cloud_web_url as string) ?? null,
  }
}
