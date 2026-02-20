// FILE: lib/actions/opportunities.ts
// SECURITY: NIST 800-53 Rev 5 CHECKED
// Server Actions: CRUD for opportunities table
// Exports verified against Sprint 1 imports:
//   - updateOpportunityPhase (PipelineBoard.tsx)
//   - getOpportunitiesByPhase (pipeline/page.tsx)
//   - getPipelineStats (pipeline/page.tsx)
'use server'

import { createClient } from '@/lib/supabase/server'
import type { Opportunity, PipelineStats } from '@/lib/supabase/types'
import { SHIPLEY_PHASES } from '@/lib/supabase/types'

// ============================================================
// READ
// ============================================================

/**
 * Fetch all opportunities for the current user's company.
 * RLS handles data isolation.
 */
export async function getOpportunities(): Promise<Opportunity[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[opportunities] getOpportunities:', error.message)
    return []
  }
  return (data ?? []) as Opportunity[]
}

/**
 * Fetch a single opportunity by ID.
 */
export async function getOpportunity(id: string): Promise<Opportunity | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[opportunities] getOpportunity:', error.message)
    return null
  }
  return data as Opportunity | null
}

/**
 * Group opportunities by Shipley phase for pipeline board.
 * Returns a Record<phase_name, Opportunity[]>.
 */
export async function getOpportunitiesByPhase(): Promise<
  Record<string, Opportunity[]>
> {
  const opps = await getOpportunities()
  const grouped: Record<string, Opportunity[]> = {}

  // Initialize all phases with empty arrays
  for (const phase of SHIPLEY_PHASES) {
    grouped[phase] = []
  }

  for (const opp of opps) {
    const phase = opp.phase ?? 'Gate 1'
    if (!grouped[phase]) grouped[phase] = []
    grouped[phase].push(opp)
  }

  return grouped
}

/**
 * Compute pipeline statistics.
 */
export async function getPipelineStats(): Promise<PipelineStats> {
  const opps = await getOpportunities()

  const byPhase: Record<string, number> = {}
  const byStatus: Record<string, number> = {}
  let totalValue = 0
  let pwinSum = 0
  let pwinCount = 0

  for (const opp of opps) {
    const phase = opp.phase ?? 'Unknown'
    byPhase[phase] = (byPhase[phase] ?? 0) + 1

    const status = opp.status ?? 'Unknown'
    byStatus[status] = (byStatus[status] ?? 0) + 1

    if (opp.ceiling != null) totalValue += Number(opp.ceiling)
    if (opp.pwin != null) {
      pwinSum += opp.pwin
      pwinCount++
    }
  }

  return {
    total: opps.length,
    totalValue,
    avgPwin: pwinCount > 0 ? Math.round(pwinSum / pwinCount) : 0,
    byPhase,
    byStatus,
  }
}

// ============================================================
// CREATE / UPDATE / DELETE
// ============================================================

/**
 * Create a new opportunity.
 */
export async function createOpportunity(
  fields: Partial<Opportunity> & { title: string }
): Promise<{ data: Opportunity | null; error: string | null }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('opportunities')
    .insert({
      ...fields,
      owner_id: user?.id ?? null,
      status: fields.status ?? 'Active',
      phase: fields.phase ?? 'Gate 1',
    })
    .select()
    .single()

  if (error) {
    console.error('[opportunities] createOpportunity:', error.message)
    return { data: null, error: error.message }
  }
  return { data: data as Opportunity, error: null }
}

/**
 * Update an existing opportunity.
 */
export async function updateOpportunity(
  id: string,
  fields: Partial<Opportunity>
): Promise<{ data: Opportunity | null; error: string | null }> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('opportunities')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[opportunities] updateOpportunity:', error.message)
    return { data: null, error: error.message }
  }
  return { data: data as Opportunity, error: null }
}

/**
 * Move an opportunity to a new Shipley phase.
 * Used by PipelineBoard drag-and-drop.
 */
export async function updateOpportunityPhase(
  id: string,
  newPhase: string
): Promise<{ data: Opportunity | null; error: string | null }> {
  return updateOpportunity(id, { phase: newPhase } as Partial<Opportunity>)
}

/**
 * Delete an opportunity (soft or hard depending on RLS).
 */
export async function deleteOpportunity(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('opportunities')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[opportunities] deleteOpportunity:', error.message)
    return { success: false, error: error.message }
  }
  return { success: true, error: null }
}

// Re-exports for OpportunityForm.tsx
export type { Opportunity } from '@/lib/supabase/types'
export type OpportunityInput = Partial<Opportunity> & {
  title: string
  nickname?: string
  go_no_go?: string
  sam_url?: string
  place_of_performance?: string
}
