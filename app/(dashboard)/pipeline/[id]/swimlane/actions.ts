'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types'

export async function updateSectionStatus(
  sectionId: string,
  status: string,
  opportunityId: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('proposal_sections')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', sectionId)

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_log').insert({
    action: 'update_section_status',
    user_name: user.email ?? 'Unknown',
    details: { entity_type: 'proposal_section', entity_id: sectionId, new_status: status },
  })

  revalidatePath(`/pipeline/${opportunityId}/swimlane`)
  return { success: true }
}

export async function assignSectionOwner(
  sectionId: string,
  writerId: string | null,
  opportunityId: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('proposal_sections')
    .update({ writer_id: writerId, updated_at: new Date().toISOString() })
    .eq('id', sectionId)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/pipeline/${opportunityId}/swimlane`)
  return { success: true }
}
