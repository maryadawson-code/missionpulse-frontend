// filepath: supabase/functions/engagement-scorer/index.ts
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

  const { data: pilots } = await supabase
    .from('company_subscriptions')
    .select('company_id, pilot_end_date')
    .eq('status', 'pilot')
  if (!pilots?.length) return new Response(JSON.stringify({ scored: 0 }), { status: 200 })

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  let scored = 0

  for (const pilot of pilots) {
    const { data: acts } = await supabase
      .from('activity_feed')
      .select('action_type, created_at')
      .eq('company_id', pilot.company_id)
      .gte('created_at', thirtyDaysAgo)
    const a = acts ?? []

    const loginDays = new Set(
      a.filter((x) => x.action_type === 'login' || x.action_type === 'session_start')
        .map((x) => (x.created_at ?? '').slice(0, 10))
    ).size
    const aiQ = a.filter((x) => (x.action_type ?? '').startsWith('ai_') || x.action_type === 'agent_run').length
    const props = a.filter((x) => x.action_type === 'opportunity_created').length
    const comp = a.filter((x) => x.action_type === 'compliance_run' || x.action_type === 'rfp_shredder_run').length
    const { count: tc } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', pilot.company_id)
      .neq('role', 'executive')

    const score = Math.round(
      Math.min(loginDays / 15, 1) * 20 +
      Math.min(aiQ / 20, 1) * 25 +
      Math.min(props / 2, 1) * 25 +
      Math.min(comp / 3, 1) * 15 +
      Math.min((tc ?? 0) / 2, 1) * 15
    )

    await supabase.from('pilot_engagement_scores').insert({
      company_id: pilot.company_id,
      score,
      daily_logins: loginDays,
      ai_queries: aiQ,
      proposals_created: props,
      compliance_matrices: comp,
      team_invites: tc ?? 0,
      calculated_at: new Date().toISOString(),
    })

    // Week 2 alert for at-risk pilots
    const pilotStart = pilot.pilot_end_date
      ? new Date(new Date(pilot.pilot_end_date).getTime() - 30 * 24 * 60 * 60 * 1000)
      : null
    if (pilotStart) {
      const daysIn = Math.floor((Date.now() - pilotStart.getTime()) / 86400000)
      if (score < 40 && daysIn >= 13 && daysIn <= 15) {
        await supabase.from('activity_feed').insert({
          company_id: pilot.company_id,
          user_id: null,
          action_type: 'engagement_alert_week2',
          entity_type: 'subscription',
          entity_id: pilot.company_id,
          description: `Week 2 alert: score ${score}/100 — at-risk pilot`,
        })
      }
    }
    scored++
  }

  return new Response(JSON.stringify({ scored }), { status: 200 })
})
