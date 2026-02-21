'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types'

interface CreateRequirementInput {
  reference: string
  requirement: string
  section?: string
  priority?: string
  page_reference?: string
  volume_reference?: string
}

export async function createRequirement(
  opportunityId: string,
  input: CreateRequirementInput
): Promise<ActionResult<{ id: string }>> {
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

  const { data: req, error } = await supabase
    .from('compliance_requirements')
    .insert({
      opportunity_id: opportunityId,
      company_id: profile?.company_id ?? null,
      reference: input.reference,
      requirement: input.requirement,
      section: input.section || null,
      priority: input.priority || 'Medium',
      status: 'Not Started',
      page_reference: input.page_reference || null,
      volume_reference: input.volume_reference || null,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_log').insert({
    action: 'create_requirement',
    user_name: user.email ?? 'Unknown',
    details: {
      entity_type: 'compliance_requirement',
      entity_id: req.id,
      opportunity_id: opportunityId,
      reference: input.reference,
    },
  })

  await supabase.from('audit_logs').insert({
    action: 'create_requirement',
    user_id: user.id,
    entity_type: 'compliance_requirement',
    entity_id: req.id,
    details: { opportunity_id: opportunityId, reference: input.reference },
  })

  revalidatePath(`/pipeline/${opportunityId}/shredder/requirements`)
  return { success: true, data: { id: req.id } }
}

export async function updateRequirement(
  requirementId: string,
  opportunityId: string,
  updates: {
    priority?: string
    section?: string
    assigned_to?: string | null
    status?: string
    notes?: string
  }
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('compliance_requirements')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', requirementId)

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_log').insert({
    action: 'update_requirement',
    user_name: user.email ?? 'Unknown',
    details: {
      entity_type: 'compliance_requirement',
      entity_id: requirementId,
      opportunity_id: opportunityId,
      updates,
    },
  })

  revalidatePath(`/pipeline/${opportunityId}/shredder/requirements`)
  revalidatePath(`/pipeline/${opportunityId}/compliance`)
  return { success: true }
}

export async function deleteRequirement(
  requirementId: string,
  opportunityId: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('compliance_requirements')
    .delete()
    .eq('id', requirementId)

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_log').insert({
    action: 'delete_requirement',
    user_name: user.email ?? 'Unknown',
    details: {
      entity_type: 'compliance_requirement',
      entity_id: requirementId,
      opportunity_id: opportunityId,
    },
  })

  revalidatePath(`/pipeline/${opportunityId}/shredder/requirements`)
  revalidatePath(`/pipeline/${opportunityId}/compliance`)
  return { success: true }
}

export async function bulkUpdateRequirements(
  requirementIds: string[],
  opportunityId: string,
  updates: {
    priority?: string
    section?: string
    assigned_to?: string | null
  }
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('compliance_requirements')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .in('id', requirementIds)

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_log').insert({
    action: 'bulk_update_requirements',
    user_name: user.email ?? 'Unknown',
    details: {
      entity_type: 'compliance_requirement',
      opportunity_id: opportunityId,
      count: requirementIds.length,
      updates,
    },
  })

  revalidatePath(`/pipeline/${opportunityId}/shredder/requirements`)
  revalidatePath(`/pipeline/${opportunityId}/compliance`)
  return { success: true }
}
