'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { addToast } from '@/components/ui/Toast'
import { submitAIFeedback } from '@/app/(dashboard)/ai-chat/feedback-actions'

interface FeedbackButtonsProps {
  messageId: string
  sessionId: string
  agentType: string
  model?: string
  confidence?: string
}

export function FeedbackButtons({
  messageId,
  sessionId,
  agentType,
  model,
  confidence,
}: FeedbackButtonsProps) {
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null)

  function handleClick(value: 'positive' | 'negative') {
    const next = rating === value ? null : value
    const prev = rating
    // Optimistic update
    setRating(next)

    submitAIFeedback({
      messageId,
      sessionId,
      rating: next,
      agentType,
      model,
      confidence,
    }).then((result) => {
      if (!result.success) {
        // Rollback
        setRating(prev)
        addToast('error', result.error ?? 'Failed to save feedback')
      }
    })
  }

  return (
    <span className="inline-flex items-center gap-0.5 ml-1.5">
      <button
        onClick={() => handleClick('positive')}
        aria-pressed={rating === 'positive'}
        aria-label="Good response"
        className={`p-0.5 rounded transition-colors ${
          rating === 'positive'
            ? 'text-emerald-400'
            : 'text-muted-foreground/50 hover:text-muted-foreground'
        }`}
      >
        <ThumbsUp className="h-3 w-3" />
      </button>
      <button
        onClick={() => handleClick('negative')}
        aria-pressed={rating === 'negative'}
        aria-label="Bad response"
        className={`p-0.5 rounded transition-colors ${
          rating === 'negative'
            ? 'text-red-400'
            : 'text-muted-foreground/50 hover:text-muted-foreground'
        }`}
      >
        <ThumbsDown className="h-3 w-3" />
      </button>
    </span>
  )
}
