'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types'

const SECTION_STATUSES = ['draft', 'pink_review', 'revision', 'green_review', 'red_review', 'final'] as const
type SectionStatus = (typeof SECTION_STATUSES)[number]

const VALID_TRANSITIONS: Record<SectionStatus, SectionStatus[]> = {
  draft: ['pink_review'],
  pink_review: ['revision', 'green_review'],
  revision: ['pink_review', 'green_review', 'red_review'],
  green_review: ['revision', 'red_review'],
  red_review: ['revision', 'final'],
  final: [],
}

function isValidStatus(s: string): s is SectionStatus {
  return (SECTION_STATUSES as readonly string[]).includes(s)
}

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

  if (!isValidStatus(status)) {
    return { success: false, error: `Invalid status: ${status}` }
  }

  // Fetch current status for transition validation
  const { data: current } = await supabase
    .from('proposal_sections')
    .select('status')
    .eq('id', sectionId)
    .single()

  const fromStatus = (current?.status ?? 'draft') as string
  const normalizedFrom = isValidStatus(fromStatus) ? fromStatus : 'draft'

  const allowed = VALID_TRANSITIONS[normalizedFrom]
  if (!allowed.includes(status)) {
    return { success: false, error: `Cannot transition from ${normalizedFrom} to ${status}` }
  }

  const { error } = await supabase
    .from('proposal_sections')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', sectionId)

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_log').insert({
    action: 'update_section_status',
    user_name: user.email ?? 'Unknown',
    details: {
      entity_type: 'proposal_section',
      entity_id: sectionId,
      from_status: normalizedFrom,
      new_status: status,
    },
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
