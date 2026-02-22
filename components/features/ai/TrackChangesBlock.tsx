'use client'

import { useState, useCallback } from 'react'
import { Check, X, Pencil, CheckCheck, XCircle, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ConfidenceBadge } from './ConfidenceBadge'
import { CitationLink } from './CitationLink'
import { BecauseStatement } from './BecauseStatement'

export interface TrackChangesSuggestion {
  id: string
  content: string
  because: string
  confidence: 'high' | 'medium' | 'low'
  citations: string[]
}

interface TrackChangesBlockProps {
  title: string
  suggestions: TrackChangesSuggestion[]
  modelAttribution: string
  onAccept: (_id: string, _content: string) => void
  onReject: (_id: string) => void
  onAcceptAll?: () => void
  onRejectAll?: () => void
}

type ItemStatus = 'pending' | 'accepted' | 'rejected'

export function TrackChangesBlock({
  title,
  suggestions,
  modelAttribution,
  onAccept,
  onReject,
  onAcceptAll,
  onRejectAll,
}: TrackChangesBlockProps) {
  const [statuses, setStatuses] = useState<Record<string, ItemStatus>>(
    () => {
      const initial: Record<string, ItemStatus> = {}
      for (const s of suggestions) {
        initial[s.id] = 'pending'
      }
      return initial
    }
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const pendingCount = Object.values(statuses).filter(
    (s) => s === 'pending'
  ).length

  const handleAccept = useCallback(
    (suggestion: TrackChangesSuggestion) => {
      const content =
        editingId === suggestion.id ? editText : suggestion.content
      setStatuses((prev) => ({ ...prev, [suggestion.id]: 'accepted' }))
      setEditingId(null)
      onAccept(suggestion.id, content)
    },
    [editingId, editText, onAccept]
  )

  const handleReject = useCallback(
    (id: string) => {
      setStatuses((prev) => ({ ...prev, [id]: 'rejected' }))
      setEditingId(null)
      onReject(id)
    },
    [onReject]
  )

  const handleEdit = useCallback(
    (suggestion: TrackChangesSuggestion) => {
      setEditingId(suggestion.id)
      setEditText(suggestion.content)
    },
    []
  )

  const handleAcceptAllItems = useCallback(() => {
    const next: Record<string, ItemStatus> = {}
    for (const s of suggestions) {
      next[s.id] = 'accepted'
    }
    setStatuses(next)
    onAcceptAll?.()
  }, [suggestions, onAcceptAll])

  const handleRejectAllItems = useCallback(() => {
    const next: Record<string, ItemStatus> = {}
    for (const s of suggestions) {
      next[s.id] = 'rejected'
    }
    setStatuses(next)
    onRejectAll?.()
  }, [suggestions, onRejectAll])

  return (
    <div className="rounded-xl border border-primary/30 bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {pendingCount > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {pendingCount} pending review
          </span>
        )}
      </div>

      {/* Batch actions */}
      {pendingCount > 1 && (
        <div className="flex items-center gap-2 border-b border-border bg-primary/5 px-4 py-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs text-emerald-400"
            onClick={handleAcceptAllItems}
          >
            <CheckCheck className="h-3 w-3" />
            Accept All
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs text-red-400"
            onClick={handleRejectAllItems}
          >
            <XCircle className="h-3 w-3" />
            Reject All
          </Button>
        </div>
      )}

      {/* Suggestions */}
      <div className="divide-y divide-border">
        {suggestions.map((suggestion) => {
          const status = statuses[suggestion.id]
          const isEditing = editingId === suggestion.id

          return (
            <div
              key={suggestion.id}
              className={`px-4 py-3 transition-colors ${
                status === 'accepted'
                  ? 'bg-emerald-500/5'
                  : status === 'rejected'
                    ? 'bg-red-500/5 opacity-50'
                    : ''
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1 space-y-2">
                  {/* Status + Confidence */}
                  <div className="flex items-center gap-2">
                    <ConfidenceBadge level={suggestion.confidence} />
                    {status === 'accepted' && (
                      <span className="text-[10px] font-medium text-emerald-400">
                        Accepted
                      </span>
                    )}
                    {status === 'rejected' && (
                      <span className="text-[10px] font-medium text-red-400">
                        Rejected
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  {isEditing ? (
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={4}
                      className="w-full rounded-md border border-primary/50 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  ) : (
                    <p
                      className={`text-sm leading-relaxed ${
                        status === 'accepted'
                          ? 'text-foreground'
                          : status === 'rejected'
                            ? 'text-muted-foreground line-through'
                            : 'text-foreground border-l-2 border-primary/40 pl-3'
                      }`}
                    >
                      {suggestion.content}
                    </p>
                  )}

                  {/* Because statement */}
                  {status === 'pending' && (
                    <BecauseStatement reason={suggestion.because} />
                  )}

                  {/* Citations */}
                  {suggestion.citations.length > 0 && status !== 'rejected' && (
                    <div className="flex flex-wrap gap-2">
                      {suggestion.citations.map((cite, i) => (
                        <CitationLink
                          key={i}
                          citation={cite}
                          index={i}
                        />
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  {status === 'pending' && (
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-emerald-400 hover:text-emerald-300"
                        onClick={() => handleAccept(suggestion)}
                      >
                        <Check className="h-3 w-3" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-red-400 hover:text-red-300"
                        onClick={() => handleReject(suggestion.id)}
                      >
                        <X className="h-3 w-3" />
                        Reject
                      </Button>
                      {isEditing ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel Edit
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => handleEdit(suggestion)}
                        >
                          <Pencil className="h-3 w-3" />
                          Modify
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Model attribution + AI disclaimer */}
      <div className="border-t border-border px-4 py-2 space-y-1">
        <p className="text-[10px] font-medium text-amber-400/80">
          AI GENERATED — REQUIRES HUMAN REVIEW
        </p>
        <p className="text-[10px] text-muted-foreground">
          Generated by {modelAttribution} via AskSage. All data on this page is handled via AskSage (FedRAMP).
        </p>
      </div>
    </div>
  )
}
