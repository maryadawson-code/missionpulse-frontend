/**
 * Checkout Actions — Server actions for billing flows.
 *
 * Plan upgrade, token pack purchase, auto-overage toggle.
 * RBAC: Only executive roles can purchase/upgrade.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { resolveRole } from '@/lib/rbac/config'
import {
  getOrCreateCustomer,
  createSubscriptionCheckout,
  createTokenPackCheckout,
} from './stripe'
import { getCompanySubscription, getPlanBySlug } from './plans'

// ─── Token Pack Definitions ──────────────────────────────────

export const TOKEN_PACKS = [
  { id: 'pack-500k', tokens: 500_000, price_cents: 5000, label: '500K', savings: null },
  { id: 'pack-1m', tokens: 1_000_000, price_cents: 9000, label: '1M', savings: '10% savings' },
  { id: 'pack-5m', tokens: 5_000_000, price_cents: 40000, label: '5M', savings: '20% savings' },
] as const

// ─── Plan Upgrade ────────────────────────────────────────────

/**
 * Initiate a plan upgrade via Stripe Checkout.
 */
export async function initiatePlanUpgrade(
  targetPlanSlug: string,
  billingInterval: 'monthly' | 'annual'
): Promise<{ url: string | null; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { url: null, error: 'Not authenticated' }

  // RBAC check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!['executive', 'admin', 'CEO', 'COO'].includes(role)) {
    return { url: null, error: 'Only executives can upgrade plans' }
  }

  const companyId = profile?.company_id
  if (!companyId) return { url: null, error: 'No company associated' }

  // Get target plan
  const plan = await getPlanBySlug(targetPlanSlug)
  if (!plan) return { url: null, error: 'Plan not found' }

  const priceId = billingInterval === 'annual'
    ? plan.stripe_annual_price_id
    : plan.stripe_monthly_price_id

  if (!priceId) return { url: null, error: 'Stripe price not configured for this plan' }

  // Get or create Stripe customer
  const sub = await getCompanySubscription(companyId)
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single()

  const customerId = await getOrCreateCustomer({
    company_id: companyId,
    company_name: company?.name ?? 'Unknown',
    email: user.email ?? '',
    existing_customer_id: sub?.stripe_customer_id,
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://missionpulse.io'

  const result = await createSubscriptionCheckout({
    customer_id: customerId,
    price_id: priceId,
    company_id: companyId,
    success_url: `${baseUrl}/settings/billing?success=true`,
    cancel_url: `${baseUrl}/settings/billing?canceled=true`,
  })

  return result
}

// ─── Token Pack Purchase ─────────────────────────────────────

/**
 * Initiate a token pack purchase via Stripe Checkout.
 */
export async function purchaseTokenPack(
  packId: string
): Promise<{ url: string | null; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { url: null, error: 'Not authenticated' }

  // RBAC check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!['executive', 'admin', 'CEO', 'COO'].includes(role)) {
    return { url: null, error: 'Only executives can purchase tokens' }
  }

  const companyId = profile?.company_id
  if (!companyId) return { url: null, error: 'No company associated' }

  // Find pack
  const pack = TOKEN_PACKS.find((p) => p.id === packId)
  if (!pack) return { url: null, error: 'Invalid token pack' }

  // Get or create Stripe customer
  const sub = await getCompanySubscription(companyId)
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single()

  const customerId = await getOrCreateCustomer({
    company_id: companyId,
    company_name: company?.name ?? 'Unknown',
    email: user.email ?? '',
    existing_customer_id: sub?.stripe_customer_id,
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://missionpulse.io'

  const result = await createTokenPackCheckout({
    customer_id: customerId,
    company_id: companyId,
    token_amount: pack.tokens,
    price_cents: pack.price_cents,
    success_url: `${baseUrl}/settings/billing?tokens_purchased=true`,
    cancel_url: `${baseUrl}/settings/billing?canceled=true`,
  })

  return result
}

// ─── Auto-Overage Toggle ─────────────────────────────────────

/**
 * Toggle auto-overage billing for enterprise plans.
 */
export async function toggleAutoOverage(
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!['executive', 'admin', 'CEO', 'COO'].includes(role)) {
    return { success: false, error: 'Only executives can toggle auto-overage' }
  }

  const companyId = profile?.company_id
  if (!companyId) return { success: false, error: 'No company associated' }

  const { error } = await supabase
    .from('company_subscriptions')
    .update({ auto_overage_enabled: enabled })
    .eq('company_id', companyId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
