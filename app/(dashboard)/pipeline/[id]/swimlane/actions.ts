'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logNotification } from '@/lib/utils/notifications'
import type { ActionResult } from '@/lib/types'

const SECTION_STATUSES = ['draft', 'pink_review', 'revision', 'green_review', 'red_review', 'final'] as const
type SectionStatus = (typeof SECTION_STATUSES)[number]

const STATUS_LABELS: Record<SectionStatus, string> = {
  draft: 'Draft',
  pink_review: 'Pink Team',
  revision: 'Revision',
  green_review: 'Green Team',
  red_review: 'Red Team',
  final: 'Final',
}

// Strict forward-only transitions. Rejection from any review → revision.
const VALID_TRANSITIONS: Record<SectionStatus, SectionStatus[]> = {
  draft: ['pink_review'],
  pink_review: ['revision'],
  revision: ['green_review'],
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

  // Notify opportunity owner on review/final transitions
  const REVIEW_STATES: SectionStatus[] = ['pink_review', 'green_review', 'red_review', 'final']
  if (REVIEW_STATES.includes(status)) {
    const { data: opp } = await supabase
      .from('opportunities')
      .select('owner_id, title')
      .eq('id', opportunityId)
      .single()

    if (opp?.owner_id && opp.owner_id !== user.id) {
      const label = STATUS_LABELS[status] ?? status
      await logNotification({
        userId: opp.owner_id,
        title: `Section moved to ${label}`,
        message: `A section was moved to ${label} on "${opp.title}" by ${user.email}.`,
        notificationType: 'section_status_change',
        priority: status === 'final' ? 'high' : 'normal',
        linkUrl: `/pipeline/${opportunityId}/swimlane`,
        linkText: 'View Swimlane',
        opportunityId,
      })
    }
  }

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

  await supabase.from('activity_log').insert({
    action: 'assign_section_owner',
    user_name: user.email ?? 'Unknown',
    details: {
      entity_type: 'proposal_section',
      entity_id: sectionId,
      opportunity_id: opportunityId,
      writer_id: writerId,
    },
  })

  revalidatePath(`/pipeline/${opportunityId}/swimlane`)
  return { success: true }
}
