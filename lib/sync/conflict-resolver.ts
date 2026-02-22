// filepath: lib/sync/conflict-resolver.ts
/**
 * Conflict Detection and Resolution
 *
 * Three-way merge conflict detection using base, MissionPulse, and cloud
 * versions. Supports keep-MP, keep-cloud, and line-level merge strategies.
 *
 * Writes conflict records to sync_conflicts table for audit trail.
 *
 * v1.3 Sprint 29 — Sync Engine
 */
'use server'

import { createSyncClient } from '@/lib/supabase/sync-client'
import type { ActionResult } from '@/lib/types'
import type { ConflictResolution, SyncConflict } from '@/lib/types/sync'

// ─── Conflict Detection ───────────────────────────────────────

/**
 * Detect whether MP and cloud content have diverged from a common base.
 * Returns conflict data suitable for insertion into sync_conflicts.
 *
 * If baseContent is null, a direct comparison is used instead of three-way.
 */
export async function detectConflict(
  mpContent: string,
  cloudContent: string,
  baseContent: string | null
): Promise<{
  hasConflict: boolean
  mpChanged: boolean
  cloudChanged: boolean
  conflictRegions: { lineStart: number; lineEnd: number }[]
}> {
  // If both sides are identical, no conflict
  if (mpContent === cloudContent) {
    return { hasConflict: false, mpChanged: false, cloudChanged: false, conflictRegions: [] }
  }

  const mpChanged = baseContent !== null ? mpContent !== baseContent : true
  const cloudChanged = baseContent !== null ? cloudContent !== baseContent : true

  // Only one side changed — no conflict, just a sync needed
  if (!mpChanged || !cloudChanged) {
    return { hasConflict: false, mpChanged, cloudChanged, conflictRegions: [] }
  }

  // Both sides changed — find conflicting regions
  const mpLines = mpContent.split('\n')
  const cloudLines = cloudContent.split('\n')
  const baseLines = baseContent ? baseContent.split('\n') : []

  const conflictRegions: { lineStart: number; lineEnd: number }[] = []
  const maxLen = Math.max(mpLines.length, cloudLines.length, baseLines.length)

  let regionStart: number | null = null

  for (let i = 0; i < maxLen; i++) {
    const baseLine = baseLines[i] ?? ''
    const mpLine = mpLines[i] ?? ''
    const cloudLine = cloudLines[i] ?? ''

    const mpDiffers = mpLine !== baseLine
    const cloudDiffers = cloudLine !== baseLine
    const bothDiffer = mpDiffers && cloudDiffers && mpLine !== cloudLine

    if (bothDiffer) {
      if (regionStart === null) regionStart = i
    } else {
      if (regionStart !== null) {
        conflictRegions.push({ lineStart: regionStart, lineEnd: i - 1 })
        regionStart = null
      }
    }
  }

  if (regionStart !== null) {
    conflictRegions.push({ lineStart: regionStart, lineEnd: maxLen - 1 })
  }

  return {
    hasConflict: conflictRegions.length > 0,
    mpChanged,
    cloudChanged,
    conflictRegions,
  }
}

// ─── Conflict Resolution ──────────────────────────────────────

/**
 * Resolve an existing conflict by updating the sync_conflicts record.
 * Also updates the document_sync_state to clear the conflict status.
 */
export async function resolveConflict(
  conflictId: string,
  resolution: ConflictResolution,
  userId: string
): Promise<ActionResult> {
  if (resolution === 'pending') {
    return { success: false, error: 'Cannot resolve with pending status' }
  }

  const supabase = await createSyncClient()

  // Fetch the conflict record
  const { data: conflict, error: fetchError } = await supabase
    .from('sync_conflicts')
    .select('id, document_id, mp_version, cloud_version')
    .eq('id', conflictId)
    .single()

  if (fetchError || !conflict) {
    return { success: false, error: fetchError?.message ?? 'Conflict not found' }
  }

  const now = new Date().toISOString()

  // Update conflict record with resolution
  const { error: updateError } = await supabase
    .from('sync_conflicts')
    .update({
      resolution,
      resolved_by: userId,
      resolved_at: now,
    })
    .eq('id', conflictId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  // Clear conflict status on the document sync state
  const { error: stateError } = await supabase
    .from('document_sync_state')
    .update({
      sync_status: 'synced',
      last_sync_at: now,
      updated_at: now,
    })
    .eq('document_id', conflict.document_id)

  if (stateError) {
    return { success: false, error: stateError.message }
  }

  // Write to audit_logs for compliance (AU-9)
  await supabase.from('audit_logs').insert({
    action: 'sync_conflict_resolved',
    entity_type: 'sync_conflict',
    entity_id: conflictId,
    user_id: userId,
    metadata: { resolution, document_id: conflict.document_id },
  })

  return { success: true }
}

// ─── Merge ────────────────────────────────────────────────────

/**
 * Produce merged content from MP and cloud versions using a simple
 * line-level merge. Non-conflicting changes from both sides are kept.
 * Conflicting lines use the MP version with cloud appended as a comment.
 *
 * For production use, this should be replaced with a full three-way
 * merge algorithm. This implementation handles the common case where
 * edits occur in different regions of the document.
 */
export async function getMergedContent(
  mpContent: string,
  cloudContent: string
): Promise<string> {
  const mpLines = mpContent.split('\n')
  const cloudLines = cloudContent.split('\n')
  const merged: string[] = []

  const maxLen = Math.max(mpLines.length, cloudLines.length)

  for (let i = 0; i < maxLen; i++) {
    const mpLine = mpLines[i]
    const cloudLine = cloudLines[i]

    if (mpLine === undefined && cloudLine !== undefined) {
      // Cloud has extra lines — keep them
      merged.push(cloudLine)
    } else if (mpLine !== undefined && cloudLine === undefined) {
      // MP has extra lines — keep them
      merged.push(mpLine)
    } else if (mpLine === cloudLine) {
      // Identical — keep once
      merged.push(mpLine as string)
    } else {
      // Conflict — include both with markers
      merged.push(`<<<<<<< MissionPulse`)
      merged.push(mpLine as string)
      merged.push(`=======`)
      merged.push(cloudLine as string)
      merged.push(`>>>>>>> Cloud`)
    }
  }

  return merged.join('\n')
}

// ─── Conflict Record Creation ─────────────────────────────────

/**
 * Insert a new sync_conflicts record for a detected conflict.
 * Called by the sync manager when detectConflict returns hasConflict=true.
 */
export async function createConflictRecord(
  documentId: string,
  sectionId: string | null,
  companyId: string,
  mpVersion: SyncConflict['mp_version'],
  cloudVersion: SyncConflict['cloud_version']
): Promise<ActionResult<{ conflictId: string }>> {
  const supabase = await createSyncClient()

  const { data, error } = await supabase
    .from('sync_conflicts')
    .insert({
      document_id: documentId,
      section_id: sectionId,
      company_id: companyId,
      mp_version: mpVersion,
      cloud_version: cloudVersion,
      resolution: 'pending',
    })
    .select('id')
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // Mark the document as conflicted
  await supabase
    .from('document_sync_state')
    .update({
      sync_status: 'conflict',
      updated_at: new Date().toISOString(),
    })
    .eq('document_id', documentId)

  return { success: true, data: { conflictId: data.id } }
}
