/**
 * Customer Success Health Scoring
 * Sprint 33 (T-33.4) — Phase L v2.0
 *
 * Calculates customer health scores from engagement,
 * feature adoption, and support metrics.
 *
 * © 2026 Mission Meets Tech
 */

import { createClient } from '@/lib/supabase/server'

// ─── Types ──────────────────────────────────────────────────────

export interface CustomerHealth {
  score: number // 0-100
  grade: 'excellent' | 'good' | 'fair' | 'at-risk'
  engagement: number
  adoption: number
  activity: number
}

export interface FeatureAdoption {
  module: string
  usedInLast30Days: boolean
  lastAccessed: string | null
}

export interface CustomerTrend {
  date: string
  logins: number
  queries: number
  documents: number
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Calculate composite customer health score.
 */
export async function calculateCustomerHealth(
  companyId: string
): Promise<CustomerHealth> {
  const supabase = await createClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()

  // Engagement: active users in last 30 days
  const { count: activeUsers } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('status', 'active')

  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)

  const engagementRatio = totalUsers ? ((activeUsers ?? 0) / totalUsers) * 100 : 0

  // Adoption: how many modules accessed in last 30 days
  const { count: aiQueries } = await supabase
    .from('ai_interactions')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .gte('created_at', thirtyDaysAgo)

  const adoptionScore = Math.min(100, (aiQueries ?? 0) * 2)

  // Activity: opportunities and proposals
  const { count: activeOpps } = await supabase
    .from('opportunities')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .neq('status', 'closed')

  const activityScore = Math.min(100, (activeOpps ?? 0) * 10)

  // Composite score
  const score = Math.round(
    engagementRatio * 0.4 + adoptionScore * 0.35 + activityScore * 0.25
  )

  const grade: CustomerHealth['grade'] =
    score >= 80 ? 'excellent' :
    score >= 60 ? 'good' :
    score >= 40 ? 'fair' : 'at-risk'

  return {
    score,
    grade,
    engagement: Math.round(engagementRatio),
    adoption: adoptionScore,
    activity: activityScore,
  }
}

/**
 * Get feature adoption breakdown for a company.
 */
export async function getFeatureAdoption(
  companyId: string
): Promise<FeatureAdoption[]> {
  const modules = [
    'dashboard', 'pipeline', 'proposals', 'pricing', 'strategy',
    'compliance', 'ai_chat', 'documents', 'analytics', 'integrations',
  ]

  const supabase = await createClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const results: FeatureAdoption[] = []

  // Check AI interactions as a proxy for module usage
  const { data: interactions } = await supabase
    .from('ai_interactions')
    .select('agent_type, created_at')
    .eq('company_id', companyId)
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })

  const usedModules = new Set((interactions ?? []).map(i => i.agent_type))

  for (const mod of modules) {
    const interaction = (interactions ?? []).find(i => i.agent_type === mod)
    results.push({
      module: mod,
      usedInLast30Days: usedModules.has(mod),
      lastAccessed: interaction?.created_at ?? null,
    })
  }

  return results
}

/**
 * Get customer activity trends over time.
 */
export async function getCustomerTrends(
  companyId: string,
  days: number = 30
): Promise<CustomerTrend[]> {
  const supabase = await createClient()
  const startDate = new Date(Date.now() - days * 86_400_000)

  const trends: CustomerTrend[] = []

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 86_400_000)
    const dateStr = date.toISOString().split('T')[0]
    const nextDate = new Date(date.getTime() + 86_400_000).toISOString()

    const { count: queries } = await supabase
      .from('ai_interactions')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .gte('created_at', date.toISOString())
      .lt('created_at', nextDate)

    trends.push({
      date: dateStr ?? '',
      logins: 0, // Would require auth_audit_log query
      queries: queries ?? 0,
      documents: 0, // Would require document activity query
    })
  }

  return trends
}
