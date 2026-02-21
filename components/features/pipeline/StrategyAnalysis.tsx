'use client'

import { useState, useTransition, useCallback } from 'react'
import { Loader2, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { addToast } from '@/components/ui/Toast'
import {
  TrackChangesBlock,
  type TrackChangesSuggestion,
} from '@/components/features/ai/TrackChangesBlock'
import { runStrategyAgent } from '@/lib/ai/agents/strategy'

interface StrategyAnalysisProps {
  opportunity: {
    id: string
    title: string
    agency: string | null
    description: string | null
    set_aside: string | null
    naics_code: string | null
  }
}

export function StrategyAnalysis({ opportunity }: StrategyAnalysisProps) {
  const [isPending, startTransition] = useTransition()
  const [suggestions, setSuggestions] = useState<TrackChangesSuggestion[] | null>(null)
  const [modelName, setModelName] = useState('')

  const handleGenerate = useCallback(() => {
    startTransition(async () => {
      const response = await runStrategyAgent({
        title: opportunity.title,
        agency: opportunity.agency ?? 'Unknown',
        description: opportunity.description ?? '',
        setAside: opportunity.set_aside,
        naicsCode: opportunity.naics_code,
        opportunityId: opportunity.id,
      })

      setModelName(response.model_used)

      // Parse response into paragraphs
      const paragraphs = response.content
        .split('\n\n')
        .filter((p) => p.trim().length > 20)

      const items: TrackChangesSuggestion[] = paragraphs.map((p, i) => ({
        id: `strategy-${i}`,
        content: p.replace(/\*\*/g, '').trim(),
        because: 'Based on opportunity evaluation criteria and competitive positioning.',
        confidence: response.confidence,
        citations: [],
      }))

      setSuggestions(items)
    })
  }, [opportunity, startTransition])

  return (
    <div className="space-y-4">
      {!suggestions && (
        <Button onClick={handleGenerate} disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate Strategy
        </Button>
      )}

      {isPending && !suggestions && (
        <div className="flex items-center gap-3 rounded-lg border border-border p-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            Generating strategy analysis...
          </span>
        </div>
      )}

      {suggestions && (
        <TrackChangesBlock
          title="Strategy Analysis"
          suggestions={suggestions}
          modelAttribution={modelName}
          onAccept={(_id, _content) => addToast('success', 'Strategy item accepted')}
          onReject={() => addToast('info', 'Strategy item rejected')}
          onAcceptAll={() => addToast('success', 'All strategy items accepted')}
          onRejectAll={() => addToast('info', 'All items rejected')}
        />
      )}
    </div>
  )
}
