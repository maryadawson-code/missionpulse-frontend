'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types'

export async function updateComplianceStatus(
  requirementId: string,
  status: string,
  opportunityId: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const updates: Record<string, string | null> = {
    status,
    updated_at: new Date().toISOString(),
  }

  // Track verification
  if (status === 'Verified') {
    updates.verified_at = new Date().toISOString()
    updates.verified_by = user.id
  }

  const { error } = await supabase
    .from('compliance_requirements')
    .update(updates)
    .eq('id', requirementId)

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_log').insert({
    action: 'update_compliance_status',
    user_name: user.email ?? 'Unknown',
    details: {
      entity_type: 'compliance_requirement',
      entity_id: requirementId,
      opportunity_id: opportunityId,
      new_status: status,
    },
  })

  await supabase.from('audit_logs').insert({
    action: 'update_compliance_status',
    user_id: user.id,
    entity_type: 'compliance_requirement',
    entity_id: requirementId,
    details: { opportunity_id: opportunityId, new_status: status },
  })

  revalidatePath(`/pipeline/${opportunityId}/compliance`)
  return { success: true }
}

export async function assignComplianceReviewer(
  requirementId: string,
  assignedTo: string | null,
  opportunityId: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('compliance_requirements')
    .update({
      assigned_to: assignedTo,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requirementId)

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_log').insert({
    action: 'assign_compliance_reviewer',
    user_name: user.email ?? 'Unknown',
    details: {
      entity_type: 'compliance_requirement',
      entity_id: requirementId,
      opportunity_id: opportunityId,
      assigned_to: assignedTo,
    },
  })

  await supabase.from('audit_logs').insert({
    action: 'assign_compliance_reviewer',
    user_id: user.id,
    entity_type: 'compliance_requirement',
    entity_id: requirementId,
    details: { opportunity_id: opportunityId, assigned_to: assignedTo },
  })

  revalidatePath(`/pipeline/${opportunityId}/compliance`)
  return { success: true }
}

export async function updateComplianceEvidence(
  requirementId: string,
  notes: string,
  opportunityId: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('compliance_requirements')
    .update({
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requirementId)

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_log').insert({
    action: 'update_compliance_evidence',
    user_name: user.email ?? 'Unknown',
    details: {
      entity_type: 'compliance_requirement',
      entity_id: requirementId,
      opportunity_id: opportunityId,
    },
  })

  await supabase.from('audit_logs').insert({
    action: 'update_compliance_evidence',
    user_id: user.id,
    entity_type: 'compliance_requirement',
    entity_id: requirementId,
    details: { opportunity_id: opportunityId },
  })

  revalidatePath(`/pipeline/${opportunityId}/compliance`)
  return { success: true }
}
