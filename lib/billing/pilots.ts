// filepath: lib/billing/pilots.ts
'use server'

import { createClient } from '@/lib/supabase/server'

export interface PilotCreateParams {
  companyId: string
  planId: string
  pilotKpi: string
  adminNote?: string
}

export interface PilotSummary {
  companyId: string
  companyName: string
  status: string
  daysRemaining: number | null
  engagementScore: number
  pilotEndDate: string | null
  planName: string
}

export async function createPilot(params: PilotCreateParams): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthenticated' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'executive') {
    return { success: false, error: 'Insufficient permissions — executive role required' }
  }

  const { data: plan } = await supabase
    .from('subscription_plans').select('id, name, annual_price').eq('id', params.planId).single()
  if (!plan) return { success: false, error: 'Plan not found' }

  const pilotAmountCents = Math.round((plan.annual_price ?? 0) * 0.5)
  const now = new Date()
  const pilotEnd = new Date(now)
  pilotEnd.setDate(pilotEnd.getDate() + 30)

  const { error: subError } = await supabase
    .from('company_subscriptions')
    .upsert({
      company_id: params.companyId,
      plan_id: params.planId,
      status: 'pilot',
      pilot_start_date: now.toISOString(),
      pilot_end_date: pilotEnd.toISOString(),
      pilot_kpi: params.pilotKpi,
      pilot_amount_cents: pilotAmountCents,
      pilot_credit_applied: false,
      billing_interval: 'pilot',
      updated_at: now.toISOString(),
    }, { onConflict: 'company_id' })
  if (subError) return { success: false, error: subError.message }

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'pilot_created',
    table_name: 'company_subscriptions',
    record_id: params.companyId,
    new_values: { planId: params.planId, pilotAmountCents, pilotKpi: params.pilotKpi },
  })

  await supabase.from('activity_feed').insert({
    company_id: params.companyId,
    user_id: user.id,
    action_type: 'pilot_started',
    entity_type: 'subscription',
    entity_id: params.companyId,
    description: `30-day pilot started on ${plan.name} plan`,
  })

  return { success: true }
}

export async function convertPilotToAnnual(companyId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthenticated' }

  const { data: sub } = await supabase
    .from('company_subscriptions')
    .select('status, pilot_amount_cents, plan_id')
    .eq('company_id', companyId).single()

  if (!sub || !['pilot', 'pilot_expired'].includes(sub.status ?? '')) {
    return { success: false, error: 'No active pilot found for this company' }
  }

  const { error } = await supabase
    .from('company_subscriptions')
    .update({
      status: 'active',
      billing_interval: 'annual',
      pilot_credit_applied: true,
      pilot_converted: true,
      updated_at: new Date().toISOString(),
    })
    .eq('company_id', companyId)
  if (error) return { success: false, error: error.message }

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'pilot_converted',
    table_name: 'company_subscriptions',
    record_id: companyId,
    new_values: { creditApplied: sub.pilot_amount_cents },
  })

  await supabase.from('activity_feed').insert({
    company_id: companyId,
    user_id: user.id,
    action_type: 'pilot_converted',
    entity_type: 'subscription',
    entity_id: companyId,
    description: `Pilot converted to annual — $${((sub.pilot_amount_cents ?? 0) / 100).toFixed(2)} credit applied`,
  })

  return { success: true }
}

export async function expirePilot(companyId: string): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('company_subscriptions')
    .update({ status: 'pilot_expired', updated_at: new Date().toISOString() })
    .eq('company_id', companyId).eq('status', 'pilot')
  await supabase.from('audit_logs').insert({
    user_id: '00000000-0000-0000-0000-000000000000',
    action: 'pilot_expired',
    table_name: 'company_subscriptions',
    record_id: companyId,
    new_values: { reason: 'cron_expiration' },
  })
}

export async function listPilots(): Promise<PilotSummary[]> {
  const supabase = await createClient()

  const { data: subs } = await supabase
    .from('company_subscriptions')
    .select('company_id, status, pilot_end_date, plan_id, companies!inner(name), subscription_plans!inner(name)')
    .in('status', ['pilot', 'pilot_expired'])
    .order('pilot_end_date', { ascending: true })
  if (!subs) return []

  const scores = await Promise.all(
    subs.map(async (s) => {
      const { data } = await supabase
        .from('pilot_engagement_scores')
        .select('score').eq('company_id', s.company_id)
        .order('calculated_at', { ascending: false }).limit(1).single()
      return { companyId: s.company_id, score: data?.score ?? 0 }
    })
  )
  const scoreMap = new Map(scores.map((s) => [s.companyId, s.score]))

  return subs.map((s) => {
    const endDate = s.pilot_end_date ? new Date(s.pilot_end_date) : null
    const daysRemaining = endDate
      ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / 86400000)) : null
    return {
      companyId: s.company_id,
      companyName: (s.companies as unknown as { name: string }).name,
      status: s.status ?? 'unknown',
      daysRemaining,
      engagementScore: scoreMap.get(s.company_id) ?? 0,
      pilotEndDate: s.pilot_end_date,
      planName: (s.subscription_plans as unknown as { name: string }).name,
    }
  })
}
