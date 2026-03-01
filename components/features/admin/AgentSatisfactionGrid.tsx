/**
 * Agent Satisfaction Grid — Per-agent feedback satisfaction scores.
 * Displays a card per agent with satisfaction %, progress bar, and feedback count.
 *
 * v1.9 Sprint 53
 */
'use client'

import { AGENT_LABELS, AGENT_COLORS } from '@/lib/ai/intent-patterns'
import type { AgentSatisfactionScore } from '@/lib/ai/feedback-context'

interface AgentSatisfactionGridProps {
  scores: AgentSatisfactionScore[]
}

function getBarColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

function getDotColor(score: number): string {
  if (score >= 70) return 'bg-emerald-400'
  if (score >= 40) return 'bg-amber-400'
  return 'bg-red-400'
}

export function AgentSatisfactionGrid({ scores }: AgentSatisfactionGridProps) {
  if (scores.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-medium uppercase text-muted-foreground">
          Agent Satisfaction
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          No feedback data yet. Satisfaction scores appear after users rate AI responses.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-sm font-medium uppercase text-muted-foreground">
        Agent Satisfaction (Last 30 Days)
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {scores.map((score) => (
          <div
            key={score.agentType}
            className="rounded-lg border border-border bg-card/50 p-4"
          >
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  AGENT_COLORS[score.agentType] ?? 'bg-gray-400'
                }`}
              />
              <span className="text-sm font-medium text-foreground">
                {AGENT_LABELS[score.agentType] ?? score.agentType}
              </span>
            </div>

            <div className="mt-3 flex items-end justify-between">
              <span
                className={`text-2xl font-bold ${getDotColor(score.satisfactionScore).replace('bg-', 'text-')}`}
              >
                {score.satisfactionScore}%
              </span>
              <span className="text-xs text-muted-foreground">
                {score.totalFeedback} ratings
              </span>
            </div>

            <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getBarColor(score.satisfactionScore)}`}
                style={{ width: `${score.satisfactionScore}%` }}
              />
            </div>

            <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
              <span>{score.totalPositive} positive</span>
              <span>{score.totalNegative} negative</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
