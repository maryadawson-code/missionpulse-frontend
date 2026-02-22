// filepath: lib/sync/version-tracker.ts
/**
 * Document Version Tracker
 *
 * Records immutable snapshots of document state each time content
 * changes — whether from MissionPulse edits, cloud provider sync,
 * or coordination engine cascades. Each version includes a diff
 * summary against the previous version for quick change auditing.
 *
 * v1.3 Sprint 30 — Cross-Document Intelligence
 */
'use server'

import { createSyncClient } from '@/lib/supabase/sync-client'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types'
import type { DocumentVersion, DiffResult } from '@/lib/types/sync'
import { computeDiff, summarizeDiff } from './diff-engine'

// ─── Record Version ──────────────────────────────────────────

/**
 * Create a new version record for a document. Auto-computes the
 * version_number as (max existing + 1) and computes a diff summary
 * against the previous version using the diff engine.
 *
 * @param documentId - The document being versioned
 * @param companyId - The company scope for RLS
 * @param source - Where the change originated (e.g., 'missionpulse', 'google_docs')
 * @param content - The full document snapshot at this point in time
 */
export async function recordVersion(
  documentId: string,
  companyId: string,
  source: string,
  content: Record<string, unknown>
): Promise<ActionResult> {
  const syncClient = createSyncClient()
  const serverClient = createClient()

  // Authenticate
  const {
    data: { user },
  } = await serverClient.auth.getUser()

  // Determine next version number
  const { data: latestVersion } = await syncClient
    .from('document_versions')
    .select('version_number, snapshot')
    .eq('document_id', documentId)
    .eq('company_id', companyId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  const previousVersionNumber = (latestVersion?.version_number as number) ?? 0
  const nextVersionNumber = previousVersionNumber + 1

  // Compute diff against previous version if one exists
  let diffSummary: {
    additions: number
    deletions: number
    modifications: number
    sections_changed?: string[]
  } | null = null

  if (latestVersion?.snapshot) {
    const previousSnapshot = latestVersion.snapshot as Record<string, unknown>

    // Serialize snapshots to content strings for line-level diffing
    const oldContent = serializeSnapshot(previousSnapshot)
    const newContent = serializeSnapshot(content)

    const diff = await computeDiff(oldContent, newContent)
    const summary = await summarizeDiff(diff)

    // Identify which top-level sections changed
    const sectionsChanged = detectChangedSections(previousSnapshot, content)

    diffSummary = {
      additions: summary.additions,
      deletions: summary.deletions,
      modifications: summary.modifications,
      sections_changed: sectionsChanged.length > 0 ? sectionsChanged : undefined,
    }
  }

  // Insert the new version
  const { error: insertError } = await syncClient
    .from('document_versions')
    .insert({
      document_id: documentId,
      company_id: companyId,
      version_number: nextVersionNumber,
      source,
      snapshot: content,
      diff_summary: diffSummary,
      created_by: user?.id ?? null,
      created_at: new Date().toISOString(),
    })

  if (insertError) {
    return { success: false, error: insertError.message }
  }

  return { success: true }
}

// ─── Get Version History ─────────────────────────────────────

/**
 * Fetch the version history for a document, ordered by version number
 * descending (most recent first).
 *
 * @param documentId - The document to fetch versions for
 * @param limit - Maximum number of versions to return (default: 50)
 */
export async function getVersionHistory(
  documentId: string,
  limit: number = 50
): Promise<DocumentVersion[]> {
  const syncClient = createSyncClient()

  const { data, error } = await syncClient
    .from('document_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return data as DocumentVersion[]
}

// ─── Get Version Diff ────────────────────────────────────────

/**
 * Compare two specific versions of a document by computing a diff
 * on their serialized snapshots. Returns null if either version
 * cannot be found.
 *
 * @param versionId1 - The "old" version ID (left side of diff)
 * @param versionId2 - The "new" version ID (right side of diff)
 */
export async function getVersionDiff(
  versionId1: string,
  versionId2: string
): Promise<DiffResult | null> {
  const syncClient = createSyncClient()

  // Fetch both versions in parallel
  const [result1, result2] = await Promise.all([
    syncClient
      .from('document_versions')
      .select('snapshot')
      .eq('id', versionId1)
      .single(),
    syncClient
      .from('document_versions')
      .select('snapshot')
      .eq('id', versionId2)
      .single(),
  ])

  if (result1.error || !result1.data || result2.error || !result2.data) {
    return null
  }

  const oldSnapshot = result1.data.snapshot as Record<string, unknown>
  const newSnapshot = result2.data.snapshot as Record<string, unknown>

  const oldContent = serializeSnapshot(oldSnapshot)
  const newContent = serializeSnapshot(newSnapshot)

  return computeDiff(oldContent, newContent)
}

// ─── Internal Helpers ────────────────────────────────────────

/**
 * Serialize a document snapshot into a stable, human-readable string
 * suitable for line-level diffing. Keys are sorted to ensure
 * deterministic output regardless of insertion order.
 */
function serializeSnapshot(snapshot: Record<string, unknown>): string {
  const lines: string[] = []

  const sortedKeys = Object.keys(snapshot).sort()

  for (const key of sortedKeys) {
    const value = snapshot[key]

    if (typeof value === 'string') {
      lines.push(`${key}: ${value}`)
    } else if (value === null || value === undefined) {
      lines.push(`${key}: null`)
    } else if (typeof value === 'object') {
      // Nested objects get JSON-serialized with sorted keys
      lines.push(`${key}: ${stableStringify(value)}`)
    } else {
      lines.push(`${key}: ${String(value)}`)
    }
  }

  return lines.join('\n')
}

/**
 * JSON.stringify with sorted keys for stable, deterministic output.
 */
function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value !== 'object') return JSON.stringify(value)

  if (Array.isArray(value)) {
    const items = value.map((item) => stableStringify(item))
    return `[${items.join(',')}]`
  }

  const obj = value as Record<string, unknown>
  const sortedKeys = Object.keys(obj).sort()
  const pairs = sortedKeys.map(
    (key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`
  )
  return `{${pairs.join(',')}}`
}

/**
 * Detect which top-level sections changed between two snapshots.
 * Compares serialized values of each key.
 */
function detectChangedSections(
  oldSnapshot: Record<string, unknown>,
  newSnapshot: Record<string, unknown>
): string[] {
  const allKeys = new Set([
    ...Object.keys(oldSnapshot),
    ...Object.keys(newSnapshot),
  ])

  const changed: string[] = []

  for (const key of Array.from(allKeys)) {
    const oldVal = stableStringify(oldSnapshot[key])
    const newVal = stableStringify(newSnapshot[key])

    if (oldVal !== newVal) {
      changed.push(key)
    }
  }

  return changed
}
