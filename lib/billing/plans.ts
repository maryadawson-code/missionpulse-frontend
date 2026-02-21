/**
 * Subscription Plans — Read plan definitions, check feature access.
 *
 * Amendment A-1: $149/$499/$2,500 monthly pricing
 * Amendment A-2: 17% annual discount
 * Amendment A-3: annual_price column
 */
'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Types ───────────────────────────────────────────────────

export interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  monthly_price: number
  annual_price: number
  monthly_token_limit: number
  overage_rate_per_mtok: number
  max_users: number
  max_opportunities: number
  features: PlanFeatures
  stripe_monthly_price_id: string | null
  stripe_annual_price_id: string | null
  display_order: number
  is_active: boolean
}

export interface PlanFeatures {
  ai_chat: boolean
  playbook: boolean
  document_gen: boolean
  integrations: boolean
  fine_tuning: boolean
  knowledge_graph: boolean
  priority_support?: boolean
  custom_models?: boolean
}

export interface CompanySubscription {
  id: string
  company_id: string
  plan_id: string
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'pilot' | 'expired'
  billing_interval: 'monthly' | 'annual'
  current_period_start: string
  current_period_end: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  auto_overage_enabled: boolean
  pilot_start_date?: string | null
  pilot_end_date?: string | null
  pilot_amount_cents?: number | null
  pilot_converted?: boolean
  plan?: SubscriptionPlan
}

// ─── Plan Queries ────────────────────────────────────────────

/**
 * Get all active subscription plans, ordered by display_order.
 */
export async function getPlans(): Promise<SubscriptionPlan[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('display_order')

  if (error || !data) return []

  return data.map(mapPlan)
}

/**
 * Get a single plan by slug.
 */
export async function getPlanBySlug(
  slug: string
): Promise<SubscriptionPlan | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) return null
  return mapPlan(data)
}

/**
 * Get the current company's subscription with plan details.
 */
export async function getCompanySubscription(
  companyId: string
): Promise<CompanySubscription | null> {
  const supabase = await createClient()

  const { data: sub, error } = await supabase
    .from('company_subscriptions')
    .select('*')
    .eq('company_id', companyId)
    .single()

  if (error || !sub) return null

  const plan = await getPlanById(sub.plan_id as string)

  return {
    id: sub.id as string,
    company_id: sub.company_id as string,
    plan_id: sub.plan_id as string,
    status: sub.status as CompanySubscription['status'],
    billing_interval: sub.billing_interval as CompanySubscription['billing_interval'],
    current_period_start: sub.current_period_start as string,
    current_period_end: sub.current_period_end as string,
    stripe_subscription_id: (sub.stripe_subscription_id as string) ?? null,
    stripe_customer_id: (sub.stripe_customer_id as string) ?? null,
    auto_overage_enabled: (sub.auto_overage_enabled as boolean) ?? false,
    plan: plan ?? undefined,
  }
}

/**
 * Check if a company has access to a specific feature.
 */
export async function hasFeatureAccess(
  companyId: string,
  feature: keyof PlanFeatures
): Promise<boolean> {
  const sub = await getCompanySubscription(companyId)
  if (!sub?.plan) return false
  return sub.plan.features[feature] === true
}

/**
 * Create or update a company's subscription.
 */
export async function upsertCompanySubscription(params: {
  company_id: string
  plan_id: string
  billing_interval: 'monthly' | 'annual'
  stripe_subscription_id?: string
  stripe_customer_id?: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('company_subscriptions')
    .upsert(
      {
        company_id: params.company_id,
        plan_id: params.plan_id,
        billing_interval: params.billing_interval,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(
          Date.now() +
            (params.billing_interval === 'annual'
              ? 365 * 24 * 60 * 60 * 1000
              : 30 * 24 * 60 * 60 * 1000)
        ).toISOString(),
        stripe_subscription_id: params.stripe_subscription_id ?? null,
        stripe_customer_id: params.stripe_customer_id ?? null,
      },
      { onConflict: 'company_id' }
    )

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ─── Helpers ─────────────────────────────────────────────────

async function getPlanById(planId: string): Promise<SubscriptionPlan | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .single()

  if (error || !data) return null
  return mapPlan(data)
}

function mapPlan(row: Record<string, unknown>): SubscriptionPlan {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    monthly_price: Number(row.monthly_price),
    annual_price: Number(row.annual_price),
    monthly_token_limit: Number(row.monthly_token_limit),
    overage_rate_per_mtok: Number(row.overage_rate_per_mtok),
    max_users: Number(row.max_users),
    max_opportunities: Number(row.max_opportunities),
    features: (row.features ?? {}) as PlanFeatures,
    stripe_monthly_price_id: (row.stripe_monthly_price_id as string) ?? null,
    stripe_annual_price_id: (row.stripe_annual_price_id as string) ?? null,
    display_order: Number(row.display_order),
    is_active: row.is_active as boolean,
  }
}
