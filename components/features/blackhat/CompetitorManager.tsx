'use client'

import { useState, useTransition } from 'react'
import { Loader2, Plus, Shield, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { addToast } from '@/components/ui/Toast'
import {
  addCompetitor,
  deleteCompetitor,
} from '@/app/(dashboard)/pipeline/[id]/strategy/actions'

interface Competitor {
  id: string
  name: string
  threat_level: string | null
  pwin_estimate: number | null
  incumbent: boolean | null
  strengths: string[] | null
  weaknesses: string[] | null
  likely_strategy: string | null
  counter_strategy: string | null
  ghost_themes: string[] | null
}

interface CompetitorManagerProps {
  opportunityId: string
  competitors: Competitor[]
}

function threatColor(level: string | null): string {
  switch (level) {
    case 'high':
    case 'critical':
      return 'bg-red-500/20 text-red-300'
    case 'medium':
      return 'bg-amber-500/20 text-amber-300'
    case 'low':
      return 'bg-emerald-500/20 text-emerald-300'
    default:
      return 'bg-gray-500/20 text-gray-300'
  }
}

export function CompetitorManager({
  opportunityId,
  competitors,
}: CompetitorManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function handleAddCompetitor(formData: FormData) {
    formData.set('opportunityId', opportunityId)
    startTransition(async () => {
      const result = await addCompetitor(formData)
      if (result.success) {
        addToast('success', 'Competitor added')
        setShowAdd(false)
      } else {
        addToast('error', result.error ?? 'Failed to add competitor')
      }
    })
  }

  function handleDelete(competitorId: string) {
    startTransition(async () => {
      const result = await deleteCompetitor(competitorId, opportunityId)
      if (result.success) {
        addToast('success', 'Competitor removed')
        setConfirmDelete(null)
      } else {
        addToast('error', result.error ?? 'Failed to remove competitor')
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-red-400" />
          <h3 className="text-sm font-semibold text-foreground">
            Competitor Profiles ({competitors.length})
          </h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdd(!showAdd)}
        >
          <Plus className="h-4 w-4" />
          Add Competitor
        </Button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <form
          action={handleAddCompetitor}
          className="rounded-lg border border-border bg-card p-4 space-y-3"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Competitor Name
              </label>
              <input
                name="name"
                required
                placeholder="e.g., Booz Allen Hamilton"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Threat Level
              </label>
              <select
                name="threatLevel"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Estimated pWin
              </label>
              <input
                name="pwinEstimate"
                type="number"
                min={0}
                max={100}
                placeholder="e.g., 60"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  name="incumbent"
                  value="true"
                  className="rounded border-border"
                />
                Incumbent
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Strengths (one per line)
              </label>
              <textarea
                name="strengths"
                rows={3}
                placeholder="Strong past performance with DHA&#10;Large bench of cleared staff&#10;Incumbent advantage"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Weaknesses (one per line)
              </label>
              <textarea
                name="weaknesses"
                rows={3}
                placeholder="High rates due to company size&#10;Recent turnover on similar contracts&#10;No small business partnerships"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Competitor
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdd(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Competitor Cards */}
      {competitors.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
          No competitors profiled yet. Add competitors to begin Black Hat analysis.
        </div>
      ) : (
        competitors.map((comp) => (
          <div
            key={comp.id}
            className="rounded-xl border border-border bg-card"
          >
            {/* Card Header */}
            <div
              className="flex items-center justify-between px-5 py-3 cursor-pointer"
              onClick={() =>
                setExpanded(expanded === comp.id ? null : comp.id)
              }
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${threatColor(comp.threat_level)}`}
                >
                  {comp.threat_level ?? 'unknown'}
                </span>
                <h4 className="text-sm font-semibold text-foreground">
                  {comp.name}
                </h4>
                {comp.incumbent && (
                  <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-300">
                    INCUMBENT
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {comp.pwin_estimate != null && (
                  <span className="text-sm font-mono text-muted-foreground">
                    pWin: {comp.pwin_estimate}%
                  </span>
                )}
                {confirmDelete === comp.id ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(comp.id)
                      }}
                      disabled={isPending}
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setConfirmDelete(null)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setConfirmDelete(comp.id)
                    }}
                    className="text-muted-foreground hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Expanded Detail */}
            {expanded === comp.id && (
              <div className="border-t border-border px-5 py-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <h5 className="text-xs font-semibold uppercase text-emerald-400 mb-2">
                      Strengths
                    </h5>
                    {comp.strengths && comp.strengths.length > 0 ? (
                      <ul className="space-y-1">
                        {comp.strengths.map((s, i) => (
                          <li
                            key={i}
                            className="text-xs text-muted-foreground flex items-start gap-1.5"
                          >
                            <span className="text-emerald-400 mt-0.5">+</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No strengths recorded
                      </p>
                    )}
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold uppercase text-red-400 mb-2">
                      Weaknesses
                    </h5>
                    {comp.weaknesses && comp.weaknesses.length > 0 ? (
                      <ul className="space-y-1">
                        {comp.weaknesses.map((w, i) => (
                          <li
                            key={i}
                            className="text-xs text-muted-foreground flex items-start gap-1.5"
                          >
                            <span className="text-red-400 mt-0.5">-</span>
                            {w}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No weaknesses recorded
                      </p>
                    )}
                  </div>
                </div>

                {comp.likely_strategy && (
                  <div>
                    <h5 className="text-xs font-semibold uppercase text-amber-400 mb-1">
                      Likely Strategy
                    </h5>
                    <p className="text-xs text-muted-foreground">
                      {comp.likely_strategy}
                    </p>
                  </div>
                )}

                {comp.counter_strategy && (
                  <div>
                    <h5 className="text-xs font-semibold uppercase text-primary mb-1">
                      Counter Strategy
                    </h5>
                    <p className="text-xs text-muted-foreground">
                      {comp.counter_strategy}
                    </p>
                  </div>
                )}

                {comp.ghost_themes && comp.ghost_themes.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold uppercase text-purple-400 mb-1">
                      Ghost Win Themes
                    </h5>
                    <ul className="space-y-1">
                      {comp.ghost_themes.map((theme, i) => (
                        <li
                          key={i}
                          className="text-xs text-muted-foreground"
                        >
                          {i + 1}. {theme}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
