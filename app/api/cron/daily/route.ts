/**
 * Daily Cron Job — Pilot Expiry + Engagement Scoring
 *
 * Runs daily via external scheduler (e.g. Vercel Cron, GitHub Actions).
 * Authenticates via CRON_SECRET bearer token (no user session).
 * Uses service role client for admin-level DB access.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── Engagement Weights (mirrors lib/billing/engagement.ts) ───
const WEIGHTS = {
  loginFrequency: 0.20,
  aiUsage: 0.25,
  featureAdoption: 0.25,
  teamInvites: 0.15,
  docsGenerated: 0.15,
}

export async function GET(request: NextRequest) {
  // Authenticate via bearer token
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdminClient()
  const now = new Date().toISOString()

  try {
    // ─── 1. Expire overdue pilots ─────────────────────────────
    const { data: expired } = await supabase
      .from('company_subscriptions')
      .update({ status: 'expired' })
      .eq('status', 'pilot')
      .lt('pilot_end_date', now)
      .select('id')

    const expiredCount = expired?.length ?? 0

    // ─── 2. Update engagement scores for active pilots ────────
    const { data: pilots } = await supabase
      .from('company_subscriptions')
      .select('company_id')
      .eq('status', 'pilot')

    let engagementUpdated = 0
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    for (const pilot of pilots ?? []) {
      const companyId = pilot.company_id as string

      // Calculate engagement factors
      const { data: loginData } = await supabase
        .from('activity_log')
        .select('timestamp')
        .eq('action', 'login')
        .gte('timestamp', thirtyDaysAgo)

      const loginDays = new Set(
        (loginData ?? []).map((r) => new Date(r.timestamp as string).toDateString())
      )
      const loginScore = Math.min(100, Math.round((loginDays.size / 30) * 100))

      const { data: aiData } = await supabase
        .from('token_usage')
        .select('id')
        .gte('created_at', thirtyDaysAgo)

      const aiPerDay = (aiData?.length ?? 0) / 30
      const aiScore = Math.min(100, Math.round((aiPerDay / 10) * 100))

      const { data: activityData } = await supabase
        .from('activity_log')
        .select('action')
        .gte('timestamp', thirtyDaysAgo)

      const uniqueActions = new Set((activityData ?? []).map((r) => r.action))
      const featureScore = Math.min(100, Math.round((uniqueActions.size / 14) * 100))

      const { data: teamData } = await supabase
        .from('profiles')
        .select('id')
        .eq('company_id', companyId)

      const teamScore = Math.min(100, Math.round((((teamData?.length ?? 1) - 1) / 5) * 100))

      const { count: docsCount } = await supabase
        .from('company_documents')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('created_at', thirtyDaysAgo)

      const docsScore = Math.min(100, Math.round(((docsCount ?? 0) / 10) * 100))

      const score = Math.round(
        loginScore * WEIGHTS.loginFrequency +
        aiScore * WEIGHTS.aiUsage +
        featureScore * WEIGHTS.featureAdoption +
        teamScore * WEIGHTS.teamInvites +
        docsScore * WEIGHTS.docsGenerated
      )

      // Persist to metadata
      const { data: sub } = await supabase
        .from('company_subscriptions')
        .select('metadata')
        .eq('company_id', companyId)
        .single()

      const currentMeta = (sub?.metadata as Record<string, unknown>) ?? {}

      await supabase
        .from('company_subscriptions')
        .update({
          metadata: {
            ...currentMeta,
            engagement_score: score,
            engagement_factors: {
              loginFrequency: loginScore,
              aiUsage: aiScore,
              featureAdoption: featureScore,
              teamInvites: teamScore,
              docsGenerated: docsScore,
            },
            engagement_computed_at: now,
          },
        })
        .eq('company_id', companyId)

      engagementUpdated++
    }

    // ─── 3. Audit log ─────────────────────────────────────────
    await supabase.from('audit_logs').insert({
      action: 'daily_cron',
      user_id: '00000000-0000-0000-0000-000000000000',
      entity_type: 'system',
      entity_id: 'cron',
      details: {
        expired_pilots: expiredCount,
        engagement_updated: engagementUpdated,
        ran_at: now,
      },
    })

    return NextResponse.json({
      success: true,
      expired_pilots: expiredCount,
      engagement_updated: engagementUpdated,
      ran_at: now,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Cron processing error'
    console.error('[daily-cron] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
