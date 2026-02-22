// filepath: lib/sync/coordination-rules.ts
/**
 * Coordination Rules — CRUD Operations
 *
 * Server actions for creating, updating, and managing coordination
 * rules that define how field changes cascade across related
 * proposal documents within a company.
 *
 * All mutations write to both audit_logs (immutable) and
 * coordination_rules (active config).
 *
 * v1.3 Sprint 30 — Cross-Document Intelligence
 */
'use server'

import { createSyncClient } from '@/lib/supabase/sync-client'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types'
import type { CoordinationRule, CoordinationTransform } from '@/lib/types/sync'

// ─── Valid Document Types ────────────────────────────────────

const VALID_DOC_TYPES = new Set([
  'cover_letter',
  'executive_summary',
  'technical_volume',
  'management_volume',
  'past_performance',
  'pricing_volume',
  'staffing_plan',
  'quality_plan',
  'transition_plan',
  'subcontracting_plan',
  'compliance_matrix',
  'resume',
  'org_chart',
  'schedule',
  'risk_register',
])

const VALID_TRANSFORMS = new Set<CoordinationTransform>([
  'copy' as CoordinationTransform,
  'format' as CoordinationTransform,
  'aggregate' as CoordinationTransform,
  'reference' as CoordinationTransform,
])

// ─── Create Rule ─────────────────────────────────────────────

/**
 * Create a new coordination rule. Validates source and target document
 * types against the known set. Writes an audit log entry.
 *
 * @param data - Rule data excluding auto-generated fields (id, created_at, updated_at)
 */
export async function createRule(
  data: Omit<CoordinationRule, 'id' | 'created_at' | 'updated_at'>
): Promise<ActionResult> {
  const syncClient = createSyncClient()
  const serverClient = createClient()

  // Authenticate
  const {
    data: { user },
  } = await serverClient.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Validate document types
  if (!VALID_DOC_TYPES.has(data.source_doc_type)) {
    return {
      success: false,
      error: `Invalid source document type: "${data.source_doc_type}"`,
    }
  }

  if (!VALID_DOC_TYPES.has(data.target_doc_type)) {
    return {
      success: false,
      error: `Invalid target document type: "${data.target_doc_type}"`,
    }
  }

  // Validate transform type
  if (!VALID_TRANSFORMS.has(data.transform_type)) {
    return {
      success: false,
      error: `Invalid transform type: "${data.transform_type}"`,
    }
  }

  // Validate field paths are non-empty
  if (!data.source_field_path.trim()) {
    return { success: false, error: 'Source field path is required' }
  }

  if (!data.target_field_path.trim()) {
    return { success: false, error: 'Target field path is required' }
  }

  // Prevent self-referencing rules (same doc type + same field)
  if (
    data.source_doc_type === data.target_doc_type &&
    data.source_field_path === data.target_field_path
  ) {
    return {
      success: false,
      error: 'Source and target cannot be the same document type and field path',
    }
  }

  // Insert the rule
  const now = new Date().toISOString()

  const { data: inserted, error: insertError } = await syncClient
    .from('coordination_rules')
    .insert({
      company_id: data.company_id,
      source_doc_type: data.source_doc_type,
      source_field_path: data.source_field_path.trim(),
      target_doc_type: data.target_doc_type,
      target_field_path: data.target_field_path.trim(),
      transform_type: data.transform_type,
      is_active: data.is_active,
      description: data.description?.trim() || null,
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single()

  if (insertError || !inserted) {
    return { success: false, error: insertError?.message ?? 'Failed to create rule' }
  }

  // Audit log
  await serverClient.from('audit_logs').insert({
    action: 'CREATE',
    entity_type: 'coordination_rule',
    entity_id: inserted.id as string,
    user_id: user.id,
    details: {
      source_doc_type: data.source_doc_type,
      target_doc_type: data.target_doc_type,
      transform_type: data.transform_type,
    },
  })

  return { success: true }
}

// ─── Update Rule ─────────────────────────────────────────────

/**
 * Update an existing coordination rule. Only specified fields are changed.
 * Writes an audit log entry with the changed fields.
 *
 * @param ruleId - The rule ID to update
 * @param updates - Partial fields to update
 */
export async function updateRule(
  ruleId: string,
  updates: Partial<
    Pick<
      CoordinationRule,
      | 'source_field_path'
      | 'target_field_path'
      | 'transform_type'
      | 'is_active'
      | 'description'
    >
  >
): Promise<ActionResult> {
  const syncClient = createSyncClient()
  const serverClient = createClient()

  // Authenticate
  const {
    data: { user },
  } = await serverClient.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Verify rule exists
  const { data: existing, error: fetchError } = await syncClient
    .from('coordination_rules')
    .select('id, company_id')
    .eq('id', ruleId)
    .single()

  if (fetchError || !existing) {
    return { success: false, error: 'Coordination rule not found' }
  }

  // Validate transform type if provided
  if (updates.transform_type && !VALID_TRANSFORMS.has(updates.transform_type)) {
    return {
      success: false,
      error: `Invalid transform type: "${updates.transform_type}"`,
    }
  }

  // Validate field paths if provided
  if (updates.source_field_path !== undefined && !updates.source_field_path.trim()) {
    return { success: false, error: 'Source field path cannot be empty' }
  }

  if (updates.target_field_path !== undefined && !updates.target_field_path.trim()) {
    return { success: false, error: 'Target field path cannot be empty' }
  }

  // Build the update payload
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.source_field_path !== undefined) {
    payload.source_field_path = updates.source_field_path.trim()
  }
  if (updates.target_field_path !== undefined) {
    payload.target_field_path = updates.target_field_path.trim()
  }
  if (updates.transform_type !== undefined) {
    payload.transform_type = updates.transform_type
  }
  if (updates.is_active !== undefined) {
    payload.is_active = updates.is_active
  }
  if (updates.description !== undefined) {
    payload.description = updates.description?.trim() || null
  }

  const { error: updateError } = await syncClient
    .from('coordination_rules')
    .update(payload)
    .eq('id', ruleId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  // Audit log
  await serverClient.from('audit_logs').insert({
    action: 'UPDATE',
    entity_type: 'coordination_rule',
    entity_id: ruleId,
    user_id: user.id,
    details: { updated_fields: Object.keys(updates) },
  })

  return { success: true }
}

// ─── Delete Rule (Soft) ──────────────────────────────────────

/**
 * Soft-delete a coordination rule by setting is_active = false.
 * The rule record is preserved for audit trail purposes.
 *
 * @param ruleId - The rule ID to deactivate
 */
export async function deleteRule(ruleId: string): Promise<ActionResult> {
  const syncClient = createSyncClient()
  const serverClient = createClient()

  // Authenticate
  const {
    data: { user },
  } = await serverClient.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Verify rule exists
  const { data: existing, error: fetchError } = await syncClient
    .from('coordination_rules')
    .select('id, description, source_doc_type, target_doc_type')
    .eq('id', ruleId)
    .single()

  if (fetchError || !existing) {
    return { success: false, error: 'Coordination rule not found' }
  }

  // Soft delete — deactivate the rule
  const { error: updateError } = await syncClient
    .from('coordination_rules')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ruleId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  // Audit log
  await serverClient.from('audit_logs').insert({
    action: 'DELETE',
    entity_type: 'coordination_rule',
    entity_id: ruleId,
    user_id: user.id,
    details: {
      description: existing.description,
      source_doc_type: existing.source_doc_type,
      target_doc_type: existing.target_doc_type,
      soft_delete: true,
    },
  })

  return { success: true }
}

// ─── Get Rules by Company ────────────────────────────────────

/**
 * Fetch all coordination rules (active and inactive) for a company.
 * Returns rules ordered by most recently created first.
 *
 * @param companyId - The company scope
 */
export async function getRulesByCompany(
  companyId: string
): Promise<CoordinationRule[]> {
  const syncClient = createSyncClient()

  const { data, error } = await syncClient
    .from('coordination_rules')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data as CoordinationRule[]
}
