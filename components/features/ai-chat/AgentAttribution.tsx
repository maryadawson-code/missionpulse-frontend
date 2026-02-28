'use client'

import { AGENT_LABELS, AGENT_COLORS } from '@/lib/ai/intent-patterns'
import { ConfidenceBadge } from '@/components/features/ai/ConfidenceBadge'

interface AgentAttributionProps {
  agentType: string
  model?: string
  confidence?: 'high' | 'medium' | 'low'
}

export function AgentAttribution({ agentType, model, confidence }: AgentAttributionProps) {
  const label = AGENT_LABELS[agentType] ?? 'AI Assistant'
  const dotColor = AGENT_COLORS[agentType] ?? 'bg-gray-400'

  return (
    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
        Answered by {label}
      </span>
      {model && (
        <span className="text-[10px] text-muted-foreground">
          &bull; {model}
        </span>
      )}
      {confidence && (
        <>
          <span className="text-[10px] text-muted-foreground">&bull;</span>
          <ConfidenceBadge level={confidence} />
        </>
      )}
    </div>
  )
}
