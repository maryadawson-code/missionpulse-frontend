'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types'

export async function updateSectionContent(
  sectionId: string,
  content: string,
  opportunityId: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('proposal_sections')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', sectionId)

  if (error) return { success: false, error: error.message }

  // Audit log (immutable)
  await supabase.from('audit_logs').insert({
    action: 'update_section_content',
    user_id: user.id,
    resource_type: 'proposal_section',
    resource_id: sectionId,
    details: { content_length: content.length },
  })

  // Activity log (user-visible)
  await supabase.from('activity_log').insert({
    action: 'update_section_content',
    user_name: user.email ?? 'Unknown',
    details: {
      entity_type: 'proposal_section',
      entity_id: sectionId,
      opportunity_id: opportunityId,
    },
  })

  revalidatePath(`/pipeline/${opportunityId}/sections/${sectionId}`)
  revalidatePath(`/pipeline/${opportunityId}/swimlane`)
  return { success: true }
}
