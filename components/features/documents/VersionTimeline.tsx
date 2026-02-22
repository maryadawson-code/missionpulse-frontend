'use client'

import { useState } from 'react'
import { Clock, FileText, Star, ChevronDown, ChevronRight } from 'lucide-react'

interface DocumentVersion {
  id: string
  version_number: number
  version_label: string | null
  changes_summary: string | null
  created_by: string | null
  created_at: string | null
  file_url: string | null
  file_size: number | null
  is_milestone: boolean | null
}

interface VersionTimelineProps {
  versions: DocumentVersion[]
  documentName: string
}

function formatDate(ts: string | null): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function VersionTimeline({ versions, documentName }: VersionTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (versions.length === 0) {
    return (
      <div className="rounded-lg border border-border p-6 text-center">
        <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          No version history available for this document.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{documentName}</h3>
        <span className="text-xs text-muted-foreground">
          {versions.length} version{versions.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-2">
          {versions.map((v, idx) => {
            const isExpanded = expandedId === v.id
            const isLatest = idx === 0

            return (
              <div key={v.id} className="relative pl-8">
                {/* Timeline dot */}
                <div
                  className={`absolute left-1.5 top-3 h-3 w-3 rounded-full border-2 ${
                    isLatest
                      ? 'border-primary bg-primary'
                      : v.is_milestone
                        ? 'border-amber-400 bg-amber-400'
                        : 'border-border bg-background'
                  }`}
                />

                <button
                  onClick={() => setExpandedId(isExpanded ? null : v.id)}
                  className="w-full rounded-lg border border-border p-3 text-left hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium text-foreground">
                        v{v.version_number}
                      </span>
                      {v.version_label && (
                        <span className="text-xs text-muted-foreground">
                          {v.version_label}
                        </span>
                      )}
                      {v.is_milestone && (
                        <Star className="h-3 w-3 text-amber-400" />
                      )}
                      {isLatest && (
                        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          Current
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(v.created_at)}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 space-y-1.5 border-t border-border pt-2">
                      {v.changes_summary && (
                        <p className="text-xs text-muted-foreground">
                          {v.changes_summary}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        {v.created_by && <span>By: {v.created_by}</span>}
                        {v.file_size && (
                          <span className="inline-flex items-center gap-1">
                            <FileText className="h-2.5 w-2.5" />
                            {formatFileSize(v.file_size)}
                          </span>
                        )}
                        {v.file_url && (
                          <a
                            href={v.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Download
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
