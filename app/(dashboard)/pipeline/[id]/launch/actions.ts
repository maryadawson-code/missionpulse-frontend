'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function recordGateDecision(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const opportunityId = formData.get('opportunityId') as string
  const gateName = formData.get('gateName') as string
  const gateNumber = Number(formData.get('gateNumber') ?? 1)
  const decision = formData.get('decision') as string
  const conditionsRaw = formData.get('conditions') as string

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  // Get current pWin
  const { data: opp } = await supabase
    .from('opportunities')
    .select('pwin')
    .eq('id', opportunityId)
    .single()

  const conditions = conditionsRaw
    ? conditionsRaw.split('\n').map((c) => c.trim()).filter(Boolean)
    : []

  const { error } = await supabase.from('gate_reviews').insert({
    id: crypto.randomUUID(),
    opportunity_id: opportunityId,
    company_id: profile?.company_id ?? null,
    gate_name: gateName,
    gate_number: gateNumber,
    decision,
    conditions,
    pwin_at_gate: opp?.pwin ?? null,
  })

  if (error) return { success: false, error: error.message }

  // Log to audit
  await supabase.from('audit_logs').insert({
    id: crypto.randomUUID(),
    user_id: user.id,
    action: 'gate_decision',
    entity_type: 'opportunity',
    entity_id: opportunityId,
    details: { gate_name: gateName, decision, gate_number: gateNumber },
    created_at: new Date().toISOString(),
  })

  revalidatePath(`/pipeline/${opportunityId}/launch`)
  return { success: true }
}

export async function updateOpportunityStatus(opportunityId: string, status: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('opportunities')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', opportunityId)

  if (error) return { success: false, error: error.message }

  await supabase.from('audit_logs').insert({
    id: crypto.randomUUID(),
    user_id: user.id,
    action: 'status_change',
    entity_type: 'opportunity',
    entity_id: opportunityId,
    details: { new_status: status },
    created_at: new Date().toISOString(),
  })

  revalidatePath(`/pipeline/${opportunityId}/launch`)
  return { success: true }
}
