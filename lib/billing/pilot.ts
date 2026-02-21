/**
 * Pilot Subscription Management — 30-day pilots at 50% of annual price.
 *
 * - Pilot pricing: 50% of annual rate
 * - Duration: 30 days
 * - Token allocation: same as plan tier (no reduction)
 * - Auto-expire after 30 days → status 'expired'
 * - Conversion: pilot amount credited against first annual payment
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { resolveRole } from '@/lib/rbac/config'
import { getPlans, getCompanySubscription } from './plans'
import type { SubscriptionPlan } from './plans'

// ─── Types ──────────────────────────────────────────────────

export interface PilotInfo {
  companyId: string
  companyName: string
  planName: string
  planSlug: string
  status: 'pilot' | 'expired' | 'converted'
  daysRemaining: number
  startDate: string
  endDate: string
  amountPaidCents: number
  tokenUsagePercent: number
  engagementScore: number
  converted: boolean
}

// ─── Pilot Actions ──────────────────────────────────────────

/**
 * Start a pilot subscription for a company.
 * Price: 50% of the annual plan price.
 */
export async function startPilot(
  companyId: string,
  planSlug: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // RBAC: executives only
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!['executive', 'admin', 'CEO', 'COO'].includes(role)) {
    return { success: false, error: 'Only executives can start pilots' }
  }

  // Check no existing active subscription
  const existing = await getCompanySubscription(companyId)
  if (existing && ['active', 'pilot'].includes(existing.status)) {
    return { success: false, error: 'Company already has an active subscription or pilot' }
  }

  // Get plan
  const plans = await getPlans()
  const plan = plans.find((p) => p.slug === planSlug)
  if (!plan) return { success: false, error: 'Plan not found' }

  // Calculate pilot price: 50% of annual
  const pilotAmountCents = Math.round(plan.annual_price * 100 * 0.5)

  const now = new Date()
  const pilotEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const { error } = await supabase.from('company_subscriptions').upsert(
    {
      company_id: companyId,
      plan_id: plan.id,
      status: 'pilot',
      billing_interval: 'annual',
      current_period_start: now.toISOString(),
      current_period_end: pilotEnd.toISOString(),
      pilot_start_date: now.toISOString(),
      pilot_end_date: pilotEnd.toISOString(),
      pilot_amount_cents: pilotAmountCents,
      pilot_converted: false,
      metadata: JSON.parse(JSON.stringify({ engagement_score: 0, onboarding_progress: 0 })),
    },
    { onConflict: 'company_id' }
  )

  if (error) return { success: false, error: error.message }

  // Create token ledger entry for pilot period
  await supabase.from('token_ledger').insert({
    company_id: companyId,
    period_start: now.toISOString(),
    period_end: pilotEnd.toISOString(),
    tokens_allocated: plan.monthly_token_limit,
    tokens_consumed: 0,
    tokens_purchased: 0,
    overage_tokens_used: 0,
  })

  return { success: true }
}

/**
 * Expire a pilot subscription. Called by cron or manual action.
 */
export async function expirePilot(
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('company_subscriptions')
    .update({ status: 'expired' })
    .eq('company_id', companyId)
    .eq('status', 'pilot')

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Convert a pilot to paid annual subscription.
 * The pilot amount is credited against the first annual payment.
 */
export async function convertPilot(
  companyId: string
): Promise<{ success: boolean; creditCents: number; error?: string }> {
  const sub = await getCompanySubscription(companyId)
  if (!sub) return { success: false, creditCents: 0, error: 'No subscription found' }

  const supabase = await createClient()

  // Get pilot amount for credit
  const { data: rawSub } = await supabase
    .from('company_subscriptions')
    .select('pilot_amount_cents')
    .eq('company_id', companyId)
    .single()

  const creditCents = (rawSub?.pilot_amount_cents as number) ?? 0

  const now = new Date()
  const annualEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)

  const { error } = await supabase
    .from('company_subscriptions')
    .update({
      status: 'active',
      billing_interval: 'annual',
      current_period_start: now.toISOString(),
      current_period_end: annualEnd.toISOString(),
      pilot_converted: true,
    })
    .eq('company_id', companyId)

  if (error) return { success: false, creditCents: 0, error: error.message }
  return { success: true, creditCents }
}

/**
 * Extend a pilot by 7 days (one-time extension).
 */
export async function extendPilot(
  companyId: string
): Promise<{ success: boolean; newEndDate?: string; error?: string }> {
  const supabase = await createClient()

  const { data: sub } = await supabase
    .from('company_subscriptions')
    .select('pilot_end_date, metadata')
    .eq('company_id', companyId)
    .eq('status', 'pilot')
    .single()

  if (!sub) return { success: false, error: 'No active pilot found' }

  const meta = (sub.metadata as Record<string, unknown>) ?? {}
  if (meta.extended) {
    return { success: false, error: 'Pilot already extended (one-time only)' }
  }

  const currentEnd = new Date(sub.pilot_end_date as string)
  const newEnd = new Date(currentEnd.getTime() + 7 * 24 * 60 * 60 * 1000)

  const { error } = await supabase
    .from('company_subscriptions')
    .update({
      pilot_end_date: newEnd.toISOString(),
      current_period_end: newEnd.toISOString(),
      metadata: JSON.parse(JSON.stringify({ ...meta, extended: true })),
    })
    .eq('company_id', companyId)
    .eq('status', 'pilot')

  if (error) return { success: false, error: error.message }
  return { success: true, newEndDate: newEnd.toISOString() }
}

/**
 * Get all active pilots with details for admin view.
 */
export async function getActivePilots(): Promise<PilotInfo[]> {
  const supabase = await createClient()

  const { data: subs } = await supabase
    .from('company_subscriptions')
    .select('*')
    .in('status', ['pilot', 'expired'])
    .order('pilot_end_date', { ascending: true })

  if (!subs || subs.length === 0) return []

  const plans = await getPlans()
  const planMap = new Map<string, SubscriptionPlan>()
  for (const p of plans) planMap.set(p.id, p)

  const now = Date.now()

  const results: PilotInfo[] = []

  for (const sub of subs) {
    const companyId = sub.company_id as string
    const plan = planMap.get(sub.plan_id as string)
    const endDate = new Date(sub.pilot_end_date as string)
    const meta = (sub.metadata as Record<string, unknown>) ?? {}

    // Get company name
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single()

    // Get token usage
    const { data: ledger } = await supabase
      .from('token_ledger')
      .select('tokens_allocated, tokens_consumed')
      .eq('company_id', companyId)
      .order('period_start', { ascending: false })
      .limit(1)
      .single()

    const allocated = Number(ledger?.tokens_allocated ?? 0)
    const consumed = Number(ledger?.tokens_consumed ?? 0)
    const tokenPct = allocated > 0 ? Math.round((consumed / allocated) * 100) : 0

    const daysRemaining = Math.max(
      0,
      Math.ceil((endDate.getTime() - now) / (24 * 60 * 60 * 1000))
    )

    const status =
      sub.pilot_converted === true
        ? 'converted' as const
        : sub.status === 'expired'
          ? 'expired' as const
          : 'pilot' as const

    results.push({
      companyId,
      companyName: company?.name ?? 'Unknown',
      planName: plan?.name ?? 'Unknown',
      planSlug: plan?.slug ?? '',
      status,
      daysRemaining,
      startDate: sub.pilot_start_date as string,
      endDate: sub.pilot_end_date as string,
      amountPaidCents: (sub.pilot_amount_cents as number) ?? 0,
      tokenUsagePercent: tokenPct,
      engagementScore: Number(meta.engagement_score ?? 0),
      converted: sub.pilot_converted === true,
    })
  }

  return results
}

/**
 * Auto-expire all pilots past their end date.
 * Called by Edge Function cron job.
 */
export async function expireOverduePilots(): Promise<number> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data } = await supabase
    .from('company_subscriptions')
    .update({ status: 'expired' })
    .eq('status', 'pilot')
    .lt('pilot_end_date', now)
    .select('id')

  return data?.length ?? 0
}
