// filepath: app/(dashboard)/pipeline/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types'
import type { Database } from '@/lib/supabase/database.types'

type OpportunityInsert = Database['public']['Tables']['opportunities']['Insert']
type OpportunityUpdate = Database['public']['Tables']['opportunities']['Update']

// ─── Create Opportunity ─────────────────────────────────────────
export async function actionCreateOpportunity(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Resolve company_id from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  const ceilingRaw = formData.get('ceiling')
  const pwinRaw = formData.get('pwin')

  const insertData: OpportunityInsert = {
    title: formData.get('title') as string,
    agency: (formData.get('agency') as string) || null,
    description: (formData.get('description') as string) || null,
    ceiling: ceilingRaw ? Number(ceilingRaw) : null,
    pwin: pwinRaw ? Number(pwinRaw) : null,
    phase: (formData.get('phase') as string) || null,
    status: (formData.get('status') as string) || 'active',
    due_date: (formData.get('due_date') as string) || null,
    submission_date: (formData.get('submission_date') as string) || null,
    set_aside: (formData.get('set_aside') as string) || null,
    naics_code: (formData.get('naics_code') as string) || null,
    contract_vehicle: (formData.get('contract_vehicle') as string) || null,
    contact_name: (formData.get('contact_name') as string) || null,
    contact_email: (formData.get('contact_email') as string) || null,
    incumbent: (formData.get('incumbent') as string) || null,
    place_of_performance: (formData.get('place_of_performance') as string) || null,
    owner_id: user.id,
    company_id: profile?.company_id ?? null,
  }

  const { data, error } = await supabase
    .from('opportunities')
    .insert(insertData)
    .select('id')
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // Log activity (activity_log table — schema: action, user_name, user_role, details, ip_address)
  const { data: actorProfile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  await supabase.from('activity_log').insert({
    action: 'create_opportunity',
    user_name: actorProfile?.full_name ?? user.email ?? 'Unknown',
    user_role: actorProfile?.role ?? 'unknown',
    details: { entity_type: 'opportunity', entity_id: data.id, title: insertData.title },
  })

  revalidatePath('/')
  revalidatePath('/pipeline')
  redirect(`/pipeline/${data.id}`)
}

// ─── Update Opportunity ─────────────────────────────────────────
export async function actionUpdateOpportunity(
  opportunityId: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const ceilingRaw = formData.get('ceiling')
  const pwinRaw = formData.get('pwin')

  const updateData: OpportunityUpdate = {
    title: formData.get('title') as string,
    agency: (formData.get('agency') as string) || null,
    description: (formData.get('description') as string) || null,
    ceiling: ceilingRaw ? Number(ceilingRaw) : null,
    pwin: pwinRaw ? Number(pwinRaw) : null,
    phase: (formData.get('phase') as string) || null,
    status: (formData.get('status') as string) || null,
    due_date: (formData.get('due_date') as string) || null,
    submission_date: (formData.get('submission_date') as string) || null,
    set_aside: (formData.get('set_aside') as string) || null,
    naics_code: (formData.get('naics_code') as string) || null,
    contract_vehicle: (formData.get('contract_vehicle') as string) || null,
    contact_name: (formData.get('contact_name') as string) || null,
    contact_email: (formData.get('contact_email') as string) || null,
    incumbent: (formData.get('incumbent') as string) || null,
    place_of_performance: (formData.get('place_of_performance') as string) || null,
  }

  const { error } = await supabase
    .from('opportunities')
    .update(updateData)
    .eq('id', opportunityId)

  if (error) {
    return { success: false, error: error.message }
  }

  // Log activity
  const { data: actorProfile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  await supabase.from('activity_log').insert({
    action: 'update_opportunity',
    user_name: actorProfile?.full_name ?? user.email ?? 'Unknown',
    user_role: actorProfile?.role ?? 'unknown',
    details: { entity_type: 'opportunity', entity_id: opportunityId, title: updateData.title },
  })

  revalidatePath('/')
  revalidatePath('/pipeline')
  revalidatePath(`/pipeline/${opportunityId}`)

  return { success: true }
}

// ─── Delete Opportunity ─────────────────────────────────────────
export async function actionDeleteOpportunity(
  opportunityId: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Fetch title for audit log before delete
  const { data: existing } = await supabase
    .from('opportunities')
    .select('title')
    .eq('id', opportunityId)
    .single()

  const { error } = await supabase
    .from('opportunities')
    .delete()
    .eq('id', opportunityId)

  if (error) {
    return { success: false, error: error.message }
  }

  // Log activity
  const { data: actorProfile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  await supabase.from('activity_log').insert({
    action: 'delete_opportunity',
    user_name: actorProfile?.full_name ?? user.email ?? 'Unknown',
    user_role: actorProfile?.role ?? 'unknown',
    details: { entity_type: 'opportunity', entity_id: opportunityId, title: existing?.title ?? 'Unknown' },
  })

  revalidatePath('/')
  revalidatePath('/pipeline')
  redirect('/pipeline')
}
