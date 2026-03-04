'use client'

import { useState, useTransition, useCallback } from 'react'
import { Loader2, Sparkles, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { addToast } from '@/components/ui/Toast'
import {
  TrackChangesBlock,
  type TrackChangesSuggestion,
} from '@/components/features/ai/TrackChangesBlock'
import { runWriterAgent } from '@/lib/ai/agents/writer'
import { parseWriterOutput } from '@/lib/ai/agents/parsers'
import { persistSuggestionDecision } from '@/lib/actions/track-changes'

interface AIWriterPanelProps {
  sectionTitle: string
  requirements: string[]
  rfpContext: string
  playbookContent: string[]
  opportunityId: string
  sectionId?: string
  onAcceptContent?: (_content: string) => void
}

export function AIWriterPanel({
  sectionTitle,
  requirements,
  rfpContext,
  playbookContent,
  opportunityId,
  sectionId,
  onAcceptContent,
}: AIWriterPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [suggestions, setSuggestions] = useState<
    TrackChangesSuggestion[] | null
  >(null)
  const [modelName, setModelName] = useState('')
  const [acceptedParagraphs, setAcceptedParagraphs] = useState<string[]>([])

  const handleGenerate = useCallback(() => {
    startTransition(async () => {
      const response = await runWriterAgent({
        sectionTitle,
        requirements,
        rfpContext,
        playbookContent,
        opportunityId,
      })

      setModelName(response.model_used)

      const parsed = parseWriterOutput(response.content)

      const items: TrackChangesSuggestion[] = parsed.map((p) => ({
        id: p.id,
        content: p.content,
        because: p.because,
        confidence: p.confidence,
        citations: [],
      }))

      setSuggestions(items)
      setAcceptedParagraphs([])
    })
  }, [
    sectionTitle,
    requirements,
    rfpContext,
    playbookContent,
    opportunityId,
    startTransition,
  ])

  const handleAccept = useCallback(
    (id: string, content: string) => {
      setAcceptedParagraphs((prev) => [...prev, content])
      onAcceptContent?.(content)

      // Fire-and-forget persistence to activity_feed + audit_logs
      if (sectionId) {
        const suggestion = suggestions?.find((s) => s.id === id)
        persistSuggestionDecision({
          suggestionId: id,
          decision: 'accepted',
          sectionId,
          opportunityId,
          content,
          confidence: suggestion?.confidence ?? 'medium',
          modelAttribution: modelName,
        })
      }
    },
    [onAcceptContent, sectionId, opportunityId, suggestions, modelName]
  )

  const handleReject = useCallback(
    (id: string) => {
      // Fire-and-forget persistence to activity_feed + audit_logs
      if (sectionId) {
        const suggestion = suggestions?.find((s) => s.id === id)
        persistSuggestionDecision({
          suggestionId: id,
          decision: 'rejected',
          sectionId,
          opportunityId,
          content: suggestion?.content ?? '',
          confidence: suggestion?.confidence ?? 'medium',
          modelAttribution: modelName,
        })
      }
    },
    [sectionId, opportunityId, suggestions, modelName]
  )

  const handleAcceptAll = useCallback(() => {
    if (!suggestions) return
    const allContent = suggestions.map((s) => s.content)
    setAcceptedParagraphs(allContent)
    onAcceptContent?.(allContent.join('\n\n'))
    addToast('success', 'All paragraphs accepted')
  }, [suggestions, onAcceptContent])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          onClick={handleGenerate}
          disabled={isPending || requirements.length === 0}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : suggestions ? (
            <RefreshCw className="h-4 w-4" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {suggestions ? 'Regenerate Draft' : 'AI Draft'}
        </Button>
        {requirements.length === 0 && (
          <span className="text-xs text-muted-foreground">
            Add requirements first
          </span>
        )}
      </div>

      {isPending && !suggestions && (
        <div className="flex items-center gap-3 rounded-lg border border-border p-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            Drafting {sectionTitle}...
          </span>
        </div>
      )}

      {suggestions && (
        <TrackChangesBlock
          title={`AI Draft: ${sectionTitle}`}
          suggestions={suggestions}
          modelAttribution={modelName}
          onAccept={handleAccept}
          onReject={handleReject}
          onAcceptAll={handleAcceptAll}
          onRejectAll={() =>
            addToast('info', 'Draft rejected — try regenerating')
          }
        />
      )}

      {acceptedParagraphs.length > 0 && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
          <h4 className="mb-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Accepted Content ({acceptedParagraphs.length} paragraph
            {acceptedParagraphs.length !== 1 ? 's' : ''})
          </h4>
          <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {acceptedParagraphs.join('\n\n')}
          </div>
        </div>
      )}
    </div>
  )
}
