'use client'

import { useState, useTransition, useCallback } from 'react'
import { Loader2, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { addToast } from '@/components/ui/Toast'
import {
  TrackChangesBlock,
  type TrackChangesSuggestion,
} from '@/components/features/ai/TrackChangesBlock'
import { runCaptureAnalysis } from '@/lib/ai/agents/capture'
import { parseCaptureAnalysis } from '@/lib/ai/agents/parsers'

interface CaptureAnalysisProps {
  opportunity: {
    id: string
    title: string
    agency: string | null
    ceiling: number | null
    description: string | null
    naics_code: string | null
    set_aside: string | null
  }
  onUpdatePwin?: (_pwin: number) => void
}

export function CaptureAnalysis({
  opportunity,
  onUpdatePwin,
}: CaptureAnalysisProps) {
  const [isPending, startTransition] = useTransition()
  const [suggestions, setSuggestions] = useState<
    TrackChangesSuggestion[] | null
  >(null)
  const [modelName, setModelName] = useState('')

  const handleAnalyze = useCallback(() => {
    startTransition(async () => {
      const response = await runCaptureAnalysis({
        title: opportunity.title,
        agency: opportunity.agency ?? 'Unknown',
        ceiling: opportunity.ceiling,
        description: opportunity.description ?? '',
        naicsCode: opportunity.naics_code,
        setAside: opportunity.set_aside,
        opportunityId: opportunity.id,
      })

      setModelName(response.model_used)

      const parsed = parseCaptureAnalysis(response.content)

      const items: TrackChangesSuggestion[] = [
        {
          id: 'pwin',
          content: `Estimated pWin: ${parsed.pwin}%`,
          because: `Based on agency, ceiling, set-aside type, and competitive factors.`,
          confidence: response.confidence,
          citations: [],
        },
        ...parsed.winThemes.map((theme, i) => ({
          id: `theme-${i}`,
          content: theme,
          because: 'Key differentiator aligned with evaluation criteria.',
          confidence: response.confidence,
          citations: [],
        })),
        ...parsed.riskFactors.map((risk, i) => ({
          id: `risk-${i}`,
          content: `Risk: ${risk}`,
          because: 'Factor that could reduce competitive advantage.',
          confidence: response.confidence,
          citations: [],
        })),
        {
          id: 'landscape',
          content: parsed.competitiveLandscape,
          because: 'Assessment of likely competitive environment.',
          confidence: response.confidence,
          citations: [],
        },
      ]

      setSuggestions(items)
    })
  }, [opportunity, startTransition])

  const handleAccept = useCallback(
    (id: string, content: string) => {
      if (id === 'pwin') {
        const match = content.match(/(\d+)%/)
        if (match && onUpdatePwin) {
          onUpdatePwin(parseInt(match[1], 10))
        }
      }
      addToast('success', 'Item accepted')
    },
    [onUpdatePwin]
  )

  const handleReject = useCallback((_id: string) => {
    addToast('info', 'Item rejected')
  }, [])

  return (
    <div className="space-y-4">
      {!suggestions && (
        <Button onClick={handleAnalyze} disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Analyze Opportunity
        </Button>
      )}

      {isPending && !suggestions && (
        <div className="flex items-center gap-3 rounded-lg border border-border p-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            Running capture analysis...
          </span>
        </div>
      )}

      {suggestions && (
        <TrackChangesBlock
          title="Capture Analysis"
          suggestions={suggestions}
          modelAttribution={modelName}
          onAccept={handleAccept}
          onReject={handleReject}
          onAcceptAll={() =>
            addToast('success', 'All items accepted')
          }
          onRejectAll={() =>
            addToast('info', 'All items rejected')
          }
        />
      )}
    </div>
  )
}
