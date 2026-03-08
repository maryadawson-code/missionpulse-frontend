/**
 * POST /api/billing/checkout — Create Stripe Checkout session for plan subscription.
 *
 * Accepts { priceId, tier, interval? } from authenticated users with billing permission.
 * Returns { url } pointing to Stripe Checkout.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateCustomer, createSubscriptionCheckout } from '@/lib/billing/stripe'

const VALID_TIERS = ['starter', 'professional', 'enterprise'] as const

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  let body: { priceId?: string; tier?: string; interval?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { priceId, tier, interval } = body

  if (!priceId || typeof priceId !== 'string') {
    return NextResponse.json({ error: 'priceId is required' }, { status: 400 })
  }

  if (!tier || !VALID_TIERS.includes(tier as typeof VALID_TIERS[number])) {
    return NextResponse.json(
      { error: 'tier must be one of: starter, professional, enterprise' },
      { status: 400 }
    )
  }

  // Get user profile + company
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) {
    return NextResponse.json({ error: 'No company associated' }, { status: 400 })
  }

  // Get company details for Stripe customer
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', profile.company_id)
    .single()

  // Check for existing Stripe customer
  const { data: existingSub } = await supabase
    .from('company_subscriptions')
    .select('stripe_customer_id')
    .eq('company_id', profile.company_id)
    .single()

  try {
    const customerId = await getOrCreateCustomer({
      company_id: profile.company_id,
      company_name: (company?.name as string) ?? 'Unknown',
      email: user.email ?? '',
      existing_customer_id: (existingSub?.stripe_customer_id as string) ?? null,
    })

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      'http://localhost:3000'

    const { url } = await createSubscriptionCheckout({
      customer_id: customerId,
      price_id: priceId,
      company_id: profile.company_id,
      success_url: `${baseUrl}/settings/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/settings/billing`,
    })

    if (!url) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
    }

    // Store customer ID if new
    if (!existingSub?.stripe_customer_id) {
      await supabase
        .from('company_subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('company_id', profile.company_id)
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'checkout_session_created',
      table_name: 'company_subscriptions',
      record_id: profile.company_id,
      new_values: JSON.parse(JSON.stringify({
        tier,
        interval: interval ?? 'monthly',
        price_id: priceId,
      })),
    })

    return NextResponse.json({ url })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Checkout failed' },
      { status: 500 }
    )
  }
}
