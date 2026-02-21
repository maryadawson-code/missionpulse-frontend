'use client'

import { useState, useTransition, useCallback } from 'react'
import { Loader2, Sparkles, DollarSign } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { addToast } from '@/components/ui/Toast'
import {
  TrackChangesBlock,
  type TrackChangesSuggestion,
} from '@/components/features/ai/TrackChangesBlock'
import { runPricingAgent } from '@/lib/ai/agents/pricing'

interface PricingAIProps {
  opportunity: {
    id: string
    title: string
    agency: string
    description: string
    naicsCode: string | null
    ceiling: number | null
  }
  requirements: string[]
  existingLCATs: string[]
}

export function PricingAI({
  opportunity,
  requirements,
  existingLCATs,
}: PricingAIProps) {
  const [isPending, startTransition] = useTransition()
  const [suggestions, setSuggestions] = useState<TrackChangesSuggestion[] | null>(null)
  const [modelName, setModelName] = useState('')

  const handleGenerate = useCallback(() => {
    startTransition(async () => {
      const response = await runPricingAgent({
        title: opportunity.title,
        agency: opportunity.agency,
        description: opportunity.description,
        naicsCode: opportunity.naicsCode,
        ceiling: opportunity.ceiling,
        requirements,
        existingLCATs,
        opportunityId: opportunity.id,
      })

      setModelName(response.model_used)

      // Parse response into sections
      const sections = response.content.split(/\*\*([^*]+)\*\*/)
      const items: TrackChangesSuggestion[] = []

      let currentTitle = ''
      for (const section of sections) {
        const trimmed = section.trim()
        if (trimmed.length < 10) {
          currentTitle = trimmed
          continue
        }

        // Split each section by "Because:" delimiter
        const parts = trimmed.split(/Because:/i)
        const content = parts[0]?.trim()
        const because = parts[1]?.split('\n')[0]?.trim()

        if (content && content.length > 20) {
          items.push({
            id: crypto.randomUUID(),
            content: currentTitle
              ? `**${currentTitle}**\n\n${content}`
              : content,
            because: because ?? 'Based on market analysis and agency pricing patterns.',
            confidence: response.confidence,
            citations: [],
          })
          currentTitle = ''
        }
      }

      // Fallback: split by paragraphs if parsing found too few items
      if (items.length < 3) {
        const paragraphs = response.content
          .split('\n\n')
          .filter((p) => p.trim().length > 30)

        const rawItems: TrackChangesSuggestion[] = paragraphs.map((p, i) => ({
          id: `pricing-${i}`,
          content: p.replace(/\*\*/g, '').trim(),
          because: 'Generated from opportunity analysis and market data.',
          confidence: response.confidence,
          citations: [],
        }))

        setSuggestions(rawItems)
      } else {
        setSuggestions(items)
      }
    })
  }, [opportunity, requirements, existingLCATs])

  return (
    <div className="space-y-4">
      {!suggestions && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-950/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="h-6 w-6 text-amber-400" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                AI Pricing Advisor
              </h3>
              <p className="text-xs text-muted-foreground">
                Generate LCAT recommendations, BOE framework, and price-to-win
                analysis. CUI//SP-PROPIN — routed via AskSage only.
              </p>
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate BOE &amp; Pricing Recommendations
          </Button>
        </div>
      )}

      {isPending && !suggestions && (
        <div className="flex items-center gap-3 rounded-lg border border-border p-6">
          <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
          <span className="text-sm text-muted-foreground">
            Generating pricing analysis via AskSage (CUI-protected)...
          </span>
        </div>
      )}

      {suggestions && (
        <TrackChangesBlock
          title={`Pricing Recommendations (${suggestions.length} items)`}
          suggestions={suggestions}
          modelAttribution={modelName}
          onAccept={() => addToast('success', 'Pricing recommendation saved')}
          onReject={() => {}}
          onAcceptAll={() => addToast('success', 'All recommendations saved')}
          onRejectAll={() => addToast('info', 'Recommendations rejected')}
        />
      )}
    </div>
  )
}
