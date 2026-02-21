/**
 * Stripe SDK Configuration — Server-side only.
 *
 * STRIPE_SECRET_KEY must be in .env.local, never in NEXT_PUBLIC_*.
 */
'use server'

import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance

  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }

  stripeInstance = new Stripe(key, {
    apiVersion: '2026-01-28.clover',
    typescript: true,
  })

  return stripeInstance
}

// ─── Customer Management ─────────────────────────────────────

/**
 * Get or create a Stripe customer for a company.
 */
export async function getOrCreateCustomer(params: {
  company_id: string
  company_name: string
  email: string
  existing_customer_id?: string | null
}): Promise<string> {
  const stripe = getStripe()

  if (params.existing_customer_id) {
    return params.existing_customer_id
  }

  const customer = await stripe.customers.create({
    name: params.company_name,
    email: params.email,
    metadata: { company_id: params.company_id },
  })

  return customer.id
}

// ─── Checkout Sessions ───────────────────────────────────────

/**
 * Create a Stripe Checkout session for plan subscription.
 */
export async function createSubscriptionCheckout(params: {
  customer_id: string
  price_id: string
  company_id: string
  success_url: string
  cancel_url: string
}): Promise<{ url: string | null }> {
  const stripe = getStripe()

  const session = await stripe.checkout.sessions.create({
    customer: params.customer_id,
    mode: 'subscription',
    line_items: [{ price: params.price_id, quantity: 1 }],
    success_url: params.success_url,
    cancel_url: params.cancel_url,
    metadata: {
      company_id: params.company_id,
      type: 'subscription',
    },
  })

  return { url: session.url }
}

/**
 * Create a Stripe Checkout session for one-time token pack purchase.
 */
export async function createTokenPackCheckout(params: {
  customer_id: string
  company_id: string
  token_amount: number
  price_cents: number
  success_url: string
  cancel_url: string
}): Promise<{ url: string | null }> {
  const stripe = getStripe()

  const session = await stripe.checkout.sessions.create({
    customer: params.customer_id,
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: params.price_cents,
          product_data: {
            name: `${(params.token_amount / 1000).toFixed(0)}K AI Token Pack`,
            description: `${params.token_amount.toLocaleString()} additional AI tokens for your MissionPulse account`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: params.success_url,
    cancel_url: params.cancel_url,
    metadata: {
      company_id: params.company_id,
      token_amount: String(params.token_amount),
      type: 'token_pack',
    },
  })

  return { url: session.url }
}

// ─── Webhook Signature Verification ──────────────────────────

/**
 * Verify a Stripe webhook event signature.
 */
export async function verifyWebhookEvent(
  payload: string,
  signature: string
): Promise<Stripe.Event> {
  const stripe = getStripe()
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!endpointSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  }

  return stripe.webhooks.constructEvent(payload, signature, endpointSecret)
}

// ─── Subscription Management ─────────────────────────────────

/**
 * Cancel a Stripe subscription at period end.
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<{ success: boolean }> {
  const stripe = getStripe()

  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })

  return { success: true }
}

/**
 * Resume a cancelled subscription.
 */
export async function resumeSubscription(
  subscriptionId: string
): Promise<{ success: boolean }> {
  const stripe = getStripe()

  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })

  return { success: true }
}
