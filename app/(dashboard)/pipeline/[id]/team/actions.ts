'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types'

export async function addTeamMember(
  opportunityId: string,
  data: { assignee_name: string; assignee_email: string; role: string }
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase.from('opportunity_assignments').insert({
    opportunity_id: opportunityId,
    assignee_name: data.assignee_name,
    assignee_email: data.assignee_email,
    role: data.role,
  })

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_log').insert({
    action: 'add_team_member',
    user_name: user.email ?? 'Unknown',
    details: {
      entity_type: 'opportunity_assignment',
      opportunity_id: opportunityId,
      assignee: data.assignee_email,
      role: data.role,
    },
  })

  revalidatePath(`/pipeline/${opportunityId}/team`)
  revalidatePath(`/war-room/${opportunityId}`)
  return { success: true }
}

export async function removeTeamMember(
  assignmentId: string,
  opportunityId: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from('opportunity_assignments')
    .select('assignee_name')
    .eq('id', assignmentId)
    .single()

  const { error } = await supabase
    .from('opportunity_assignments')
    .delete()
    .eq('id', assignmentId)

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_log').insert({
    action: 'remove_team_member',
    user_name: user.email ?? 'Unknown',
    details: {
      entity_type: 'opportunity_assignment',
      opportunity_id: opportunityId,
      removed: existing?.assignee_name ?? 'Unknown',
    },
  })

  revalidatePath(`/pipeline/${opportunityId}/team`)
  revalidatePath(`/war-room/${opportunityId}`)
  return { success: true }
}

export async function updateTeamMemberRole(
  assignmentId: string,
  role: string,
  opportunityId: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('opportunity_assignments')
    .update({ role })
    .eq('id', assignmentId)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/pipeline/${opportunityId}/team`)
  revalidatePath(`/war-room/${opportunityId}`)
  return { success: true }
}
