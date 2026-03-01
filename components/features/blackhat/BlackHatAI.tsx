'use client'

import { useState, useTransition, useCallback } from 'react'
import { Loader2, Sparkles, Shield } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { addToast } from '@/components/ui/Toast'
import {
  TrackChangesBlock,
  type TrackChangesSuggestion,
} from '@/components/features/ai/TrackChangesBlock'
import {
  runBlackHatAgent,
  runMultiCompetitorBlackHat,
} from '@/lib/ai/agents/blackhat'
import { updateCompetitor } from '@/app/(dashboard)/pipeline/[id]/strategy/actions'

interface Competitor {
  id: string
  name: string
  strengths: string[] | null
  weaknesses: string[] | null
}

interface BlackHatAIProps {
  opportunity: {
    id: string
    title: string
    agency: string
    description: string
  }
  competitors: Competitor[]
}

export function BlackHatAI({ opportunity, competitors }: BlackHatAIProps) {
  const [isPending, startTransition] = useTransition()
  const [suggestions, setSuggestions] = useState<TrackChangesSuggestion[] | null>(null)
  const [modelName, setModelName] = useState('')
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('all')

  const handleGenerate = useCallback(() => {
    startTransition(async () => {
      let response

      if (selectedCompetitor === 'all') {
        response = await runMultiCompetitorBlackHat({
          opportunityTitle: opportunity.title,
          agency: opportunity.agency,
          description: opportunity.description,
          competitors: competitors.map((c) => ({
            name: c.name,
            strengths: c.strengths ?? [],
            weaknesses: c.weaknesses ?? [],
          })),
          opportunityId: opportunity.id,
        })
      } else {
        const comp = competitors.find((c) => c.id === selectedCompetitor)
        if (!comp) return
        response = await runBlackHatAgent({
          opportunityTitle: opportunity.title,
          agency: opportunity.agency,
          description: opportunity.description,
          competitorName: comp.name,
          competitorStrengths: comp.strengths ?? [],
          competitorWeaknesses: comp.weaknesses ?? [],
          opportunityId: opportunity.id,
        })
      }

      setModelName(response.model_used)

      // Parse into sections
      const paragraphs = response.content
        .split('\n\n')
        .filter((p) => p.trim().length > 30)

      const items: TrackChangesSuggestion[] = paragraphs.map((p, i) => {
        const becauseMatch = p.match(/Because:?\s*(.+)/i)
        const content = becauseMatch
          ? p.slice(0, becauseMatch.index).trim()
          : p.trim()
        const because = becauseMatch?.[1]?.trim()

        return {
          id: `bh-${i}`,
          content: content.replace(/\*\*/g, ''),
          because: because ?? 'Based on competitive intelligence analysis.',
          confidence: response.confidence,
          citations: [],
        }
      })

      setSuggestions(items)
    })
  }, [opportunity, competitors, selectedCompetitor])

  function handleAccept(id: string, content: string) {
    // If analyzing a single competitor, save strategy to their profile
    if (selectedCompetitor !== 'all') {
      const formData = new FormData()
      formData.set('competitorId', selectedCompetitor)
      formData.set('opportunityId', opportunity.id)
      formData.set('counterStrategy', content.slice(0, 500))

      startTransition(async () => {
        const result = await updateCompetitor(formData)
        if (result.success) {
          addToast('success', 'Counter-strategy saved to competitor profile')
        }
      })
    } else {
      addToast('success', 'Analysis item accepted')
    }
  }

  if (competitors.length === 0) return null

  return (
    <div className="space-y-4">
      {!suggestions && (
        <div className="rounded-lg border border-red-500/20 bg-red-50 dark:bg-red-950/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                AI Black Hat Analyst
              </h3>
              <p className="text-xs text-muted-foreground">
                Generate ghost strategies, counter-tactics, and vulnerability
                analysis. CUI//OPSEC — routed via AskSage only.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedCompetitor}
              onChange={(e) => setSelectedCompetitor(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="all">
                All Competitors ({competitors.length})
              </option>
              {competitors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <Button onClick={handleGenerate} disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Run Black Hat Review
            </Button>
          </div>
        </div>
      )}

      {isPending && !suggestions && (
        <div className="flex items-center gap-3 rounded-lg border border-border p-6">
          <Loader2 className="h-5 w-5 animate-spin text-red-600 dark:text-red-400" />
          <span className="text-sm text-muted-foreground">
            Generating Black Hat analysis via AskSage (OPSEC-protected)...
          </span>
        </div>
      )}

      {suggestions && (
        <>
          <TrackChangesBlock
            title={`Black Hat Review (${suggestions.length} items)`}
            suggestions={suggestions}
            modelAttribution={modelName}
            onAccept={handleAccept}
            onReject={() => {}}
            onAcceptAll={() => addToast('success', 'All analysis items saved')}
            onRejectAll={() => addToast('info', 'Analysis rejected')}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSuggestions(null)}
          >
            Run New Analysis
          </Button>
        </>
      )}
    </div>
  )
}
