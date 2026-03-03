/**
 * Engagement Scorer — Supabase Edge Function (Deno)
 *
 * Runs daily via cron. Calculates engagement scores for all active pilots
 * and stores them in company_subscriptions.metadata.
 *
 * If score < 40 and pilot is in week 2+, flags for notification.
 *
 * TODO: deploy via `supabase functions deploy engagement-scorer`
 * TODO: set up cron: `supabase functions schedule engagement-scorer --schedule "0 7 * * *"`
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface PilotRow {
  company_id: string
  pilot_start_date: string | null
  metadata: Record<string, unknown> | null
}

// Scoring weights
const WEIGHTS = {
  loginFrequency: 0.20,
  aiUsage: 0.25,
  featureAdoption: 0.25,
  teamInvites: 0.15,
  docsGenerated: 0.15,
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

  // Get all active pilots
  const { data: pilots, error: queryError } = await supabase
    .from('company_subscriptions')
    .select('company_id, pilot_start_date, metadata')
    .eq('status', 'pilot')

  if (queryError) {
    console.error('[engagement-scorer] Query error:', queryError.message)
    return new Response(
      JSON.stringify({ error: queryError.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const pilotRows = (pilots ?? []) as PilotRow[]
  const results: Array<{ companyId: string; score: number; flagged: boolean }> = []
  const now = Date.now()

  for (const pilot of pilotRows) {
    const since = pilot.pilot_start_date ?? new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Login frequency
    const { count: loginCount } = await supabase
      .from('activity_feed')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', pilot.company_id)
      .eq('action_type', 'login')
      .gte('created_at', since)

    const loginScore = Math.min(100, Math.round(((loginCount ?? 0) / 30) * 100))

    // AI usage
    const { count: aiCount } = await supabase
      .from('token_usage')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since)

    const aiPerDay = (aiCount ?? 0) / 30
    const aiScore = Math.min(100, Math.round((aiPerDay / 10) * 100))

    // Feature adoption
    const { data: actions } = await supabase
      .from('activity_feed')
      .select('action_type')
      .eq('company_id', pilot.company_id)
      .gte('created_at', since)

    const uniqueActions = new Set((actions ?? []).map((r: { action_type: string }) => r.action_type))
    const featureScore = Math.min(100, Math.round((uniqueActions.size / 14) * 100))

    // Team invites
    const { count: memberCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', pilot.company_id)

    const teamScore = Math.min(100, Math.round((((memberCount ?? 1) - 1) / 5) * 100))

    // Documents generated
    const { count: docCount } = await supabase
      .from('company_documents')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', pilot.company_id)
      .gte('uploaded_at', since)

    const docScore = Math.min(100, Math.round(((docCount ?? 0) / 10) * 100))

    // Composite score
    const score = Math.round(
      loginScore * WEIGHTS.loginFrequency +
      aiScore * WEIGHTS.aiUsage +
      featureScore * WEIGHTS.featureAdoption +
      teamScore * WEIGHTS.teamInvites +
      docScore * WEIGHTS.docsGenerated
    )

    // Update metadata
    const currentMeta = pilot.metadata ?? {}
    await supabase
      .from('company_subscriptions')
      .update({
        metadata: {
          ...currentMeta,
          engagement_score: score,
          engagement_computed_at: new Date().toISOString(),
        },
      })
      .eq('company_id', pilot.company_id)

    // Flag if low engagement in week 2+
    const daysSinceStart = pilot.pilot_start_date
      ? Math.ceil((now - new Date(pilot.pilot_start_date).getTime()) / (24 * 60 * 60 * 1000))
      : 0
    const flagged = score < 40 && daysSinceStart >= 14

    if (flagged) {
      console.warn(
        `[engagement-scorer] LOW ENGAGEMENT: ${pilot.company_id} score=${score} day=${daysSinceStart}`
      )
    }

    results.push({ companyId: pilot.company_id, score, flagged })
  }

  console.log(`[engagement-scorer] Scored ${results.length} pilots`)

  return new Response(
    JSON.stringify({
      scored: results.length,
      flagged: results.filter((r) => r.flagged).length,
      results,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
