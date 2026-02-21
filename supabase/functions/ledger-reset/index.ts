/**
 * Ledger Reset — Supabase Edge Function (Cron: 1st of month)
 *
 * Creates a new token_ledger entry for each active company subscription.
 * Carries zero balance — no rollover of unused tokens.
 *
 * Cron config (set in Supabase dashboard):
 *   Schedule: 0 0 1 * *  (midnight UTC on the 1st)
 *   HTTP method: POST
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    // Get all active subscriptions with their plan details
    const { data: subscriptions, error: subError } = await supabase
      .from('company_subscriptions')
      .select('company_id, plan_id, subscription_plans(monthly_token_limit)')
      .eq('status', 'active')

    if (subError) {
      throw new Error(`Failed to fetch subscriptions: ${subError.message}`)
    }

    let created = 0
    let skipped = 0

    for (const sub of subscriptions ?? []) {
      const plan = sub.subscription_plans as { monthly_token_limit: number } | null
      if (!plan) {
        skipped++
        continue
      }

      // Check if ledger entry already exists for this period
      const { data: existing } = await supabase
        .from('token_ledger')
        .select('id')
        .eq('company_id', sub.company_id)
        .eq('period_start', periodStart.toISOString())
        .single()

      if (existing) {
        skipped++
        continue
      }

      // Create new ledger entry with zero consumption
      const { error: insertError } = await supabase
        .from('token_ledger')
        .insert({
          company_id: sub.company_id,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          tokens_allocated: plan.monthly_token_limit,
          tokens_consumed: 0,
          tokens_purchased: 0,
          overage_tokens_used: 0,
        })

      if (insertError) {
        console.error(`[ledger-reset] Failed for ${sub.company_id}: ${insertError.message}`)
        skipped++
      } else {
        created++
      }
    }

    // Log the operation
    await supabase.from('audit_logs').insert({
      table_name: 'token_ledger',
      action: 'ledger_reset',
      new_values: JSON.stringify({ created, skipped, period: periodStart.toISOString() }),
      user_id: '00000000-0000-0000-0000-000000000000', // system user
    })

    return new Response(
      JSON.stringify({
        success: true,
        created,
        skipped,
        period: periodStart.toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[ledger-reset] Error:', message)

    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
