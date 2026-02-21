/**
 * Engagement Scoring Engine — Score pilot accounts 0-100.
 *
 * Weighted factors:
 *   - Login frequency (20%)
 *   - AI requests/day (25%)
 *   - Features used / features available (25%)
 *   - Team members invited (15%)
 *   - Documents generated (15%)
 *
 * Score stored in company_subscriptions.metadata.engagement_score
 */
'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Types ──────────────────────────────────────────────────

export interface EngagementFactors {
  loginFrequency: number    // 0-100 normalized
  aiUsage: number           // 0-100 normalized
  featureAdoption: number   // 0-100 normalized
  teamInvites: number       // 0-100 normalized
  docsGenerated: number     // 0-100 normalized
}

export interface EngagementResult {
  score: number             // 0-100 composite
  factors: EngagementFactors
  computedAt: string
}

// ─── Weights ────────────────────────────────────────────────

const WEIGHTS = {
  loginFrequency: 0.20,
  aiUsage: 0.25,
  featureAdoption: 0.25,
  teamInvites: 0.15,
  docsGenerated: 0.15,
}

// ─── Scoring ────────────────────────────────────────────────

/**
 * Calculate engagement score for a company.
 * Looks at activity over the last 30 days.
 */
export async function calculateEngagement(
  companyId: string
): Promise<EngagementResult> {
  const supabase = await createClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Factor 1: Login frequency — unique login days / 30
  const loginScore = await (async () => {
    const { data } = await supabase
      .from('activity_log')
      .select('timestamp')
      .eq('action', 'login')
      .gte('timestamp', thirtyDaysAgo)

    if (!data || data.length === 0) return 0

    // Filter to company users (activity_log may not have company_id)
    const uniqueDays = new Set(
      data.map((r) => new Date(r.timestamp as string).toDateString())
    )
    return Math.min(100, Math.round((uniqueDays.size / 30) * 100))
  })()

  // Factor 2: AI usage — requests per day (10+/day = 100)
  const aiScore = await (async () => {
    const { data } = await supabase
      .from('token_usage')
      .select('id')
      .gte('created_at', thirtyDaysAgo)

    const count = data?.length ?? 0
    const perDay = count / 30
    return Math.min(100, Math.round((perDay / 10) * 100))
  })()

  // Factor 3: Feature adoption — modules visited / total available
  const featureScore = await (async () => {
    const { data } = await supabase
      .from('activity_log')
      .select('action, details')
      .gte('timestamp', thirtyDaysAgo)

    if (!data) return 0

    // Count unique action types as proxy for feature usage
    const uniqueActions = new Set(data.map((r) => r.action))
    const totalModules = 14 // RBAC modules
    return Math.min(100, Math.round((uniqueActions.size / totalModules) * 100))
  })()

  // Factor 4: Team members invited (5+ = 100)
  const teamScore = await (async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('company_id', companyId)

    const memberCount = data?.length ?? 1
    return Math.min(100, Math.round(((memberCount - 1) / 5) * 100))
  })()

  // Factor 5: Documents generated (10+ = 100)
  const docsScore = await (async () => {
    const { count } = await supabase
      .from('company_documents')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .gte('created_at', thirtyDaysAgo)

    return Math.min(100, Math.round(((count ?? 0) / 10) * 100))
  })()

  const factors: EngagementFactors = {
    loginFrequency: loginScore,
    aiUsage: aiScore,
    featureAdoption: featureScore,
    teamInvites: teamScore,
    docsGenerated: docsScore,
  }

  const score = Math.round(
    factors.loginFrequency * WEIGHTS.loginFrequency +
    factors.aiUsage * WEIGHTS.aiUsage +
    factors.featureAdoption * WEIGHTS.featureAdoption +
    factors.teamInvites * WEIGHTS.teamInvites +
    factors.docsGenerated * WEIGHTS.docsGenerated
  )

  return {
    score,
    factors,
    computedAt: new Date().toISOString(),
  }
}

/**
 * Calculate and persist engagement score for a company.
 * Stores result in company_subscriptions.metadata.
 */
export async function updateEngagementScore(
  companyId: string
): Promise<EngagementResult> {
  const result = await calculateEngagement(companyId)

  const supabase = await createClient()

  // Read current metadata
  const { data: sub } = await supabase
    .from('company_subscriptions')
    .select('metadata')
    .eq('company_id', companyId)
    .single()

  const currentMeta = (sub?.metadata as Record<string, unknown>) ?? {}

  await supabase
    .from('company_subscriptions')
    .update({
      metadata: JSON.parse(
        JSON.stringify({
          ...currentMeta,
          engagement_score: result.score,
          engagement_factors: result.factors,
          engagement_computed_at: result.computedAt,
        })
      ),
    })
    .eq('company_id', companyId)

  return result
}

/**
 * Bulk update engagement scores for all active pilots.
 * Called by daily Edge Function cron.
 */
export async function updateAllPilotEngagement(): Promise<number> {
  const supabase = await createClient()

  const { data: pilots } = await supabase
    .from('company_subscriptions')
    .select('company_id')
    .eq('status', 'pilot')

  if (!pilots || pilots.length === 0) return 0

  let updated = 0
  for (const pilot of pilots) {
    await updateEngagementScore(pilot.company_id as string)
    updated++
  }

  return updated
}
