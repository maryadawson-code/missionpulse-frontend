'use server'

/**
 * Opportunity Server Actions
 * CRUD operations with RLS enforcement
 * © 2026 Mission Meets Tech
 */
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Opportunity } from '@/lib/supabase/types'

export type OpportunityRow = Opportunity

/**
 * Fetch all opportunities for the current user's company
 * RLS handles company scoping automatically
 */
export async function getOpportunities(): Promise<OpportunityRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[opportunities] fetch error:', error.message)
    return []
  }
  return data || []
}

/**
 * Fetch a single opportunity by ID
 */
export async function getOpportunity(id: string): Promise<OpportunityRow | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[opportunities] fetch single error:', error.message)
    return null
  }
  return data
}

/**
 * Fetch opportunities grouped by pipeline phase
 * Returns a map: { "Opportunity": [...], "Capture": [...], ... }
 */
export async function getOpportunitiesByPhase(): Promise<Record<string, OpportunityRow[]>> {
  const opps = await getOpportunities()
  return opps.reduce<Record<string, OpportunityRow[]>>((acc, opp) => {
    const phase = opp.phase || 'Unknown'
    if (!acc[phase]) acc[phase] = []
    acc[phase].push(opp)
    return acc
  }, {})
}

/**
 * Get pipeline stats
 */
export async function getPipelineStats() {
  const opps = await getOpportunities()

  const activeOpps = opps.filter((o) => o.status === 'Active')
  const totalCeiling = activeOpps.reduce((sum, o) => sum + (o.ceiling || 0), 0)
  const avgPwin = activeOpps.length
    ? activeOpps.reduce((sum, o) => sum + (o.pwin || 0), 0) / activeOpps.length
    : 0
  const weightedValue = activeOpps.reduce(
    (sum, o) => sum + (o.ceiling || 0) * ((o.pwin || 0) / 100),
    0
  )

  return {
    totalOpportunities: opps.length,
    activeOpportunities: activeOpps.length,
    totalCeiling,
    weightedValue,
    avgPwin: Math.round(avgPwin),
  }
}

/**
 * Update opportunity phase (for drag-and-drop)
 */
export async function updateOpportunityPhase(
  id: string,
  phase: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  const { error } = await supabase
    .from('opportunities')
    .update({ phase, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/pipeline')
  return { success: true }
}

/**
 * Update opportunity fields
 */
export async function updateOpportunity(
  id: string,
  fields: Partial<OpportunityRow>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  const { error } = await supabase
    .from('opportunities')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/pipeline')
  revalidatePath(`/war-room/${id}`)
  return { success: true }
}
