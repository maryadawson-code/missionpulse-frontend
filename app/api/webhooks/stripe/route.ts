/**
 * Stripe Webhook Handler
 *
 * Processes: checkout.session.completed, invoice.paid
 * Validates signature before processing.
 * Credits tokens instantly on successful payment.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyWebhookEvent } from '@/lib/billing/stripe'

// Use admin client for webhook processing (no user session)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event
  try {
    event = await verifyWebhookEvent(payload, signature)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const supabase = getAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as {
          customer: string
          subscription?: string
          payment_status: string
          metadata: Record<string, string>
        }

        if (session.payment_status !== 'paid') break

        const companyId = session.metadata?.company_id
        const type = session.metadata?.type

        if (!companyId) break

        if (type === 'token_pack') {
          // Credit purchased tokens
          const tokenAmount = Number(session.metadata?.token_amount ?? 0)
          if (tokenAmount > 0) {
            const now = new Date()
            const { data: ledger } = await supabase
              .from('token_ledger')
              .select('id, tokens_purchased')
              .eq('company_id', companyId)
              .lte('period_start', now.toISOString())
              .gte('period_end', now.toISOString())
              .order('period_start', { ascending: false })
              .limit(1)
              .single()

            if (ledger) {
              await supabase
                .from('token_ledger')
                .update({
                  tokens_purchased:
                    (ledger.tokens_purchased as number) + tokenAmount,
                })
                .eq('id', ledger.id)
            }

            // Audit log
            await supabase.from('audit_logs').insert({
              action: 'token_pack_purchased',
              user_id: '00000000-0000-0000-0000-000000000000',
              table_name: 'token_ledger',
              record_id: companyId,
              new_values: { token_amount: tokenAmount, customer: session.customer },
            })
          }
        } else if (type === 'subscription') {
          // Update company subscription
          await supabase
            .from('company_subscriptions')
            .update({
              status: 'active',
              stripe_subscription_id: session.subscription ?? null,
              stripe_customer_id: session.customer,
            })
            .eq('company_id', companyId)

          // Update company stripe fields
          await supabase
            .from('companies')
            .update({
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription ?? null,
            })
            .eq('id', companyId)

          // Audit log
          await supabase.from('audit_logs').insert({
            action: 'subscription_updated',
            user_id: '00000000-0000-0000-0000-000000000000',
            table_name: 'company_subscriptions',
            record_id: companyId,
            new_values: {
              subscription_id: session.subscription,
              customer: session.customer,
            },
          })
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as {
          customer: string
          subscription?: string
          status: string
        }

        if (invoice.subscription) {
          // Find company by stripe customer
          const { data: sub } = await supabase
            .from('company_subscriptions')
            .select('company_id')
            .eq('stripe_customer_id', invoice.customer)
            .single()

          if (sub) {
            // Extend period
            const periodEnd = new Date()
            periodEnd.setMonth(periodEnd.getMonth() + 1)

            await supabase
              .from('company_subscriptions')
              .update({
                status: 'active',
                current_period_end: periodEnd.toISOString(),
              })
              .eq('company_id', sub.company_id)
          }
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Processing error'
    console.error('[stripe-webhook] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
