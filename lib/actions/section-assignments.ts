'use server'

import { createClient } from '@/lib/supabase/server'
import { updateSectionAssignmentSchema } from '@/lib/api/schemas'

export async function updateSectionAssignment(
  sectionId: string,
  writerId: string | null,
  reviewerId: string | null,
  opportunityId: string
): Promise<{ success: boolean; error?: string }> {
  // Validate inputs
  const parsed = updateSectionAssignmentSchema.safeParse({
    sectionId,
    writerId,
    reviewerId,
    opportunityId,
  })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const supabase = await createClient()

  const updates: Record<string, string | null> = {}
  if (writerId !== undefined) updates.writer_id = writerId
  if (reviewerId !== undefined) updates.reviewer_id = reviewerId

  const { error } = await supabase
    .from('proposal_sections')
    .update(updates)
    .eq('id', sectionId)

  if (error) {
    return { success: false, error: error.message }
  }

  // Audit log
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? ''
  const userEmail = user?.email ?? 'system'

  await supabase.from('audit_logs').insert({
    action: 'section_assignment_updated',
    table_name: 'proposal_sections',
    record_id: sectionId,
    user_id: userId,
    user_email: userEmail,
    metadata: { writer_id: writerId, reviewer_id: reviewerId, opportunity_id: opportunityId },
  })

  await supabase.from('activity_log').insert({
    action: 'assignment_updated',
    user_name: userEmail,
    details: {
      section_id: sectionId,
      writer_id: writerId,
      reviewer_id: reviewerId,
      opportunity_id: opportunityId,
    },
  })

  return { success: true }
}
