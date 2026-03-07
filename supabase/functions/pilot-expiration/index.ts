// filepath: supabase/functions/pilot-expiration/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  const now = new Date().toISOString()
  const { data: expiredPilots, error } = await supabase
    .from('company_subscriptions')
    .select('company_id')
    .eq('status', 'pilot')
    .lt('pilot_end_date', now)
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  for (const sub of expiredPilots ?? []) {
    await supabase.from('company_subscriptions')
      .update({ status: 'pilot_expired', updated_at: now })
      .eq('company_id', sub.company_id)
    await supabase.from('audit_logs').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      action: 'pilot_expired',
      table_name: 'company_subscriptions',
      record_id: sub.company_id,
      new_values: { reason: 'cron_expiration', expired_at: now },
    })
  }
  return new Response(JSON.stringify({ expired: (expiredPilots ?? []).length }), { status: 200 })
})
