'use client'

import { useState, useTransition, useCallback } from 'react'
import {
  Search,
  Plus,
  Star,
  Copy,
  Trash2,
  Loader2,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { addToast } from '@/components/ui/Toast'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import {
  createPlaybookEntry,
  updatePlaybookRating,
  incrementUsage,
  deletePlaybookEntry,
} from '@/app/(dashboard)/playbook/actions'

const CATEGORIES = [
  'Past Performance',
  'Boilerplate',
  'Capabilities',
  'Win Themes',
] as const

interface PlaybookEntry {
  id: string
  title: string
  category: string
  user_prompt: string
  keywords: unknown
  quality_rating: string
  effectiveness_score: number
  use_count: number
  created_at: string
}

interface PlaybookBrowserProps {
  entries: PlaybookEntry[]
}

export function PlaybookBrowser({ entries }: PlaybookBrowserProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('All')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PlaybookEntry | null>(null)
  const [isPending, startTransition] = useTransition()

  // Create form state
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState<string>(CATEGORIES[0])
  const [newContent, setNewContent] = useState('')
  const [newKeywords, setNewKeywords] = useState('')

  const filtered = entries.filter((e) => {
    const matchesCategory =
      filterCategory === 'All' || e.category === filterCategory
    const matchesSearch =
      !searchTerm ||
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.user_prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(e.keywords) ? e.keywords : []).some((k) =>
        String(k).toLowerCase().includes(searchTerm.toLowerCase())
      )
    return matchesCategory && matchesSearch
  })

  const handleCreate = useCallback(() => {
    if (!newTitle.trim() || !newContent.trim()) {
      addToast('error', 'Title and content are required')
      return
    }
    const keywords = newKeywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
    startTransition(async () => {
      const result = await createPlaybookEntry({
        title: newTitle.trim(),
        category: newCategory,
        content: newContent.trim(),
        keywords,
      })
      if (result.success) {
        addToast('success', 'Content added to playbook')
        setShowCreate(false)
        setNewTitle('')
        setNewContent('')
        setNewKeywords('')
      } else {
        addToast('error', result.error ?? 'Failed to create entry')
      }
    })
  }, [newTitle, newCategory, newContent, newKeywords, startTransition])

  const handleRate = useCallback(
    (entryId: string, rating: number) => {
      startTransition(async () => {
        const result = await updatePlaybookRating(entryId, rating)
        if (!result.success) {
          addToast('error', result.error ?? 'Failed to update rating')
        }
      })
    },
    [startTransition]
  )

  const handleCopy = useCallback(
    (entry: PlaybookEntry) => {
      navigator.clipboard.writeText(entry.user_prompt)
      addToast('success', 'Copied to clipboard')
      startTransition(async () => {
        await incrementUsage(entry.id)
      })
    },
    [startTransition]
  )

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title, content, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4" />
          Add Content
        </Button>
      </div>

      {/* Category stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CATEGORIES.map((cat) => {
          const count = entries.filter((e) => e.category === cat).length
          return (
            <button
              key={cat}
              onClick={() =>
                setFilterCategory(filterCategory === cat ? 'All' : cat)
              }
              className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                filterCategory === cat
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:bg-card/80'
              }`}
            >
              <p className="text-xs text-muted-foreground">{cat}</p>
              <p className="mt-1 text-lg font-bold text-foreground">{count}</p>
            </button>
          )
        })}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Add Playbook Content
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <textarea
            placeholder="Content (past performance narrative, boilerplate text, capability statement...)"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={6}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="text"
            placeholder="Keywords (comma-separated, e.g. cybersecurity, NIST, FedRAMP)"
            value={newKeywords}
            onChange={(e) => setNewKeywords(e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={isPending || !newTitle.trim() || !newContent.trim()}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border p-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            {searchTerm || filterCategory !== 'All'
              ? 'No matching content found. Try adjusting your search or filter.'
              : 'No playbook content yet. Click "Add Content" to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => {
            const isExpanded = expandedId === entry.id
            return (
              <div
                key={entry.id}
                className="rounded-lg border border-border bg-card"
              >
                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {entry.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Used {entry.use_count}x
                      </span>
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {entry.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {entry.user_prompt}
                    </p>

                    {/* Keywords */}
                    {Array.isArray(entry.keywords) && entry.keywords.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(entry.keywords as string[]).map((kw, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions row */}
                    <div className="mt-2 flex items-center gap-2">
                      {/* Star rating */}
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRate(entry.id, star)}
                            disabled={isPending}
                            className="p-0.5"
                          >
                            <Star
                              className={`h-3.5 w-3.5 ${
                                star <= entry.effectiveness_score
                                  ? 'fill-amber-400 text-amber-600 dark:text-amber-400'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          </button>
                        ))}
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => handleCopy(entry)}
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : entry.id)
                        }
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                        {isExpanded ? 'Collapse' : 'View Full'}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-auto h-7 text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(entry)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-border px-4 py-3">
                    <pre className="whitespace-pre-wrap text-xs text-foreground leading-relaxed font-sans">
                      {entry.user_prompt}
                    </pre>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmModal
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null)
          }}
          title="Delete Playbook Entry"
          description={`Delete "${deleteTarget.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          destructive
          onConfirm={() => deletePlaybookEntry(deleteTarget.id)}
          successMessage="Entry deleted."
          onSuccess={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
