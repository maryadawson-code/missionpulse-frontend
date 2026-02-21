'use client'

import { useState, useTransition, useCallback } from 'react'
import { Loader2, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { addToast } from '@/components/ui/Toast'
import {
  TrackChangesBlock,
  type TrackChangesSuggestion,
} from '@/components/features/ai/TrackChangesBlock'
import { runContractsAgent } from '@/lib/ai/agents/contracts'

interface Clause {
  id: string
  clause_number: string
  clause_title: string
  full_text: string | null
}

interface AIClauseAnalysisProps {
  clauses: Clause[]
  opportunityId: string
}

export function AIClauseAnalysis({
  clauses,
  opportunityId,
}: AIClauseAnalysisProps) {
  const [isPending, startTransition] = useTransition()
  const [suggestions, setSuggestions] = useState<TrackChangesSuggestion[] | null>(null)
  const [modelName, setModelName] = useState('')

  const handleAnalyze = useCallback(() => {
    startTransition(async () => {
      const response = await runContractsAgent({
        clauses: clauses.map((c) => ({
          id: c.id,
          clause_number: c.clause_number,
          clause_title: c.clause_title,
          full_text: c.full_text ?? '',
        })),
        opportunityId,
      })

      setModelName(response.model_used)

      const paragraphs = response.content
        .split('\n\n')
        .filter((p) => p.trim().length > 20)

      const items: TrackChangesSuggestion[] = paragraphs.map((p, i) => ({
        id: `clause-${i}`,
        content: p.replace(/\*\*/g, '').trim(),
        because: 'Based on FAR/DFARS clause analysis and business impact assessment.',
        confidence: response.confidence,
        citations: [],
      }))

      setSuggestions(items)
    })
  }, [clauses, opportunityId, startTransition])

  return (
    <div className="space-y-4">
      {!suggestions && (
        <Button
          onClick={handleAnalyze}
          disabled={isPending || clauses.length === 0}
          variant="outline"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Analyze Clauses
        </Button>
      )}

      {isPending && !suggestions && (
        <div className="flex items-center gap-3 rounded-lg border border-border p-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            Analyzing {clauses.length} clauses...
          </span>
        </div>
      )}

      {suggestions && (
        <TrackChangesBlock
          title={`Clause Risk Analysis (${clauses.length} clauses)`}
          suggestions={suggestions}
          modelAttribution={modelName}
          onAccept={(_id, _content) => addToast('success', 'Analysis accepted')}
          onReject={() => {}}
          onAcceptAll={() => addToast('success', 'All analyses accepted')}
          onRejectAll={() => addToast('info', 'All analyses rejected')}
        />
      )}
    </div>
  )
}
