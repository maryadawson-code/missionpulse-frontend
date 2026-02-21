'use client'

import { useState, useTransition, useCallback } from 'react'
import { Loader2, Sparkles, MessageCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { addToast } from '@/components/ui/Toast'
import {
  TrackChangesBlock,
  type TrackChangesSuggestion,
} from '@/components/features/ai/TrackChangesBlock'
import { runOralsAgent } from '@/lib/ai/agents/orals'
import { parseOralsOutput } from '@/lib/ai/agents/parsers'

interface OralsPrepProps {
  opportunity: {
    id: string
    title: string
    agency: string
    description: string
  }
  requirements: string[]
}

export function OralsPrep({ opportunity, requirements }: OralsPrepProps) {
  const [isPending, startTransition] = useTransition()
  const [suggestions, setSuggestions] = useState<TrackChangesSuggestion[] | null>(null)
  const [modelName, setModelName] = useState('')

  const handleGenerate = useCallback(() => {
    startTransition(async () => {
      const response = await runOralsAgent({
        title: opportunity.title,
        agency: opportunity.agency,
        description: opportunity.description,
        requirements,
        opportunityId: opportunity.id,
      })

      setModelName(response.model_used)

      const qas = parseOralsOutput(response.content)

      const items: TrackChangesSuggestion[] = qas.map((qa) => ({
        id: qa.id,
        content: `Q: ${qa.question}\n\nA: ${qa.suggestedAnswer}\n\nCoaching: ${qa.coachingTip}`,
        because: qa.because,
        confidence: 'high',
        citations: [],
      }))

      // If parsing found fewer than 5, fall back to raw paragraphs
      if (items.length < 5) {
        const paragraphs = response.content
          .split('\n\n')
          .filter((p) => p.trim().length > 30)

        const rawItems: TrackChangesSuggestion[] = paragraphs.map((p, i) => ({
          id: `oral-${i}`,
          content: p.replace(/\*\*/g, '').trim(),
          because: 'Generated from opportunity and requirement analysis.',
          confidence: response.confidence,
          citations: [],
        }))

        setSuggestions(rawItems)
      } else {
        setSuggestions(items)
      }
    })
  }, [opportunity, requirements, startTransition])

  return (
    <div className="space-y-4">
      {!suggestions && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="h-6 w-6 text-primary" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                AI Orals Coach
              </h3>
              <p className="text-xs text-muted-foreground">
                Generate evaluator-style Q&A, coaching tips, and speaker notes
              </p>
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate Q&A Set
          </Button>
        </div>
      )}

      {isPending && !suggestions && (
        <div className="flex items-center gap-3 rounded-lg border border-border p-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            Generating evaluator questions and coaching materials...
          </span>
        </div>
      )}

      {suggestions && (
        <TrackChangesBlock
          title={`Orals Q&A (${suggestions.length} items)`}
          suggestions={suggestions}
          modelAttribution={modelName}
          onAccept={() => addToast('success', 'Q&A item saved')}
          onReject={() => {}}
          onAcceptAll={() => addToast('success', 'All Q&A saved')}
          onRejectAll={() => addToast('info', 'Q&A set rejected')}
        />
      )}
    </div>
  )
}
