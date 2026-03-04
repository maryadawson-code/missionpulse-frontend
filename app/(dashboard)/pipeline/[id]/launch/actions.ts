'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { resolveRole, getGateAuthority } from '@/lib/rbac/config'

const GATE_AUTHORITY_MAP: Record<number, string> = {
  1: 'gate1',
  2: 'blue',
  3: 'blue',
  4: 'red',
  5: 'gold',
  6: 'submit',
}

export async function recordGateDecision(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const opportunityId = formData.get('opportunityId') as string
  const gateName = formData.get('gateName') as string
  const gateNumber = Number(formData.get('gateNumber') ?? 1)
  const decision = formData.get('decision') as string
  const conditionsRaw = formData.get('conditions') as string

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  // Server-side gate authority enforcement
  const role = resolveRole(profile?.role)
  const authority = getGateAuthority(role)
  const requiredAuthority = GATE_AUTHORITY_MAP[gateNumber]
  if (requiredAuthority && !authority.canApprove.includes(requiredAuthority)) {
    return { success: false, error: 'You do not have permission to approve this gate' }
  }

  // Get current pWin
  const { data: opp } = await supabase
    .from('opportunities')
    .select('pwin')
    .eq('id', opportunityId)
    .single()

  const conditions = conditionsRaw
    ? conditionsRaw.split('\n').map((c) => c.trim()).filter(Boolean)
    : []

  const { error } = await supabase.from('gate_reviews').insert({
    id: crypto.randomUUID(),
    opportunity_id: opportunityId,
    company_id: profile?.company_id ?? null,
    gate_name: gateName,
    gate_number: gateNumber,
    decision,
    conditions,
    pwin_at_gate: opp?.pwin ?? null,
  })

  if (error) return { success: false, error: error.message }

  // Dual logging: activity_feed (user-visible) + audit_logs (immutable)
  await supabase.from('activity_feed').insert({
    action_type: 'gate_decision',
    entity_type: 'opportunity',
    entity_id: opportunityId,
    entity_name: gateName || `Gate ${gateNumber}`,
    user_id: user.id,
    user_name: profile?.role ?? 'Unknown',
    company_id: profile?.company_id ?? null,
    opportunity_id: opportunityId,
    description: `Gate ${gateNumber} decision: ${decision.replace(/_/g, ' ')}`,
    metadata: JSON.parse(JSON.stringify({
      gate_name: gateName,
      gate_number: gateNumber,
      decision,
      pwin_at_gate: opp?.pwin ?? null,
      conditions,
    })),
  })

  await supabase.from('audit_logs').insert({
    id: crypto.randomUUID(),
    user_id: user.id,
    action: 'gate_decision',
    entity_type: 'opportunity',
    entity_id: opportunityId,
    details: { gate_name: gateName, decision, gate_number: gateNumber },
    created_at: new Date().toISOString(),
  })

  revalidatePath(`/pipeline/${opportunityId}/launch`)
  return { success: true }
}

interface ConflictRow {
  id: string
  document_id: string
  section_id: string | null
  company_id: string
  mp_version: { content: string; updated_at: string; updated_by?: string }
  cloud_version: { content: string; updated_at: string; source?: string }
  resolution: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
}

// Workaround for deep type instantiation on sync_conflicts table.
// The generated Database types cause TS to exceed recursion depth on chained queries.
async function querySyncConflicts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  documentId: string
): Promise<{ data: ConflictRow | null; error: string | null }> {
  const table = 'sync_conflicts'
  const from = supabase.from as unknown as (t: string) => Record<string, Function> // eslint-disable-line
  const result = await from(table)
    .select('*')
    .eq('document_id', documentId)
    .eq('resolution', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle() as { data: ConflictRow | null; error: { message: string } | null }
  return { data: result.data, error: result.error?.message ?? null }
}

async function updateSyncConflict(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conflictId: string,
  values: Record<string, unknown>
): Promise<{ error: string | null }> {
  const table = 'sync_conflicts'
  const from = supabase.from as unknown as (t: string) => Record<string, Function> // eslint-disable-line
  const result = await from(table)
    .update(values)
    .eq('id', conflictId) as { error: { message: string } | null }
  return { error: result.error?.message ?? null }
}

export async function getConflictForDocument(documentId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { conflict: null, error: 'Not authenticated' }

  const { data: conflict, error } = await querySyncConflicts(supabase, documentId)
  if (error) return { conflict: null, error }
  if (!conflict) return { conflict: null, error: 'No pending conflict found' }

  return { conflict }
}

export async function resolveDocumentConflict(
  conflictId: string,
  resolution: 'keep_mp' | 'keep_cloud' | 'merge'
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await updateSyncConflict(supabase, conflictId, {
    resolution,
    resolved_by: user.id,
    resolved_at: new Date().toISOString(),
  })

  if (error) return { success: false, error }

  await supabase.from('audit_logs').insert({
    id: crypto.randomUUID(),
    user_id: user.id,
    action: 'conflict_resolved',
    entity_type: 'sync_conflict',
    entity_id: conflictId,
    details: { resolution },
    created_at: new Date().toISOString(),
  })

  return { success: true }
}

export async function updateOpportunityStatus(opportunityId: string, status: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('opportunities')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', opportunityId)

  if (error) return { success: false, error: error.message }

  await supabase.from('audit_logs').insert({
    id: crypto.randomUUID(),
    user_id: user.id,
    action: 'status_change',
    entity_type: 'opportunity',
    entity_id: opportunityId,
    details: { new_status: status },
    created_at: new Date().toISOString(),
  })

  revalidatePath(`/pipeline/${opportunityId}/launch`)
  return { success: true }
}
