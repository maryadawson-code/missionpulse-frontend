/**
 * Pilot Expiration — Supabase Edge Function (Deno)
 *
 * Runs daily via cron. Finds pilots past their end date and marks them expired.
 * Does NOT delete data — preserves everything for 30 days post-expiration.
 *
 * TODO: deploy via `supabase functions deploy pilot-expiration`
 * TODO: set up cron: `supabase functions schedule pilot-expiration --schedule "0 6 * * *"`
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface PilotRow {
  company_id: string
  pilot_end_date: string | null
  status: string
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const now = new Date().toISOString()

  // Find all pilots past their end date
  const { data: expiredPilots, error: queryError } = await supabase
    .from('company_subscriptions')
    .select('company_id, pilot_end_date, status')
    .eq('status', 'pilot')
    .lt('pilot_end_date', now)

  if (queryError) {
    console.error('[pilot-expiration] Query error:', queryError.message)
    return new Response(
      JSON.stringify({ error: queryError.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const pilots = (expiredPilots ?? []) as PilotRow[]
  const results: Array<{ companyId: string; success: boolean; error?: string }> = []

  for (const pilot of pilots) {
    // Update status to expired, set ai_disabled flag in metadata
    const { error: updateError } = await supabase
      .from('company_subscriptions')
      .update({
        status: 'expired',
        metadata: { ai_disabled: true, expired_at: now },
      })
      .eq('company_id', pilot.company_id)
      .eq('status', 'pilot')

    if (updateError) {
      console.error(`[pilot-expiration] Failed for ${pilot.company_id}:`, updateError.message)
      results.push({ companyId: pilot.company_id, success: false, error: updateError.message })
    } else {
      // Audit log
      await supabase.from('audit_logs').insert({
        action: 'pilot_auto_expired',
        user_id: '00000000-0000-0000-0000-000000000000',
        company_id: pilot.company_id,
        table_name: 'company_subscriptions',
        record_id: pilot.company_id,
        new_values: { status: 'expired', expired_at: now },
      })
      results.push({ companyId: pilot.company_id, success: true })
    }
  }

  console.log(`[pilot-expiration] Processed ${results.length} expired pilots`)

  return new Response(
    JSON.stringify({
      processed: results.length,
      results,
      timestamp: now,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
