'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types'

export async function updateClauseCompliance(
  clauseId: string,
  complianceStatus: string,
  opportunityId: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('contract_clauses')
    .update({
      compliance_status: complianceStatus,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', clauseId)

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_log').insert({
    action: 'update_clause_compliance',
    user_name: user.email ?? 'Unknown',
    details: {
      entity_type: 'contract_clause',
      entity_id: clauseId,
      opportunity_id: opportunityId,
      compliance_status: complianceStatus,
    },
  })

  revalidatePath(`/pipeline/${opportunityId}/contracts`)
  return { success: true }
}

export async function updateClauseNotes(
  clauseId: string,
  notes: string,
  opportunityId: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('contract_clauses')
    .update({
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', clauseId)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/pipeline/${opportunityId}/contracts`)
  return { success: true }
}

export async function updateClauseRisk(
  clauseId: string,
  riskLevel: string,
  opportunityId: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('contract_clauses')
    .update({
      risk_level: riskLevel,
      updated_at: new Date().toISOString(),
    })
    .eq('id', clauseId)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/pipeline/${opportunityId}/contracts`)
  return { success: true }
}
