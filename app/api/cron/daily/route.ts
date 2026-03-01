/**
 * Daily Cron Job — Pilot Expiry + Engagement Scoring
 *
 * Runs daily via external scheduler (e.g. Vercel Cron, GitHub Actions).
 * Authenticates via CRON_SECRET bearer token (no user session).
 * Uses service role client for admin-level DB access.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('daily-cron')

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

    const companyIds = (pilots ?? []).map((p) => p.company_id as string)
    let engagementUpdated = 0

    if (companyIds.length > 0) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      // Batch all independent queries with Promise.all
      const [loginResult, aiResult, activityResult, teamResult, docsResult, subsResult] =
        await Promise.all([
          // Login activity (all companies)
          supabase
            .from('activity_log')
            .select('timestamp')
            .eq('action', 'login')
            .gte('timestamp', thirtyDaysAgo),

          // AI token usage (all companies)
          supabase
            .from('token_usage')
            .select('id, company_id')
            .in('company_id', companyIds)
            .gte('created_at', thirtyDaysAgo),

          // Feature adoption activity (all companies)
          supabase
            .from('activity_log')
            .select('action, company_id')
            .in('company_id', companyIds)
            .gte('timestamp', thirtyDaysAgo),

          // Team members per company
          supabase
            .from('profiles')
            .select('id, company_id')
            .in('company_id', companyIds),

          // Documents generated per company
          supabase
            .from('company_documents')
            .select('id, company_id')
            .in('company_id', companyIds)
            .gte('created_at', thirtyDaysAgo),

          // Subscription metadata for all pilot companies
          supabase
            .from('company_subscriptions')
            .select('company_id, metadata')
            .in('company_id', companyIds),
        ])

      // Build per-company lookup maps
      const loginDays = new Set(
        (loginResult.data ?? []).map((r) => new Date(r.timestamp as string).toDateString())
      )
      const loginScore = Math.min(100, Math.round((loginDays.size / 30) * 100))

      const aiByCompany = new Map<string, number>()
      for (const row of aiResult.data ?? []) {
        const cid = row.company_id as string
        aiByCompany.set(cid, (aiByCompany.get(cid) ?? 0) + 1)
      }

      const actionsByCompany = new Map<string, Set<string>>()
      for (const row of activityResult.data ?? []) {
        const cid = row.company_id as string
        if (!actionsByCompany.has(cid)) actionsByCompany.set(cid, new Set())
        actionsByCompany.get(cid)!.add(row.action as string)
      }

      const teamByCompany = new Map<string, number>()
      for (const row of teamResult.data ?? []) {
        const cid = row.company_id as string
        teamByCompany.set(cid, (teamByCompany.get(cid) ?? 0) + 1)
      }

      const docsByCompany = new Map<string, number>()
      for (const row of docsResult.data ?? []) {
        const cid = row.company_id as string
        docsByCompany.set(cid, (docsByCompany.get(cid) ?? 0) + 1)
      }

      const metaByCompany = new Map<string, Record<string, unknown>>()
      for (const row of subsResult.data ?? []) {
        const cid = row.company_id as string
        metaByCompany.set(cid, (row.metadata as Record<string, unknown>) ?? {})
      }

      // Compute scores and batch update
      for (const companyId of companyIds) {
        const aiPerDay = (aiByCompany.get(companyId) ?? 0) / 30
        const aiScore = Math.min(100, Math.round((aiPerDay / 10) * 100))

        const uniqueActions = actionsByCompany.get(companyId) ?? new Set()
        const featureScore = Math.min(100, Math.round((uniqueActions.size / 14) * 100))

        const teamCount = teamByCompany.get(companyId) ?? 1
        const teamScore = Math.min(100, Math.round(((teamCount - 1) / 5) * 100))

        const docsCount = docsByCompany.get(companyId) ?? 0
        const docsScore = Math.min(100, Math.round((docsCount / 10) * 100))

        const score = Math.round(
          loginScore * WEIGHTS.loginFrequency +
          aiScore * WEIGHTS.aiUsage +
          featureScore * WEIGHTS.featureAdoption +
          teamScore * WEIGHTS.teamInvites +
          docsScore * WEIGHTS.docsGenerated
        )

        const currentMeta = metaByCompany.get(companyId) ?? {}

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
    log.error('Cron processing failed', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
