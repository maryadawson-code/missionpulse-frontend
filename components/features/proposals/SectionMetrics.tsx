'use client'

import { FileText, AlignLeft } from 'lucide-react'

interface SectionMetricsProps {
  content: string
  currentPages: number | null
  pageLimit: number | null
}

function estimateWordCount(text: string): number {
  if (!text.trim()) return 0
  return text.trim().split(/\s+/).length
}

function estimatePageCount(wordCount: number): number {
  // ~250 words per page (standard proposal page)
  return Math.ceil(wordCount / 250)
}

export function SectionMetrics({ content, currentPages, pageLimit }: SectionMetricsProps) {
  const wordCount = estimateWordCount(content)
  const estimatedPages = currentPages ?? estimatePageCount(wordCount)
  const limit = pageLimit ?? 0
  const pagePct = limit > 0 ? Math.min(Math.round((estimatedPages / limit) * 100), 100) : 0
  const isOverLimit = limit > 0 && estimatedPages > limit

  return (
    <div className="rounded-xl border border-border bg-card/50 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Section Metrics
      </h3>

      <div className="space-y-3">
        {/* Word Count */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlignLeft className="h-3 w-3" />
            Word Count
          </span>
          <span className="text-sm font-mono text-foreground">{wordCount.toLocaleString()}</span>
        </div>

        {/* Page Count */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" />
            Est. Pages
          </span>
          <span className={`text-sm font-mono ${isOverLimit ? 'text-red-400' : 'text-foreground'}`}>
            {estimatedPages}
            {limit > 0 && <span className="text-muted-foreground"> / {limit}</span>}
          </span>
        </div>

        {/* Progress Bar */}
        {limit > 0 && (
          <div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  isOverLimit
                    ? 'bg-red-500'
                    : pagePct > 80
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(pagePct, 100)}%` }}
              />
            </div>
            {isOverLimit && (
              <p className="mt-1 text-[10px] text-red-400 font-medium">
                Over page limit by {estimatedPages - limit} page{estimatedPages - limit !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
