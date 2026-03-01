/**
 * AI Agent Self-Learning Feedback Loop
 *
 * Queries recent user feedback (thumbs up/down) from activity_feed
 * and builds adaptive system prompt instructions so agents can
 * learn from satisfaction history.
 *
 * v1.9 Sprint 53
 */
'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Types ──────────────────────────────────────────────────

export interface FeedbackContext {
  instructions: string
  satisfactionScore: number
  totalPositive: number
  totalNegative: number
}

export interface AgentSatisfactionScore {
  agentType: string
  satisfactionScore: number
  totalPositive: number
  totalNegative: number
  totalFeedback: number
}

// ─── Per-Agent Feedback Context ─────────────────────────────

/**
 * Build adaptive prompt instructions from recent user feedback.
 * Returns null if not authenticated or insufficient data (< 3 entries).
 */
export async function buildFeedbackContext(
  agentType: string
): Promise<FeedbackContext | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  const companyId = profile?.company_id
  if (!companyId) return null

  // Query last 30 days of feedback from activity_feed
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: feedbackRows } = await supabase
    .from('activity_feed')
    .select('action_type, metadata, created_at')
    .eq('company_id', companyId)
    .in('action_type', ['ai_feedback_positive', 'ai_feedback_negative'])
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(50)

  if (!feedbackRows || feedbackRows.length === 0) return null

  // Filter by agent type from metadata
  const agentFeedback = feedbackRows.filter(
    (row) =>
      (row.metadata as Record<string, unknown>)?.agent_type === agentType
  )

  if (agentFeedback.length < 3) return null

  const totalPositive = agentFeedback.filter(
    (row) => row.action_type === 'ai_feedback_positive'
  ).length
  const totalNegative = agentFeedback.filter(
    (row) => row.action_type === 'ai_feedback_negative'
  ).length
  const total = totalPositive + totalNegative
  const satisfactionScore = Math.round((totalPositive / total) * 100)

  // Extract negative feedback comments for actionable signals
  const negativeComments = agentFeedback
    .filter((row) => row.action_type === 'ai_feedback_negative')
    .map((row) => (row.metadata as Record<string, unknown>)?.comment)
    .filter((c): c is string => typeof c === 'string' && c.length > 0)
    .slice(0, 5)

  // Build adaptive instruction string
  const lines: string[] = [
    'LEARNING FROM USER FEEDBACK (last 30 days):',
    `- Satisfaction: ${satisfactionScore}% positive (${totalPositive} positive, ${totalNegative} negative)`,
  ]

  if (satisfactionScore >= 70) {
    lines.push(
      '- Users responded well to your recent output. Maintain your current approach.'
    )
  } else if (satisfactionScore >= 40) {
    lines.push(
      '- Mixed feedback. Focus on being more specific and actionable in your recommendations.'
    )
  } else {
    lines.push(
      '- Low satisfaction detected. Prioritize clarity, specificity, and actionable detail.'
    )
  }

  if (negativeComments.length > 0) {
    lines.push(
      `- Users flagged issues: ${negativeComments.map((c) => `"${c}"`).join(', ')}`
    )
  }

  lines.push(
    '- Adjust your approach based on this feedback while maintaining your expertise.'
  )

  return {
    instructions: lines.join('\n'),
    satisfactionScore,
    totalPositive,
    totalNegative,
  }
}

// ─── Bulk Agent Scores (for analytics) ──────────────────────

/**
 * Fetch satisfaction scores for all agent types in a single query.
 * Used by the AI Usage admin page.
 */
export async function getAgentSatisfactionScores(
  companyId: string
): Promise<AgentSatisfactionScore[]> {
  const supabase = await createClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: feedbackRows } = await supabase
    .from('activity_feed')
    .select('action_type, metadata')
    .eq('company_id', companyId)
    .in('action_type', ['ai_feedback_positive', 'ai_feedback_negative'])
    .gte('created_at', thirtyDaysAgo.toISOString())
    .limit(500)

  if (!feedbackRows || feedbackRows.length === 0) return []

  // Group by agent type
  const byAgent = new Map<
    string,
    { positive: number; negative: number }
  >()

  for (const row of feedbackRows) {
    const agentType =
      ((row.metadata as Record<string, unknown>)?.agent_type as string) ??
      'general'
    const entry = byAgent.get(agentType) ?? { positive: 0, negative: 0 }
    if (row.action_type === 'ai_feedback_positive') {
      entry.positive++
    } else {
      entry.negative++
    }
    byAgent.set(agentType, entry)
  }

  return Array.from(byAgent.entries()).map(([agentType, counts]) => {
    const total = counts.positive + counts.negative
    return {
      agentType,
      satisfactionScore:
        total > 0 ? Math.round((counts.positive / total) * 100) : 0,
      totalPositive: counts.positive,
      totalNegative: counts.negative,
      totalFeedback: total,
    }
  })
}
