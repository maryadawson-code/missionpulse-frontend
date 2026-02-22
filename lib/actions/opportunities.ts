// filepath: lib/actions/opportunities.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logNotification } from '@/lib/utils/notifications'
import type { OpportunityInsert, OpportunityUpdate } from '@/lib/types/opportunities'

interface ActionResult {
  success: boolean
  error?: string
  id?: string
}

/**
 * Fetch all opportunities the current user can see (RLS-enforced).
 * Returns typed rows from the opportunities table.
 */
export async function getOpportunities() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('opportunities')
    .select(
      'id, title, agency, ceiling, pwin, phase, status, set_aside, due_date, owner_id, priority, nickname, solicitation_number, created_at, updated_at'
    )
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[opportunities:list]', error.message)
    return { data: null, error: error.message }
  }

  return { data: data ?? [], error: null }
}

/**
 * Fetch a single opportunity by ID (RLS-enforced).
 */
export async function getOpportunity(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[opportunities:get]', error.message)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

/**
 * Create a new opportunity. Validates required fields server-side.
 * Writes to audit_logs after successful insert.
 */
export async function createOpportunity(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const title = formData.get('title')
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return { success: false, error: 'Title is required' }
  }

  // Parse ceiling — numeric field, allow empty
  const ceilingRaw = formData.get('ceiling')
  const ceiling =
    ceilingRaw && String(ceilingRaw).trim()
      ? Number(String(ceilingRaw).replace(/[,$]/g, ''))
      : null

  if (ceiling !== null && isNaN(ceiling)) {
    return { success: false, error: 'Contract value must be a number' }
  }

  // Parse pwin — integer 0-100
  const pwinRaw = formData.get('pwin')
  const pwin = pwinRaw ? Number(pwinRaw) : 50

  if (pwin < 0 || pwin > 100) {
    return { success: false, error: 'Win probability must be 0–100' }
  }

  const insert: OpportunityInsert = {
    title: title.trim(),
    agency: formData.get('agency') as string | null,
    sub_agency: formData.get('sub_agency') as string | null,
    ceiling,
    pwin: Math.round(pwin),
    phase: (formData.get('phase') as string) || 'Gate 1',
    status: (formData.get('status') as string) || 'Active',
    priority: (formData.get('priority') as string) || 'Medium',
    set_aside: formData.get('set_aside') as string | null,
    due_date: formData.get('due_date') as string | null,
    description: formData.get('description') as string | null,
    nickname: formData.get('nickname') as string | null,
    solicitation_number: formData.get('solicitation_number') as string | null,
    contract_vehicle: formData.get('contract_vehicle') as string | null,
    naics_code: formData.get('naics_code') as string | null,
    period_of_performance: formData.get('period_of_performance') as string | null,
    incumbent: formData.get('incumbent') as string | null,
    contact_name: formData.get('contact_name') as string | null,
    contact_email: formData.get('contact_email') as string | null,
    place_of_performance: formData.get('place_of_performance') as string | null,
    is_recompete: formData.get('is_recompete') === 'true',
    owner_id: user.id,
  }

  const { data, error } = await supabase
    .from('opportunities')
    .insert(insert)
    .select('id')
    .single()

  if (error) {
    console.error('[opportunities:create]', error.message)
    return { success: false, error: error.message }
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    action: 'CREATE',
    entity_type: 'opportunity',
    entity_id: data.id,
    user_id: user.id,
    details: { title: insert.title },
  })

  // Activity log (user-visible)
  await supabase.from('activity_log').insert({
    action: 'created_opportunity',
    entity_type: 'opportunity',
    entity_id: data.id,
    user_id: user.id,
  })

  revalidatePath('/pipeline')
  revalidatePath('/')
  return { success: true, id: data.id }
}

/**
 * Update an existing opportunity by ID.
 */
export async function updateOpportunity(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const title = formData.get('title')
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return { success: false, error: 'Title is required' }
  }

  const ceilingRaw = formData.get('ceiling')
  const ceiling =
    ceilingRaw && String(ceilingRaw).trim()
      ? Number(String(ceilingRaw).replace(/[,$]/g, ''))
      : null

  if (ceiling !== null && isNaN(ceiling)) {
    return { success: false, error: 'Contract value must be a number' }
  }

  const pwinRaw = formData.get('pwin')
  const pwin = pwinRaw ? Number(pwinRaw) : 50

  const update: OpportunityUpdate = {
    title: String(title).trim(),
    agency: formData.get('agency') as string | null,
    sub_agency: formData.get('sub_agency') as string | null,
    ceiling,
    pwin: Math.round(pwin),
    phase: (formData.get('phase') as string) || 'Gate 1',
    status: (formData.get('status') as string) || 'Active',
    priority: (formData.get('priority') as string) || 'Medium',
    set_aside: formData.get('set_aside') as string | null,
    due_date: formData.get('due_date') as string | null,
    description: formData.get('description') as string | null,
    nickname: formData.get('nickname') as string | null,
    solicitation_number: formData.get('solicitation_number') as string | null,
    contract_vehicle: formData.get('contract_vehicle') as string | null,
    naics_code: formData.get('naics_code') as string | null,
    period_of_performance: formData.get('period_of_performance') as string | null,
    incumbent: formData.get('incumbent') as string | null,
    contact_name: formData.get('contact_name') as string | null,
    contact_email: formData.get('contact_email') as string | null,
    place_of_performance: formData.get('place_of_performance') as string | null,
    is_recompete: formData.get('is_recompete') === 'true',
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('opportunities')
    .update(update)
    .eq('id', id)

  if (error) {
    console.error('[opportunities:update]', error.message)
    return { success: false, error: error.message }
  }

  await supabase.from('audit_logs').insert({
    action: 'UPDATE',
    entity_type: 'opportunity',
    entity_id: id,
    user_id: user.id,
    details: { title: update.title },
  })

  await supabase.from('activity_log').insert({
    action: 'updated_opportunity',
    entity_type: 'opportunity',
    entity_id: id,
    user_id: user.id,
  })

  revalidatePath('/pipeline')
  revalidatePath(`/war-room/${id}`)
  revalidatePath('/')
  return { success: true, id }
}

/**
 * Update only the Shipley phase of an opportunity.
 * Used by the Kanban board drag-and-drop.
 */
export async function updateOpportunityPhase(
  id: string,
  phase: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('opportunities')
    .update({ phase, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[opportunities:updatePhase]', error.message)
    return { success: false, error: error.message }
  }

  await supabase.from('audit_logs').insert({
    action: 'UPDATE',
    entity_type: 'opportunity',
    entity_id: id,
    user_id: user.id,
    details: { field: 'phase', new_value: phase },
  })

  await supabase.from('activity_log').insert({
    action: 'updated_opportunity_phase',
    entity_type: 'opportunity',
    entity_id: id,
    user_id: user.id,
  })

  // Notify opportunity owner on gate transitions
  const { data: opp } = await supabase
    .from('opportunities')
    .select('owner_id, title')
    .eq('id', id)
    .single()

  if (opp?.owner_id && opp.owner_id !== user.id) {
    await logNotification({
      userId: opp.owner_id,
      title: `Opportunity moved to ${phase}`,
      message: `"${opp.title}" was moved to ${phase} by ${user.email}.`,
      notificationType: 'gate_approval',
      priority: 'high',
      linkUrl: `/pipeline/${id}`,
      linkText: 'View Opportunity',
      opportunityId: id,
    })
  }

  revalidatePath('/pipeline')
  revalidatePath(`/war-room/${id}`)
  revalidatePath('/')
  return { success: true, id }
}

/**
 * Delete an opportunity by ID. Hard delete (no soft delete).
 */
export async function deleteOpportunity(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Fetch title for audit before deleting
  const { data: existing } = await supabase
    .from('opportunities')
    .select('title')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('opportunities').delete().eq('id', id)

  if (error) {
    console.error('[opportunities:delete]', error.message)
    return { success: false, error: error.message }
  }

  await supabase.from('audit_logs').insert({
    action: 'DELETE',
    entity_type: 'opportunity',
    entity_id: id,
    user_id: user.id,
    details: { title: existing?.title ?? 'Unknown' },
  })

  await supabase.from('activity_log').insert({
    action: 'deleted_opportunity',
    entity_type: 'opportunity',
    entity_id: id,
    user_id: user.id,
  })

  revalidatePath('/pipeline')
  revalidatePath('/')
  return { success: true }
}

/**
 * Update a single field on an opportunity (inline edit).
 */
const EDITABLE_FIELDS = new Set([
  'title', 'agency', 'sub_agency', 'ceiling', 'pwin', 'phase', 'status',
  'priority', 'set_aside', 'due_date', 'description', 'nickname',
  'solicitation_number', 'contract_vehicle', 'naics_code',
  'period_of_performance', 'incumbent', 'contact_name', 'contact_email',
  'place_of_performance', 'notes',
])

export async function updateOpportunityField(
  id: string,
  field: string,
  value: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  if (!EDITABLE_FIELDS.has(field)) {
    return { success: false, error: `Field "${field}" is not editable` }
  }

  // Coerce value types
  let dbValue: string | number | null = value.trim() || null
  if ((field === 'ceiling' || field === 'pwin') && dbValue !== null) {
    const num = Number(String(dbValue).replace(/[,$]/g, ''))
    if (isNaN(num)) return { success: false, error: `${field} must be a number` }
    dbValue = num
  }

  const { error } = await supabase
    .from('opportunities')
    .update({ [field]: dbValue, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  await supabase.from('audit_logs').insert({
    action: 'UPDATE',
    entity_type: 'opportunity',
    entity_id: id,
    user_id: user.id,
    details: { field, new_value: dbValue },
  })

  revalidatePath(`/pipeline/${id}`)
  revalidatePath('/pipeline')
  return { success: true, id }
}
