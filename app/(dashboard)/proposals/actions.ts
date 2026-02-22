'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types'
import { revokeExternalAccess } from '@/lib/actions/external-access'

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

// ─── Proposal Outline CRUD ─────────────────────────────────────

export async function createProposalOutline(
  opportunityId: string,
  outlineName: string,
  volumeType: string
): Promise<ActionResult & { outlineId?: string }> {
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

  const id = crypto.randomUUID()
  const { error } = await supabase.from('proposal_outlines').insert({
    id,
    opportunity_id: opportunityId,
    outline_name: outlineName,
    volume_type: volumeType,
    status: 'draft',
    created_by: user.id,
    company_id: profile?.company_id ?? null,
  })

  if (error) return { success: false, error: error.message }

  await supabase.from('audit_logs').insert({
    id: crypto.randomUUID(),
    user_id: user.id,
    action: 'create_proposal_outline',
    entity_type: 'proposal_outline',
    entity_id: id,
    details: { outline_name: outlineName, opportunity_id: opportunityId },
    created_at: new Date().toISOString(),
  })

  revalidatePath('/proposals')
  return { success: true, outlineId: id }
}

export async function deleteProposalOutline(outlineId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('proposal_outlines')
    .delete()
    .eq('id', outlineId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/proposals')
  return { success: true }
}

// ─── Volume Section CRUD ───────────────────────────────────────

export async function createVolumeSection(
  volumeId: string,
  sectionTitle: string,
  sectionNumber: string,
  pageAllocation: number | null,
  rfpReference: string | null
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase.from('volume_sections').insert({
    id: crypto.randomUUID(),
    volume_id: volumeId,
    section_title: sectionTitle,
    section_number: sectionNumber,
    page_allocation: pageAllocation,
    rfp_reference: rfpReference,
    status: 'draft',
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/proposals')
  return { success: true }
}

// ─── Binder Assembly ───────────────────────────────────────────

export async function assembleBinder(
  opportunityId: string
): Promise<ActionResult & { binderData?: { volume: string; title: string; wordCount: number }[] }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Fetch all proposal sections
  const { data: sections, error } = await supabase
    .from('proposal_sections')
    .select('id, section_title, volume, status, content')
    .eq('opportunity_id', opportunityId)
    .order('volume', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) return { success: false, error: error.message }

  const allSections = sections ?? []
  const nonFinal = allSections.filter((s) => s.status !== 'final')

  if (nonFinal.length > 0) {
    return {
      success: false,
      error: `${nonFinal.length} section(s) not in "final" status. Finalize all sections before assembly.`,
    }
  }

  // Verify compliance requirements
  const { count: unmapped } = await supabase
    .from('compliance_requirements')
    .select('*', { count: 'exact', head: true })
    .eq('opportunity_id', opportunityId)
    .neq('status', 'Verified')

  if ((unmapped ?? 0) > 0) {
    return {
      success: false,
      error: `${unmapped} compliance requirement(s) are not verified.`,
    }
  }

  // Update proposal outline status
  await supabase
    .from('proposal_outlines')
    .update({ status: 'submitted', updated_at: new Date().toISOString() })
    .eq('opportunity_id', opportunityId)

  // Auto-revoke external partner/subcontractor access on submission
  await revokeExternalAccess(opportunityId)

  // Audit log
  await supabase.from('audit_logs').insert({
    id: crypto.randomUUID(),
    user_id: user.id,
    action: 'assemble_binder',
    entity_type: 'opportunity',
    entity_id: opportunityId,
    details: { section_count: allSections.length },
    created_at: new Date().toISOString(),
  })

  revalidatePath(`/pipeline/${opportunityId}/launch`)
  return {
    success: true,
    binderData: allSections.map((s) => ({
      volume: s.volume ?? 'Unassigned',
      title: s.section_title,
      wordCount: (s.content ?? '').split(/\s+/).filter(Boolean).length,
    })),
  }
}

// ─── Section Version Snapshot ──────────────────────────────────

export async function saveSectionVersion(
  sectionId: string,
  content: string,
  statusChange: string | null,
  opportunityId: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  await supabase.from('activity_log').insert({
    action: 'save_section_version',
    user_name: user.email ?? 'Unknown',
    details: {
      entity_type: 'proposal_section',
      entity_id: sectionId,
      opportunity_id: opportunityId,
      status_change: statusChange,
      content_snapshot: content.slice(0, 5000),
      content_length: content.length,
    },
  })

  await supabase.from('audit_logs').insert({
    id: crypto.randomUUID(),
    user_id: user.id,
    action: 'save_section_version',
    entity_type: 'proposal_section',
    entity_id: sectionId,
    details: { status_change: statusChange },
    created_at: new Date().toISOString(),
  })

  revalidatePath(`/pipeline/${opportunityId}/sections/${sectionId}`)
  return { success: true }
}

// ─── Helpers ───────────────────────────────────────────────────

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
