// filepath: lib/sync/coordination-engine.ts
/**
 * Cross-Document Coordination Engine
 *
 * Executes coordination rules that propagate field changes across
 * related proposal documents. When a source field changes (e.g.,
 * contract value in the cover letter), the engine applies the
 * configured transform to all target documents.
 *
 * Supports four transform types:
 *   - copy: Direct value replication
 *   - format: Apply formatting transform (currency, date, etc.)
 *   - aggregate: Sum/count across source documents
 *   - reference: Insert a cross-reference pointer
 *
 * v1.3 Sprint 30 — Cross-Document Intelligence
 */
'use server'

import { createSyncClient } from '@/lib/supabase/sync-client'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types'
import type {
  CoordinationRule,
  CoordinationTransform,
  CascadePreviewItem,
} from '@/lib/types/sync'

// ─── Transform Helpers ───────────────────────────────────────

/**
 * Apply a coordination transform to a source value.
 * Returns the transformed value suitable for the target field.
 */
function applyTransform(
  transform: CoordinationTransform,
  sourceValue: unknown,
  _targetFieldPath: string
): unknown {
  switch (transform) {
    case 'copy':
      return sourceValue

    case 'format': {
      // Format numeric values as currency, dates as ISO strings
      if (typeof sourceValue === 'number') {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(sourceValue)
      }
      if (sourceValue instanceof Date) {
        return sourceValue.toISOString()
      }
      return String(sourceValue ?? '')
    }

    case 'aggregate': {
      // Aggregate expects an array — sum numeric values
      if (Array.isArray(sourceValue)) {
        return sourceValue.reduce((sum: number, val: unknown) => {
          const num = typeof val === 'number' ? val : Number(val)
          return sum + (isNaN(num) ? 0 : num)
        }, 0)
      }
      return sourceValue
    }

    case 'reference': {
      // Return a cross-reference string
      return `[ref:${String(sourceValue ?? '')}]`
    }

    default:
      return sourceValue
  }
}

/**
 * Extract a nested value from an object using a dot-separated field path.
 * Returns undefined if the path does not resolve.
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.')
  let current: unknown = obj

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined
    }
    current = (current as Record<string, unknown>)[part]
  }

  return current
}

/**
 * Set a nested value on an object using a dot-separated field path.
 * Creates intermediate objects as needed.
 */
function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> {
  const result = { ...obj }
  const parts = path.split('.')
  let current: Record<string, unknown> = result

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (typeof current[part] !== 'object' || current[part] === null) {
      current[part] = {}
    } else {
      current[part] = { ...(current[part] as Record<string, unknown>) }
    }
    current = current[part] as Record<string, unknown>
  }

  current[parts[parts.length - 1]] = value
  return result
}

// ─── Execute Coordination ────────────────────────────────────

/**
 * Execute a single coordination rule. Loads the rule from coordination_rules,
 * finds affected documents, applies the transform, and logs to coordination_log.
 *
 * @param ruleId - The coordination rule to execute
 * @param triggerDocumentId - The document whose change triggered this rule
 * @param companyId - The company scope for RLS enforcement
 */
export async function executeCoordination(
  ruleId: string,
  triggerDocumentId: string,
  companyId: string
): Promise<ActionResult> {
  const syncClient = createSyncClient()
  const serverClient = createClient()

  // 1. Load the coordination rule
  const { data: rule, error: ruleError } = await syncClient
    .from('coordination_rules')
    .select('*')
    .eq('id', ruleId)
    .eq('company_id', companyId)
    .eq('is_active', true)
    .single()

  if (ruleError || !rule) {
    return { success: false, error: ruleError?.message ?? 'Rule not found or inactive' }
  }

  const typedRule = rule as CoordinationRule

  // 2. Fetch the trigger document content to extract the source value
  const { data: triggerDoc, error: triggerError } = await syncClient
    .from('document_versions')
    .select('snapshot')
    .eq('document_id', triggerDocumentId)
    .eq('company_id', companyId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  if (triggerError || !triggerDoc) {
    await logCoordinationResult(syncClient, {
      ruleId,
      triggerDocumentId,
      companyId,
      affectedDocuments: [],
      changesApplied: [],
      status: 'failed',
      errorMessage: triggerError?.message ?? 'Trigger document version not found',
    })
    return { success: false, error: 'Could not load trigger document version' }
  }

  const snapshot = triggerDoc.snapshot as Record<string, unknown>
  const sourceValue = getNestedValue(snapshot, typedRule.source_field_path)

  if (sourceValue === undefined) {
    await logCoordinationResult(syncClient, {
      ruleId,
      triggerDocumentId,
      companyId,
      affectedDocuments: [],
      changesApplied: [],
      status: 'skipped',
      errorMessage: `Source field "${typedRule.source_field_path}" not found in document`,
    })
    return { success: true }
  }

  // 3. Compute the transformed value
  const transformedValue = applyTransform(
    typedRule.transform_type,
    sourceValue,
    typedRule.target_field_path
  )

  // 4. Find all target documents of the matching type within this company
  //    Target documents are identified by their doc_type metadata in document_versions
  const { data: targetVersions, error: targetError } = await syncClient
    .from('document_versions')
    .select('id, document_id, snapshot')
    .eq('company_id', companyId)
    .neq('document_id', triggerDocumentId)

  if (targetError) {
    await logCoordinationResult(syncClient, {
      ruleId,
      triggerDocumentId,
      companyId,
      affectedDocuments: [],
      changesApplied: [],
      status: 'failed',
      errorMessage: targetError.message,
    })
    return { success: false, error: targetError.message }
  }

  // Filter to latest version per document and matching doc type
  const latestByDoc = new Map<string, { id: string; snapshot: Record<string, unknown> }>()

  for (const ver of targetVersions ?? []) {
    const docId = ver.document_id as string
    const snap = ver.snapshot as Record<string, unknown>
    const docType = snap?.doc_type as string | undefined

    if (docType !== typedRule.target_doc_type) continue
    if (!latestByDoc.has(docId)) {
      latestByDoc.set(docId, { id: ver.id as string, snapshot: snap })
    }
  }

  if (latestByDoc.size === 0) {
    await logCoordinationResult(syncClient, {
      ruleId,
      triggerDocumentId,
      companyId,
      affectedDocuments: [],
      changesApplied: [],
      status: 'skipped',
      errorMessage: `No target documents of type "${typedRule.target_doc_type}" found`,
    })
    return { success: true }
  }

  // 5. Apply the transform to each target document
  const affectedDocuments: string[] = []
  const changesApplied: {
    document_id: string
    field_path: string
    old_value: unknown
    new_value: unknown
  }[] = []

  for (const [docId, { snapshot: targetSnapshot }] of Array.from(latestByDoc.entries())) {
    const oldValue = getNestedValue(targetSnapshot, typedRule.target_field_path)
    const updatedSnapshot = setNestedValue(targetSnapshot, typedRule.target_field_path, transformedValue)

    // Record a new version with the updated snapshot
    const { data: maxVer } = await syncClient
      .from('document_versions')
      .select('version_number')
      .eq('document_id', docId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    const nextVersion = ((maxVer?.version_number as number) ?? 0) + 1

    await syncClient.from('document_versions').insert({
      document_id: docId,
      company_id: companyId,
      version_number: nextVersion,
      source: 'missionpulse',
      snapshot: updatedSnapshot,
      diff_summary: {
        additions: 0,
        deletions: 0,
        modifications: 1,
        sections_changed: [typedRule.target_field_path],
      },
    })

    affectedDocuments.push(docId)
    changesApplied.push({
      document_id: docId,
      field_path: typedRule.target_field_path,
      old_value: oldValue,
      new_value: transformedValue,
    })
  }

  // 6. Log the coordination execution
  await logCoordinationResult(syncClient, {
    ruleId,
    triggerDocumentId,
    companyId,
    affectedDocuments,
    changesApplied,
    status: 'applied',
    errorMessage: null,
  })

  // 7. Write audit log via the standard server client
  const {
    data: { user },
  } = await serverClient.auth.getUser()

  if (user) {
    await serverClient.from('audit_logs').insert({
      action: 'COORDINATION_EXECUTE',
      entity_type: 'coordination_rule',
      entity_id: ruleId,
      user_id: user.id,
      details: {
        trigger_document_id: triggerDocumentId,
        affected_count: affectedDocuments.length,
        transform_type: typedRule.transform_type,
      },
    })
  }

  return { success: true }
}

// ─── Preview Cascade ─────────────────────────────────────────

/**
 * Preview what would change if a coordination rule fired with a given value.
 * Does NOT apply any changes — purely read-only preview.
 *
 * @param ruleId - The coordination rule to preview
 * @param newValue - The new source value to simulate
 * @returns Array of CascadePreviewItems showing affected documents and fields
 */
export async function previewCascade(
  ruleId: string,
  newValue: unknown
): Promise<CascadePreviewItem[]> {
  const syncClient = createSyncClient()

  // Load the rule
  const { data: rule, error: ruleError } = await syncClient
    .from('coordination_rules')
    .select('*')
    .eq('id', ruleId)
    .single()

  if (ruleError || !rule) return []

  const typedRule = rule as CoordinationRule

  // Compute the transformed value
  const transformedValue = applyTransform(
    typedRule.transform_type,
    newValue,
    typedRule.target_field_path
  )

  // Find target documents
  const { data: targetVersions } = await syncClient
    .from('document_versions')
    .select('document_id, snapshot')
    .eq('company_id', typedRule.company_id)

  if (!targetVersions || targetVersions.length === 0) return []

  // Deduplicate to latest version per document
  const latestByDoc = new Map<string, Record<string, unknown>>()

  for (const ver of targetVersions) {
    const docId = ver.document_id as string
    const snap = ver.snapshot as Record<string, unknown>
    const docType = snap?.doc_type as string | undefined

    if (docType !== typedRule.target_doc_type) continue
    if (!latestByDoc.has(docId)) {
      latestByDoc.set(docId, snap)
    }
  }

  // Build preview items
  const previews: CascadePreviewItem[] = []

  for (const [docId, snapshot] of Array.from(latestByDoc.entries())) {
    const currentValue = getNestedValue(snapshot, typedRule.target_field_path)
    const title = (snapshot.title as string) ?? (snapshot.name as string) ?? docId

    previews.push({
      ruleId: typedRule.id,
      ruleDescription: typedRule.description,
      targetDocType: typedRule.target_doc_type,
      targetFieldPath: typedRule.target_field_path,
      currentValue,
      newValue: transformedValue,
      documentId: docId,
      documentTitle: title,
    })
  }

  return previews
}

// ─── Get Active Rules ────────────────────────────────────────

/**
 * Fetch all active coordination rules for a company.
 *
 * @param companyId - The company scope
 * @returns Array of active CoordinationRules ordered by creation date
 */
export async function getActiveRules(
  companyId: string
): Promise<CoordinationRule[]> {
  const syncClient = createSyncClient()

  const { data, error } = await syncClient
    .from('coordination_rules')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data as CoordinationRule[]
}

// ─── Internal Helpers ────────────────────────────────────────

interface CoordinationLogParams {
  ruleId: string
  triggerDocumentId: string
  companyId: string
  affectedDocuments: string[]
  changesApplied: {
    document_id: string
    field_path: string
    old_value: unknown
    new_value: unknown
  }[]
  status: 'pending' | 'applied' | 'failed' | 'skipped'
  errorMessage: string | null
}

/**
 * Write a coordination log entry to track rule execution.
 */
async function logCoordinationResult(
  client: ReturnType<typeof createSyncClient>,
  params: CoordinationLogParams
): Promise<void> {
  await client.from('coordination_log').insert({
    rule_id: params.ruleId,
    trigger_document_id: params.triggerDocumentId,
    company_id: params.companyId,
    affected_documents: params.affectedDocuments,
    changes_applied: params.changesApplied,
    status: params.status,
    error_message: params.errorMessage,
    executed_at: new Date().toISOString(),
  })
}
