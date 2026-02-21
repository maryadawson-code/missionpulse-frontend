'use server'

import { createClient } from '@/lib/supabase/server'
import type { ModulePermission } from '@/lib/types'

/**
 * Check if the current user is in Solo Mode.
 * Uses the DB function is_user_solo_mode() first, then falls back to
 * checking max_users on the company.
 */
export async function isSoloMode(): Promise<boolean> {
  const supabase = await createClient()

  // Try the DB function first
  try {
    const { data } = await supabase.rpc('is_user_solo_mode')
    if (typeof data === 'boolean') return data
  } catch {
    // Fallback: check company max_users
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) return true // No company = solo

  const { data: company } = await supabase
    .from('companies')
    .select('max_users, subscription_tier')
    .eq('id', profile.company_id)
    .single()

  if (!company) return true
  return (company.max_users ?? 999) <= 1 || company.subscription_tier === 'solo'
}

/**
 * Get solo mode phase configuration from the database.
 */
export async function getSoloPhaseConfig() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('solo_mode_phase_config')
    .select('*')
    .order('sort_order', { ascending: true })

  return data ?? []
}

/**
 * Get solo mode gate status for an opportunity.
 */
export async function getSoloGateStatus(opportunityId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('solo_mode_gates')
    .select('*')
    .eq('opportunity_id', opportunityId)
    .order('phase_number', { ascending: true })

  return data ?? []
}

/**
 * Approve a solo mode gate.
 */
export async function approveSoloGate(
  opportunityId: string,
  gateId: string,
  gateName: string,
  phaseNumber: number,
  notes?: string
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  const { error } = await supabase.from('solo_mode_gates').upsert(
    {
      opportunity_id: opportunityId,
      gate_id: gateId,
      gate_name: gateName,
      phase_number: phaseNumber,
      status: 'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      decision_notes: notes ?? null,
      company_id: profile?.company_id ?? '',
    },
    { onConflict: 'opportunity_id,gate_id' }
  )

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * In Solo Mode, the user gets the union of all internal role permissions.
 * This gives them access to every module without needing multiple roles.
 */
export function getSoloModePermissions(): Record<string, ModulePermission> {
  const allModules = [
    'dashboard', 'pipeline', 'proposals', 'pricing', 'strategy',
    'blackhat', 'compliance', 'workflow_board', 'ai_chat',
    'documents', 'analytics', 'admin', 'integrations', 'audit_log', 'personnel',
  ]

  const permissions: Record<string, ModulePermission> = {}
  for (const m of allModules) {
    permissions[m] = { shouldRender: true, canView: true, canEdit: true }
  }
  return permissions
}
