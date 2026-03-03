/**
 * Pilot Management — Create, convert, expire, and query pilot subscriptions.
 *
 * Pilots are 30-day paid engagements at 50% of annual price.
 * On conversion the pilot payment is credited toward the annual subscription.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { getOrCreateCustomer } from './stripe'
import { getPlanBySlug, getCompanySubscription } from './plans'
import type { Json } from '@/lib/supabase/database.types'

// ─── Pricing Constants ──────────────────────────────────────

const ANNUAL_PRICES_CENTS: Record<string, number> = {
  starter: 148_800,
  professional: 498_000,
  enterprise: 2_499_600,
}

function pilotPriceCents(planSlug: string): number {
  const annual = ANNUAL_PRICES_CENTS[planSlug]
  if (!annual) return 0
  return Math.round(annual / 2)
}

// ─── Types ──────────────────────────────────────────────────

export interface PilotResult {
  success: boolean
  pilotId: string | null
  pilotAmountCents: number
  pilotStartDate: string
  pilotEndDate: string
  error?: string
}

export interface ConversionResult {
  success: boolean
  stripeSubscriptionId: string | null
  creditAppliedCents: number
  error?: string
}

export interface PilotStatus {
  status: 'pilot' | 'pilot_converting' | 'pilot_expired' | 'active' | 'none'
  daysRemaining: number
  engagementScore: number
  pilotCreditCents: number
  pilotStartDate: string | null
  pilotEndDate: string | null
  planSlug: string | null
}

// ─── Core Functions ─────────────────────────────────────────

/**
 * Create a new 30-day pilot for a company.
 */
export async function createPilot(
  companyId: string,
  planTier: string,
  kpis: Record<string, unknown>
): Promise<PilotResult> {
  const supabase = createClient()

  const plan = await getPlanBySlug(planTier)
  if (!plan) {
    return {
      success: false,
      pilotId: null,
      pilotAmountCents: 0,
      pilotStartDate: '',
      pilotEndDate: '',
      error: `Plan "${planTier}" not found`,
    }
  }

  const amountCents = pilotPriceCents(planTier)
  const now = new Date()
  const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  // Upsert subscription as pilot
  const { data: sub, error } = await supabase
    .from('company_subscriptions')
    .upsert(
      {
        company_id: companyId,
        plan_id: plan.id,
        status: 'pilot',
        billing_interval: 'monthly',
        current_period_start: now.toISOString(),
        current_period_end: endDate.toISOString(),
        pilot_start_date: now.toISOString(),
        pilot_end_date: endDate.toISOString(),
        pilot_amount_cents: amountCents,
        pilot_converted: false,
        pilot_credit_applied: false,
        pilot_kpi: kpis as unknown as Json,
        metadata: { plan_tier: planTier } as unknown as Json,
      },
      { onConflict: 'company_id' }
    )
    .select('id')
    .single()

  if (error) {
    return {
      success: false,
      pilotId: null,
      pilotAmountCents: amountCents,
      pilotStartDate: now.toISOString(),
      pilotEndDate: endDate.toISOString(),
      error: error.message,
    }
  }

  // Log to audit_logs
  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase.from('audit_logs').insert({
    action: 'pilot_created',
    user_id: user?.id ?? '00000000-0000-0000-0000-000000000000',
    company_id: companyId,
    table_name: 'company_subscriptions',
    record_id: sub?.id ?? companyId,
    new_values: {
      plan_tier: planTier,
      amount_cents: amountCents,
      kpis,
    } as unknown as Json,
  })

  return {
    success: true,
    pilotId: sub?.id ?? null,
    pilotAmountCents: amountCents,
    pilotStartDate: now.toISOString(),
    pilotEndDate: endDate.toISOString(),
  }
}

/**
 * Convert a pilot to an annual subscription with pilot credit.
 */
export async function convertPilot(
  companyId: string
): Promise<ConversionResult> {
  const supabase = createClient()

  const sub = await getCompanySubscription(companyId)
  if (!sub || sub.status !== 'pilot') {
    return {
      success: false,
      stripeSubscriptionId: null,
      creditAppliedCents: 0,
      error: 'No active pilot found for this company',
    }
  }

  const creditCents = sub.pilot_amount_cents ?? 0

  // Get company info for Stripe customer
  const { data: company } = await supabase
    .from('companies')
    .select('id, name, stripe_customer_id')
    .eq('id', companyId)
    .single()

  if (!company) {
    return {
      success: false,
      stripeSubscriptionId: null,
      creditAppliedCents: 0,
      error: 'Company not found',
    }
  }

  // Ensure Stripe customer exists
  const customerId = await getOrCreateCustomer({
    company_id: companyId,
    company_name: company.name,
    email: `billing@${company.name.toLowerCase().replace(/\s+/g, '')}.com`,
    existing_customer_id: company.stripe_customer_id,
  })

  // Update subscription to active annual
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
      pilot_credit_applied: true,
      stripe_customer_id: customerId,
    })
    .eq('company_id', companyId)

  if (error) {
    return {
      success: false,
      stripeSubscriptionId: null,
      creditAppliedCents: 0,
      error: error.message,
    }
  }

  // Update companies table too
  await supabase
    .from('companies')
    .update({
      stripe_customer_id: customerId,
      subscription_tier: sub.plan?.slug ?? 'starter',
    })
    .eq('id', companyId)

  // Audit log
  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase.from('audit_logs').insert({
    action: 'pilot_converted',
    user_id: user?.id ?? '00000000-0000-0000-0000-000000000000',
    company_id: companyId,
    table_name: 'company_subscriptions',
    record_id: companyId,
    new_values: {
      credit_applied_cents: creditCents,
      new_status: 'active',
      billing_interval: 'annual',
    } as unknown as Json,
  })

  return {
    success: true,
    stripeSubscriptionId: sub.stripe_subscription_id ?? null,
    creditAppliedCents: creditCents,
  }
}

/**
 * Expire a pilot — disables AI features but preserves data for 30 days.
 */
export async function expirePilot(companyId: string): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('company_subscriptions')
    .update({
      status: 'expired',
      metadata: { ai_disabled: true, expired_at: new Date().toISOString() } as unknown as Json,
    })
    .eq('company_id', companyId)
    .eq('status', 'pilot')

  // Audit log
  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase.from('audit_logs').insert({
    action: 'pilot_expired',
    user_id: user?.id ?? '00000000-0000-0000-0000-000000000000',
    company_id: companyId,
    table_name: 'company_subscriptions',
    record_id: companyId,
    new_values: { status: 'expired' } as unknown as Json,
  })
}

/**
 * Get pilot status for a company.
 */
export async function getPilotStatus(
  companyId: string
): Promise<PilotStatus> {
  const sub = await getCompanySubscription(companyId)

  if (!sub) {
    return {
      status: 'none',
      daysRemaining: 0,
      engagementScore: 0,
      pilotCreditCents: 0,
      pilotStartDate: null,
      pilotEndDate: null,
      planSlug: null,
    }
  }

  const isPilot = sub.status === 'pilot'
  const isExpired = sub.status === 'expired'

  let daysRemaining = 0
  if (isPilot && sub.pilot_end_date) {
    const endMs = new Date(sub.pilot_end_date).getTime()
    const nowMs = Date.now()
    daysRemaining = Math.max(0, Math.ceil((endMs - nowMs) / (24 * 60 * 60 * 1000)))
  }

  let status: PilotStatus['status'] = 'none'
  if (isPilot) status = 'pilot'
  else if (isExpired) status = 'pilot_expired'
  else if (sub.status === 'active') status = 'active'

  return {
    status,
    daysRemaining,
    engagementScore: 0, // Placeholder — wired in T-GTM-2.2
    pilotCreditCents: sub.pilot_amount_cents ?? 0,
    pilotStartDate: sub.pilot_start_date ?? null,
    pilotEndDate: sub.pilot_end_date ?? null,
    planSlug: sub.plan?.slug ?? null,
  }
}

/**
 * List all active pilots (for admin view).
 */
export async function listPilots(): Promise<
  Array<{
    companyId: string
    companyName: string
    planTier: string
    pilotStartDate: string | null
    pilotEndDate: string | null
    daysRemaining: number
    status: string
    pilotAmountCents: number
    engagementScore: number
  }>
> {
  const supabase = createClient()

  const { data: subs } = await supabase
    .from('company_subscriptions')
    .select('company_id, plan_id, status, pilot_start_date, pilot_end_date, pilot_amount_cents, metadata')
    .in('status', ['pilot', 'expired'])
    .order('pilot_start_date', { ascending: false })

  if (!subs || subs.length === 0) return []

  // Get company names
  const companyIds = subs.map((s) => s.company_id)
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .in('id', companyIds)

  const companyMap: Record<string, string> = {}
  for (const c of companies ?? []) {
    companyMap[c.id] = c.name
  }

  // Get plan slugs
  const planIds = Array.from(new Set(subs.map((s) => s.plan_id)))
  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('id, slug')
    .in('id', planIds)

  const planMap: Record<string, string> = {}
  for (const p of plans ?? []) {
    planMap[p.id] = p.slug
  }

  const now = Date.now()

  return subs.map((s) => {
    let daysRemaining = 0
    if (s.status === 'pilot' && s.pilot_end_date) {
      daysRemaining = Math.max(
        0,
        Math.ceil((new Date(s.pilot_end_date).getTime() - now) / (24 * 60 * 60 * 1000))
      )
    }

    const meta = (s.metadata ?? {}) as Record<string, unknown>

    return {
      companyId: s.company_id,
      companyName: companyMap[s.company_id] ?? 'Unknown',
      planTier: planMap[s.plan_id] ?? 'unknown',
      pilotStartDate: s.pilot_start_date,
      pilotEndDate: s.pilot_end_date,
      daysRemaining,
      status: s.status,
      pilotAmountCents: s.pilot_amount_cents ?? 0,
      engagementScore: typeof meta.engagement_score === 'number' ? meta.engagement_score : 0,
    }
  })
}
