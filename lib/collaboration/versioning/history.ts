/**
 * Version History with Cloud Diffing
 * Sprint 30 (T-30.2) — Phase J v1.3
 *
 * Save, retrieve, and diff document versions from both
 * local and cloud sources.
 *
 * © 2026 Mission Meets Tech
 */

import { createClient } from '@/lib/supabase/server'

// ─── Types ──────────────────────────────────────────────────────

export interface DocumentVersion {
  id: string
  documentId: string | null
  sectionId: string | null
  content: string
  source: 'local' | 'cloud'
  versionNumber: number
  versionLabel: string | null
  createdBy: string | null
  createdAt: string | null
}

export interface DiffLine {
  type: 'addition' | 'deletion' | 'unchanged'
  content: string
  lineNumber: number
}

export interface DiffResult {
  lines: DiffLine[]
  additionCount: number
  deletionCount: number
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Save a version snapshot for a document section.
 */
export async function saveVersion(
  documentId: string,
  sectionId: string,
  content: string,
  source: 'local' | 'cloud',
  companyId: string,
  opportunityId: string,
  userId: string
): Promise<string | null> {
  const supabase = await createClient()

  // Get next version number
  const { data: latest } = await supabase
    .from('document_versions')
    .select('version_number')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  const nextVersion = (latest?.version_number ?? 0) + 1

  const { data, error } = await supabase
    .from('document_versions')
    .insert({
      document_id: documentId,
      document_type: sectionId,
      content: JSON.parse(JSON.stringify({ text: content })),
      source,
      version_number: nextVersion,
      version_label: `v${nextVersion}`,
      company_id: companyId,
      opportunity_id: opportunityId,
      created_by: userId,
    })
    .select('id')
    .single()

  if (error) return null
  return data?.id ?? null
}

/**
 * Get version history for a document section.
 */
export async function getVersionHistory(
  documentId: string,
  sectionId?: string
): Promise<DocumentVersion[]> {
  const supabase = await createClient()

  let query = supabase
    .from('document_versions')
    .select('id, document_id, document_type, content, source, version_number, version_label, created_by, created_at')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false })

  if (sectionId) {
    query = query.eq('document_type', sectionId)
  }

  const { data } = await query

  return (data ?? []).map(v => ({
    id: v.id,
    documentId: v.document_id,
    sectionId: v.document_type,
    content: typeof v.content === 'object' && v.content !== null
      ? (v.content as Record<string, string>).text ?? ''
      : '',
    source: (v.source as 'local' | 'cloud') ?? 'local',
    versionNumber: v.version_number,
    versionLabel: v.version_label,
    createdBy: v.created_by,
    createdAt: v.created_at,
  }))
}

/**
 * Compute a line-by-line diff between two versions.
 */
export function diffVersions(contentA: string, contentB: string): DiffResult {
  const linesA = contentA.split('\n')
  const linesB = contentB.split('\n')
  const result: DiffLine[] = []
  let additionCount = 0
  let deletionCount = 0

  const maxLen = Math.max(linesA.length, linesB.length)
  let lineNum = 1

  for (let i = 0; i < maxLen; i++) {
    const lineA = linesA[i]
    const lineB = linesB[i]

    if (lineA === undefined && lineB !== undefined) {
      result.push({ type: 'addition', content: lineB, lineNumber: lineNum })
      additionCount++
    } else if (lineA !== undefined && lineB === undefined) {
      result.push({ type: 'deletion', content: lineA, lineNumber: lineNum })
      deletionCount++
    } else if (lineA !== lineB) {
      result.push({ type: 'deletion', content: lineA ?? '', lineNumber: lineNum })
      deletionCount++
      lineNum++
      result.push({ type: 'addition', content: lineB ?? '', lineNumber: lineNum })
      additionCount++
    } else {
      result.push({ type: 'unchanged', content: lineA ?? '', lineNumber: lineNum })
    }

    lineNum++
  }

  return { lines: result, additionCount, deletionCount }
}
