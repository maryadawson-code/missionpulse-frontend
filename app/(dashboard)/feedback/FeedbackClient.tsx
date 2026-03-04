'use client'

import { useState, useTransition } from 'react'
import { ThumbsUp, Plus, X, Loader2, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addToast } from '@/components/ui/Toast'
import { submitFeatureSuggestion, voteForSuggestion } from './actions'

interface Suggestion {
  id: string
  title: string
  description: string | null
  category: string
  status: string | null
  votes: number | null
  submitted_by: string | null
  created_at: string | null
  hasVoted: boolean
}

const CATEGORIES = [
  'Pipeline',
  'Proposals',
  'Compliance',
  'Analytics',
  'AI Agents',
  'Integrations',
  'Documents',
  'General',
]

function statusStyle(status: string | null): string {
  switch (status) {
    case 'planned':
      return 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
    case 'in_progress':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
    case 'delivered':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
    case 'declined':
      return 'bg-red-500/15 text-red-700 dark:text-red-300'
    default:
      return 'bg-slate-500/15 text-slate-700 dark:text-slate-300'
  }
}

export function FeedbackClient({
  suggestions: initialSuggestions,
}: {
  suggestions: Suggestion[]
}) {
  const [suggestions, setSuggestions] = useState(initialSuggestions)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('General')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!title.trim()) return
    startTransition(async () => {
      const result = await submitFeatureSuggestion(
        title.trim(),
        description.trim(),
        category
      )
      if (result.success) {
        addToast('success', 'Suggestion submitted!')
        setSuggestions((prev) => [
          {
            id: Date.now().toString(),
            title: title.trim(),
            description: description.trim(),
            category,
            status: 'submitted',
            votes: 1,
            submitted_by: null,
            created_at: new Date().toISOString(),
            hasVoted: true,
          },
          ...prev,
        ])
        setTitle('')
        setDescription('')
        setCategory('General')
        setShowForm(false)
      } else {
        addToast('error', result.error ?? 'Failed to submit')
      }
    })
  }

  function handleVote(id: string) {
    startTransition(async () => {
      const result = await voteForSuggestion(id)
      if (result.success) {
        setSuggestions((prev) =>
          prev.map((s) =>
            s.id === id
              ? { ...s, votes: (s.votes ?? 0) + 1, hasVoted: true }
              : s
          )
        )
      } else {
        addToast('error', result.error ?? 'Failed to vote')
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Submit button */}
      <div className="flex justify-end">
        {showForm ? (
          <div className="w-full rounded-xl border border-border bg-card/50 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                New Suggestion
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Feature title..."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the feature you'd like to see..."
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <div className="flex items-center gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <Button size="sm" onClick={handleSubmit} disabled={isPending}>
                {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                Submit
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" />
            Suggest Feature
          </Button>
        )}
      </div>

      {/* Suggestions list */}
      {suggestions.length === 0 ? (
        <div className="rounded-lg border border-border p-12 text-center">
          <Lightbulb className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No suggestions yet. Be the first to share an idea!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {suggestions.map((s) => (
            <div
              key={s.id}
              className="flex items-start gap-4 rounded-xl border border-border bg-card/50 px-5 py-4"
            >
              {/* Vote button */}
              <button
                onClick={() => !s.hasVoted && handleVote(s.id)}
                disabled={s.hasVoted || isPending}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition-colors ${
                  s.hasVoted
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <ThumbsUp className="h-4 w-4" />
                <span className="text-xs font-medium">{s.votes ?? 0}</span>
              </button>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground">{s.title}</h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    {s.category}
                  </span>
                  {s.status && s.status !== 'submitted' && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle(
                        s.status
                      )}`}
                    >
                      {s.status.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
                {s.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
