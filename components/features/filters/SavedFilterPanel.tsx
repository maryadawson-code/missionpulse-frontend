'use client'

import { useState, useTransition } from 'react'
import { Bookmark, Trash2, Loader2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addToast } from '@/components/ui/Toast'
import { createSavedFilter, deleteSavedFilter } from '@/lib/actions/saved-filters'

interface SavedFilter {
  id: string
  name: string
  filters: unknown
  is_default: boolean | null
}

interface SavedFilterPanelProps {
  savedFilters: SavedFilter[]
  currentFilters: Record<string, unknown>
  onApply: (_filters: Record<string, unknown>) => void
}

export function SavedFilterPanel({
  savedFilters: initialFilters,
  currentFilters,
  onApply,
}: SavedFilterPanelProps) {
  const [filters, setFilters] = useState(initialFilters)
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [name, setName] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    if (!name.trim()) return
    startTransition(async () => {
      const result = await createSavedFilter(name.trim(), currentFilters)
      if (result.success) {
        addToast('success', `View "${name}" saved`)
        setFilters((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            name: name.trim(),
            filters: currentFilters,
            is_default: false,
          },
        ])
        setName('')
        setShowSaveForm(false)
      } else {
        addToast('error', result.error ?? 'Failed to save')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteSavedFilter(id)
      if (result.success) {
        setFilters((prev) => prev.filter((f) => f.id !== id))
        addToast('success', 'View deleted')
      } else {
        addToast('error', result.error ?? 'Failed to delete')
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      {/* Saved Views Dropdown */}
      {filters.length > 0 && (
        <div className="flex items-center gap-1">
          <Bookmark className="h-3 w-3 text-muted-foreground" />
          {filters.map((f) => (
            <div key={f.id} className="group flex items-center gap-1">
              <button
                onClick={() => onApply(f.filters as Record<string, unknown>)}
                className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground hover:border-primary/40 hover:text-primary transition-colors"
              >
                {f.name}
                {f.is_default && (
                  <span className="ml-1 text-[10px] text-primary">*</span>
                )}
              </button>
              <button
                onClick={() => handleDelete(f.id)}
                className="hidden rounded p-0.5 text-muted-foreground hover:text-red-600 dark:text-red-400 group-hover:inline-flex"
              >
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Save Current Filters */}
      {showSaveForm ? (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="View name..."
            className="h-7 w-[120px] rounded-md border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
          />
          <Button size="sm" onClick={handleSave} disabled={isPending} className="h-7 px-2">
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
          </Button>
          <button
            onClick={() => setShowSaveForm(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowSaveForm(true)}
          className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Plus className="h-3 w-3" />
          Save View
        </button>
      )}
    </div>
  )
}
