/**
 * POST /api/billing/webhook — Stripe webhook handler.
 *
 * Verifies signature before processing. Uses service-role client (no user session).
 * Handles: checkout.session.completed, customer.subscription.updated,
 *          customer.subscription.deleted, invoice.payment_failed
 */
import { NextResponse, type NextRequest } from 'next/server'
import { verifyWebhookEvent } from '@/lib/billing/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { creditPurchasedTokens } from '@/lib/billing/ledger'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const payload = await req.text()

  let event: Stripe.Event
  try {
    event = await verifyWebhookEvent(payload, signature)
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err instanceof Error ? err.message : 'unknown'}` },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const companyId = session.metadata?.company_id
        const sessionType = session.metadata?.type

        if (!companyId) break

        if (sessionType === 'token_pack') {
          // One-time token purchase
          const tokenAmount = Number(session.metadata?.token_amount ?? 0)
          if (tokenAmount > 0) {
            await creditPurchasedTokens(companyId, tokenAmount)
          }
        } else {
          // Subscription checkout
          const tier = session.metadata?.tier
          const subscriptionId =
            typeof session.subscription === 'string'
              ? session.subscription
              : (session.subscription as Stripe.Subscription | null)?.id ?? null

          // Look up plan by slug
          const { data: plan } = await supabase
            .from('subscription_plans')
            .select('id')
            .eq('slug', tier ?? 'starter')
            .single()

          if (plan) {
            const now = new Date()
            const periodEnd = new Date(now)
            periodEnd.setMonth(periodEnd.getMonth() + 1)

            await supabase.from('company_subscriptions').upsert(
              {
                company_id: companyId,
                plan_id: plan.id,
                status: 'active',
                billing_interval: 'monthly',
                stripe_subscription_id: subscriptionId,
                stripe_customer_id:
                  typeof session.customer === 'string'
                    ? session.customer
                    : (session.customer as Stripe.Customer | null)?.id ?? null,
                current_period_start: now.toISOString(),
                current_period_end: periodEnd.toISOString(),
                updated_at: now.toISOString(),
              },
              { onConflict: 'company_id' }
            )
          }

          await supabase.from('audit_logs').insert({
            user_id: session.metadata?.user_id ?? '00000000-0000-0000-0000-000000000000',
            action: 'subscription_activated',
            table_name: 'company_subscriptions',
            record_id: companyId,
            new_values: JSON.parse(JSON.stringify({
              tier,
              stripe_subscription_id: subscriptionId,
              event_type: event.type,
            })),
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const companyId = subscription.metadata?.company_id

        if (!companyId) break

        const status = subscription.status === 'active'
          ? 'active'
          : subscription.status === 'past_due'
            ? 'past_due'
            : subscription.status === 'trialing'
              ? 'trialing'
              : 'active'

        const cancelAtPeriodEnd = subscription.cancel_at_period_end

        await supabase
          .from('company_subscriptions')
          .update({
            status: cancelAtPeriodEnd ? 'canceled' : status,
            updated_at: new Date().toISOString(),
          })
          .eq('company_id', companyId)

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const companyId = subscription.metadata?.company_id

        if (!companyId) break

        await supabase
          .from('company_subscriptions')
          .update({
            status: 'canceled',
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('company_id', companyId)

        await supabase.from('audit_logs').insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          action: 'subscription_cancelled',
          table_name: 'company_subscriptions',
          record_id: companyId,
          new_values: JSON.parse(JSON.stringify({ event_type: event.type })),
        })

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subDetails = invoice.parent?.subscription_details
        const subscriptionRef = subDetails?.subscription ?? null
        const subscriptionId =
          typeof subscriptionRef === 'string'
            ? subscriptionRef
            : subscriptionRef?.id ?? null

        if (subscriptionId) {
          await supabase
            .from('company_subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId)
        }
        break
      }

      default:
        // Unhandled event type — acknowledge receipt
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
