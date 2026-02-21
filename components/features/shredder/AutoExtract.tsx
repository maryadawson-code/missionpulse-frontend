'use client'

import { useState, useTransition, useCallback } from 'react'
import { Loader2, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { addToast } from '@/components/ui/Toast'
import {
  TrackChangesBlock,
  type TrackChangesSuggestion,
} from '@/components/features/ai/TrackChangesBlock'
import { runComplianceExtraction } from '@/lib/ai/agents/compliance'
import { parseExtractedRequirements } from '@/lib/ai/agents/parsers'
import { createRequirement } from '@/app/(dashboard)/pipeline/[id]/shredder/requirements/actions'

interface AutoExtractProps {
  sourceText: string
  opportunityId: string
  existingCount: number
}

export function AutoExtract({
  sourceText,
  opportunityId,
  existingCount,
}: AutoExtractProps) {
  const [isPending, startTransition] = useTransition()
  const [suggestions, setSuggestions] = useState<
    TrackChangesSuggestion[] | null
  >(null)
  const [modelName, setModelName] = useState('')
  const [acceptedCount, setAcceptedCount] = useState(0)

  const handleExtract = useCallback(() => {
    startTransition(async () => {
      const response = await runComplianceExtraction({
        sourceText,
        opportunityId,
      })

      setModelName(response.model_used)

      const parsed = parseExtractedRequirements(response.content)

      const items: TrackChangesSuggestion[] = parsed.map((req, i) => ({
        id: `req-${i}`,
        content: `[${req.section}] ${req.requirement}`,
        because: req.because,
        confidence: req.confidence,
        citations: [],
      }))

      setSuggestions(items)
    })
  }, [sourceText, opportunityId, startTransition])

  const handleAccept = useCallback(
    (id: string, content: string) => {
      const num = existingCount + acceptedCount + 1
      const reference = `REQ-${String(num).padStart(3, '0')}`

      // Remove section prefix
      const requirementText = content.replace(/^\[.*?\]\s*/, '')

      startTransition(async () => {
        const result = await createRequirement(opportunityId, {
          reference,
          requirement: requirementText,
        })
        if (result.success) {
          setAcceptedCount((prev) => prev + 1)
          addToast('success', `${reference} added to compliance matrix`)
        } else {
          addToast('error', result.error ?? 'Failed to add requirement')
        }
      })
    },
    [opportunityId, existingCount, acceptedCount, startTransition]
  )

  const handleReject = useCallback((_id: string) => {
    // No action needed for rejected AI suggestions
  }, [])

  return (
    <div className="space-y-4">
      {!suggestions && (
        <Button
          onClick={handleExtract}
          disabled={isPending || !sourceText}
          variant="outline"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Auto-Extract Requirements
        </Button>
      )}

      {isPending && !suggestions && (
        <div className="flex items-center gap-3 rounded-lg border border-border p-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            AI is scanning the document for requirements...
          </span>
        </div>
      )}

      {suggestions && (
        <>
          <TrackChangesBlock
            title={`AI-Extracted Requirements (${suggestions.length} found)`}
            suggestions={suggestions}
            modelAttribution={modelName}
            onAccept={handleAccept}
            onReject={handleReject}
          />
          {acceptedCount > 0 && (
            <p className="text-xs text-emerald-400">
              {acceptedCount} requirement{acceptedCount !== 1 ? 's' : ''}{' '}
              added to the compliance matrix.
            </p>
          )}
        </>
      )}
    </div>
  )
}
