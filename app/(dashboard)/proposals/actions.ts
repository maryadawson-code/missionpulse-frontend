'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types'

export async function approveReviewItem(
  itemId: string,
  itemType: 'compliance' | 'contract' | 'document'
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const table = getTableForType(itemType)
  const statusField = getStatusFieldForType(itemType)

  const { error } = await supabase
    .from(table)
    .update({
      [statusField]: 'Verified',
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_log').insert({
    action: 'approve_review_item',
    user_name: user.email ?? 'Unknown',
    details: {
      entity_type: itemType,
      entity_id: itemId,
      action: 'approved',
    },
  })

  revalidatePath('/proposals')
  return { success: true }
}

export async function rejectReviewItem(
  itemId: string,
  itemType: 'compliance' | 'contract' | 'document',
  reason: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  if (!reason.trim()) {
    return { success: false, error: 'Rejection reason is required' }
  }

  const table = getTableForType(itemType)
  const statusField = getStatusFieldForType(itemType)
  const notesField = getNotesFieldForType(itemType)

  const { error } = await supabase
    .from(table)
    .update({
      [statusField]: 'Not Started',
      [notesField]: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_log').insert({
    action: 'reject_review_item',
    user_name: user.email ?? 'Unknown',
    details: {
      entity_type: itemType,
      entity_id: itemId,
      action: 'rejected',
      reason,
    },
  })

  revalidatePath('/proposals')
  return { success: true }
}

export async function requestChanges(
  itemId: string,
  itemType: 'compliance' | 'contract' | 'document',
  feedback: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const table = getTableForType(itemType)
  const statusField = getStatusFieldForType(itemType)
  const notesField = getNotesFieldForType(itemType)

  const { error } = await supabase
    .from(table)
    .update({
      [statusField]: 'In Progress',
      [notesField]: feedback,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_log').insert({
    action: 'request_changes',
    user_name: user.email ?? 'Unknown',
    details: {
      entity_type: itemType,
      entity_id: itemId,
      action: 'changes_requested',
      feedback,
    },
  })

  revalidatePath('/proposals')
  return { success: true }
}

function getTableForType(type: string): 'compliance_requirements' | 'contract_clauses' | 'documents' {
  switch (type) {
    case 'compliance':
      return 'compliance_requirements'
    case 'contract':
      return 'contract_clauses'
    default:
      return 'documents'
  }
}

function getStatusFieldForType(type: string): string {
  switch (type) {
    case 'contract':
      return 'compliance_status'
    default:
      return 'status'
  }
}

function getNotesFieldForType(_type: string): string {
  return 'notes'
}
