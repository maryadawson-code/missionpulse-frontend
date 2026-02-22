'use client'

import { useState, useTransition } from 'react'
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Plus,
  Loader2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { addToast } from '@/components/ui/Toast'
import { createVolumeSection } from '@/app/(dashboard)/proposals/actions'

interface SectionItem {
  id: string
  sectionTitle: string
  sectionNumber: string
  pageAllocation: number | null
  rfpReference: string | null
  assignedTo: string | null
  status: string | null
}

interface VolumeItem {
  id: string
  title: string
  volumeNumber: number | null
  pageLimit: number | null
  notes: string | null
  sections: SectionItem[]
}

interface ProposalDetailClientProps {
  outlineId: string
  opportunityId: string
  volumes: VolumeItem[]
  canEdit: boolean
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-300',
  in_progress: 'bg-blue-500/20 text-blue-300',
  review: 'bg-amber-500/20 text-amber-300',
  final: 'bg-emerald-500/20 text-emerald-300',
}

const VOLUME_COLORS: Record<string, string> = {
  Technical: 'border-blue-500/40',
  Management: 'border-purple-500/40',
  'Past Performance': 'border-amber-500/40',
  Cost: 'border-emerald-500/40',
}

export function ProposalDetailClient({
  outlineId: _outlineId,
  opportunityId: _opportunityId,
  volumes,
  canEdit,
}: ProposalDetailClientProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(volumes.map((v) => [v.id, true]))
  )
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newNumber, setNewNumber] = useState('')
  const [newPages, setNewPages] = useState('')
  const [newRef, setNewRef] = useState('')
  const [isPending, startTransition] = useTransition()

  function toggleVolume(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function handleAddSection(volumeId: string) {
    if (!newTitle.trim() || !newNumber.trim()) return
    startTransition(async () => {
      const result = await createVolumeSection(
        volumeId,
        newTitle.trim(),
        newNumber.trim(),
        newPages ? parseInt(newPages, 10) : null,
        newRef.trim() || null
      )
      if (result.success) {
        addToast('success', 'Section added')
        setAddingTo(null)
        setNewTitle('')
        setNewNumber('')
        setNewPages('')
        setNewRef('')
      } else {
        addToast('error', result.error ?? 'Failed to add section')
      }
    })
  }

  if (volumes.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          No volumes configured for this proposal. Add volumes via the database or admin panel.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {volumes.map((volume) => {
        const borderColor = VOLUME_COLORS[volume.title] ?? 'border-gray-500/40'
        const isExpanded = expanded[volume.id] ?? false
        const totalPages = volume.sections.reduce(
          (acc, s) => acc + (s.pageAllocation ?? 0),
          0
        )

        return (
          <div
            key={volume.id}
            className={`rounded-xl border-l-4 ${borderColor} border border-border bg-card`}
          >
            {/* Volume Header */}
            <button
              onClick={() => toggleVolume(volume.id)}
              className="flex w-full items-center justify-between px-5 py-4"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">
                    {volume.volumeNumber != null
                      ? `Volume ${volume.volumeNumber}: `
                      : ''}
                    {volume.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {volume.sections.length} section
                    {volume.sections.length !== 1 ? 's' : ''}
                    {volume.pageLimit
                      ? ` · ${totalPages}/${volume.pageLimit} pages`
                      : ''}
                  </p>
                </div>
              </div>
              {volume.pageLimit && totalPages > volume.pageLimit && (
                <span className="text-xs text-red-400 font-medium">
                  Over limit
                </span>
              )}
            </button>

            {/* Sections */}
            {isExpanded && (
              <div className="border-t border-border">
                {volume.sections.length === 0 ? (
                  <p className="px-5 py-3 text-xs text-muted-foreground">
                    No sections yet.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {volume.sections.map((section) => (
                      <div
                        key={section.id}
                        className="flex items-center justify-between px-5 py-2.5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-mono text-muted-foreground w-8 shrink-0">
                            {section.sectionNumber}
                          </span>
                          <span className="text-sm text-foreground truncate">
                            {section.sectionTitle}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {section.pageAllocation && (
                            <span className="text-xs text-muted-foreground">
                              {section.pageAllocation}p
                            </span>
                          )}
                          {section.rfpReference && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {section.rfpReference}
                            </span>
                          )}
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[section.status ?? 'draft'] ?? STATUS_BADGE.draft}`}
                          >
                            {(section.status ?? 'draft').replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Section Form */}
                {canEdit && addingTo === volume.id ? (
                  <div className="border-t border-border px-5 py-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <input
                        type="text"
                        value={newNumber}
                        onChange={(e) => setNewNumber(e.target.value)}
                        placeholder="L.1.2"
                        className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                      />
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Section title"
                        className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                      />
                      <input
                        type="number"
                        value={newPages}
                        onChange={(e) => setNewPages(e.target.value)}
                        placeholder="Pages"
                        className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                      />
                      <input
                        type="text"
                        value={newRef}
                        onChange={(e) => setNewRef(e.target.value)}
                        placeholder="RFP ref"
                        className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAddSection(volume.id)}
                        disabled={isPending || !newTitle.trim() || !newNumber.trim()}
                      >
                        {isPending && (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setAddingTo(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : canEdit ? (
                  <div className="border-t border-border px-5 py-2">
                    <button
                      onClick={() => setAddingTo(volume.id)}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Plus className="h-3 w-3" /> Add section
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
