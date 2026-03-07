// filepath: lib/billing/pilot-conversion.ts

/**
 * Pilot-to-Annual Conversion — ROI generation and upgrade flow.
 *
 * Auto-triggered at Day 25: banner + ROI report.
 * One-click upgrade to Stripe Checkout with pilot credit applied.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { getTokenBalance } from './ledger'
import { calculateEngagement } from './engagement'
import { getOrCreateCustomer } from './stripe'
import Stripe from 'stripe'

// ─── Types ──────────────────────────────────────────────────

export interface ROIReport {
  proposalsDrafted: number
  aiQueriesCount: number
  timeSavedHours: number
  complianceItemsTracked: number
  documentsGenerated: number
  teamMembersActive: number
  engagementScore: number
  tokensConsumed: number
  tokensAllocated: number
  daysActive: number
  estimatedManualHours: number
}

export interface PilotStatus {
  isPilot: boolean
  daysRemaining: number
  showBanner: boolean
  showExpiredMessage: boolean
  pilotCreditCents: number
}

// ─── Constants ──────────────────────────────────────────────

const AVG_TIME_SAVED_PER_AI_QUERY_MINUTES = 12
const AVG_MANUAL_HOURS_PER_PROPOSAL = 520

// ─── Functions ──────────────────────────────────────────────

/**
 * Get the pilot status for display in dashboard banner.
 */
export async function getPilotStatus(
  companyId: string
): Promise<PilotStatus> {
  const supabase = await createClient()

  const { data: sub } = await supabase
    .from('company_subscriptions')
    .select('status, pilot_end_date, pilot_amount_cents')
    .eq('company_id', companyId)
    .single()

  if (!sub) {
    return {
      isPilot: false,
      daysRemaining: 0,
      showBanner: false,
      showExpiredMessage: false,
      pilotCreditCents: 0,
    }
  }

  const status = sub.status as string
  const endDate = sub.pilot_end_date
    ? new Date(sub.pilot_end_date as string)
    : null
  const now = Date.now()
  const daysRemaining = endDate
    ? Math.max(0, Math.ceil((endDate.getTime() - now) / (24 * 60 * 60 * 1000)))
    : 0

  return {
    isPilot: status === 'pilot',
    daysRemaining,
    showBanner: status === 'pilot' && daysRemaining <= 5,
    showExpiredMessage: status === 'expired',
    pilotCreditCents: (sub.pilot_amount_cents as number) ?? 0,
  }
}

/**
 * Generate ROI report from actual pilot usage data.
 */
export async function generateROIReport(
  companyId: string
): Promise<ROIReport> {
  const supabase = await createClient()

  const { data: sub } = await supabase
    .from('company_subscriptions')
    .select('pilot_start_date')
    .eq('company_id', companyId)
    .single()

  const startDate = sub?.pilot_start_date
    ? new Date(sub.pilot_start_date as string)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const daysActive = Math.ceil(
    (Date.now() - startDate.getTime()) / (24 * 60 * 60 * 1000)
  )

  // Count proposals created during pilot
  const { count: proposalsDrafted } = await supabase
    .from('opportunities')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .gte('created_at', startDate.toISOString())

  // Count AI queries
  const { count: aiQueriesCount } = await supabase
    .from('token_usage')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startDate.toISOString())

  // Count compliance items
  const { count: complianceItemsTracked } = await supabase
    .from('compliance_requirements')
    .select('id', { count: 'exact', head: true })

  // Count documents
  const { count: documentsGenerated } = await supabase
    .from('company_documents')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .gte('created_at', startDate.toISOString())

  // Count active team members
  const { count: teamMembersActive } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)

  // Get engagement score
  const engagement = await calculateEngagement(companyId)

  // Get token balance
  const balance = await getTokenBalance(companyId)

  const queries = aiQueriesCount ?? 0
  const timeSavedMinutes = queries * AVG_TIME_SAVED_PER_AI_QUERY_MINUTES
  const timeSavedHours = Math.round(timeSavedMinutes / 60)

  const proposals = proposalsDrafted ?? 0
  const estimatedManualHours = proposals * AVG_MANUAL_HOURS_PER_PROPOSAL

  return {
    proposalsDrafted: proposals,
    aiQueriesCount: queries,
    timeSavedHours,
    complianceItemsTracked: complianceItemsTracked ?? 0,
    documentsGenerated: documentsGenerated ?? 0,
    teamMembersActive: teamMembersActive ?? 0,
    engagementScore: engagement.score,
    tokensConsumed: balance?.consumed ?? 0,
    tokensAllocated: balance?.allocated ?? 0,
    daysActive,
    estimatedManualHours,
  }
}

// ─── Conversion Checkout ────────────────────────────────────

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
  return new Stripe(key, { apiVersion: '2026-02-25.clover', typescript: true })
}

/**
 * Create a Stripe Checkout session for pilot-to-annual conversion.
 * Applies the pilot payment as a credit (coupon) on the annual subscription.
 */
export async function createConversionCheckout(params: {
  companyId: string
  companyName: string
  email: string
  successUrl: string
  cancelUrl: string
}): Promise<{ url: string | null; error?: string }> {
  const supabase = await createClient()

  // Get current subscription to find plan and pilot credit
  const { data: sub } = await supabase
    .from('company_subscriptions')
    .select('plan_id, pilot_amount_cents, stripe_customer_id, status')
    .eq('company_id', params.companyId)
    .single()

  if (!sub) return { url: null, error: 'No subscription found' }

  const status = sub.status as string
  if (status !== 'pilot' && status !== 'expired') {
    return { url: null, error: 'Company is not in pilot or expired status' }
  }

  // Get plan for annual price ID
  const planId = sub.plan_id as string
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('slug, stripe_annual_price_id, annual_price')
    .eq('id', planId)
    .single()

  if (!plan?.stripe_annual_price_id) {
    return { url: null, error: 'No annual price configured for plan' }
  }

  // Get or create Stripe customer
  const customerId = await getOrCreateCustomer({
    company_id: params.companyId,
    company_name: params.companyName,
    email: params.email,
    existing_customer_id: (sub.stripe_customer_id as string) ?? undefined,
  })

  const pilotCreditCents = (sub.pilot_amount_cents as number) ?? 0
  const stripe = getStripe()

  // If pilot credit exists, create a one-time coupon
  let discounts: Stripe.Checkout.SessionCreateParams['discounts'] | undefined
  if (pilotCreditCents > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: pilotCreditCents,
      currency: 'usd',
      duration: 'once',
      name: `Pilot credit — ${params.companyName}`,
      max_redemptions: 1,
    })
    discounts = [{ coupon: coupon.id }]
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: plan.stripe_annual_price_id as string, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    discounts,
    metadata: {
      company_id: params.companyId,
      type: 'pilot_conversion',
      pilot_credit_cents: String(pilotCreditCents),
    },
  })

  return { url: session.url }
}

/**
 * Handle successful pilot conversion (called from webhook).
 * Transitions subscription from pilot/expired → active with pilot credit applied.
 */
export async function handleConversionSuccess(params: {
  companyId: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  pilotCreditCents: number
}): Promise<void> {
  const supabase = await createClient()

  const periodEnd = new Date()
  periodEnd.setFullYear(periodEnd.getFullYear() + 1)

  await supabase
    .from('company_subscriptions')
    .update({
      status: 'active',
      billing_interval: 'annual',
      stripe_subscription_id: params.stripeSubscriptionId,
      stripe_customer_id: params.stripeCustomerId,
      pilot_converted: true,
      pilot_credit_applied: params.pilotCreditCents > 0,
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
    })
    .eq('company_id', params.companyId)

  // Update company Stripe fields
  await supabase
    .from('companies')
    .update({
      stripe_customer_id: params.stripeCustomerId,
      stripe_subscription_id: params.stripeSubscriptionId,
      subscription_tier: 'active',
    })
    .eq('id', params.companyId)

  // Audit log
  await supabase.from('audit_logs').insert({
    action: 'pilot_converted',
    user_id: '00000000-0000-0000-0000-000000000000',
    table_name: 'company_subscriptions',
    record_id: params.companyId,
    new_values: {
      pilot_credit_cents: params.pilotCreditCents,
      stripe_subscription_id: params.stripeSubscriptionId,
    },
  })
}
