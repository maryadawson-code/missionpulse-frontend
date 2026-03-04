// filepath: components/features/proposals/VersionDiff.tsx
/**
 * Version Diff Viewer
 *
 * Side-by-side diff viewer for comparing two versions of a proposal
 * document. Users select two versions from dropdowns and see a
 * color-coded diff: green for additions, red for deletions, amber
 * for modifications.
 *
 * Uses the diff engine to compute line-level changes between the
 * serialized snapshots of the selected versions.
 *
 * v1.3 Sprint 30 — Cross-Document Intelligence
 */
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  GitCompareArrows,
  Loader2,
  Plus,
  Minus,
  PenLine,
  FileText,
  ArrowLeftRight,
} from 'lucide-react'
import { getVersionHistory, getVersionDiff } from '@/lib/sync/version-tracker'
import type { DocumentVersion, DiffResult } from '@/lib/types/sync'

// ─── Props ────────────────────────────────────────────────────

interface VersionDiffProps {
  documentId: string
  opportunityId: string
}

// ─── Component ────────────────────────────────────────────────

export function VersionDiff({ documentId, opportunityId: _opportunityId }: VersionDiffProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [diffLoading, setDiffLoading] = useState(false)

  const [leftVersionId, setLeftVersionId] = useState<string | null>(null)
  const [rightVersionId, setRightVersionId] = useState<string | null>(null)
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null)

  // ─── Load Versions ───────────────────────────────────────

  const loadVersions = useCallback(async () => {
    setLoading(true)

    try {
      const history = await getVersionHistory(documentId, 100)
      setVersions(history)

      // Auto-select the two most recent versions if available
      if (history.length >= 2) {
        setLeftVersionId(history[1].id)
        setRightVersionId(history[0].id)
      } else if (history.length === 1) {
        setRightVersionId(history[0].id)
      }
    } catch {
      // Versions will remain empty
    } finally {
      setLoading(false)
    }
  }, [documentId])

  useEffect(() => {
    loadVersions()
  }, [loadVersions])

  // ─── Compute Diff ────────────────────────────────────────

  const computeVersionDiff = useCallback(async () => {
    if (!leftVersionId || !rightVersionId) {
      setDiffResult(null)
      return
    }

    if (leftVersionId === rightVersionId) {
      setDiffResult({ additions: [], deletions: [], modifications: [], unchanged: 0 })
      return
    }

    setDiffLoading(true)
    try {
      const result = await getVersionDiff(leftVersionId, rightVersionId)
      setDiffResult(result)
    } catch {
      setDiffResult(null)
    } finally {
      setDiffLoading(false)
    }
  }, [leftVersionId, rightVersionId])

  useEffect(() => {
    computeVersionDiff()
  }, [computeVersionDiff])

  // ─── Diff Stats ──────────────────────────────────────────

  const stats = useMemo(() => {
    if (!diffResult) return null
    return {
      additions: diffResult.additions.length,
      deletions: diffResult.deletions.length,
      modifications: diffResult.modifications.length,
      unchanged: diffResult.unchanged,
    }
  }, [diffResult])

  // ─── Render ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading version history...</span>
      </div>
    )
  }

  if (versions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card/30 px-6 py-10 text-center">
        <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No versions recorded yet.</p>
        <p className="text-xs text-muted-foreground mt-1">
          Versions are created automatically when the document is saved.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Version selectors */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
            Base Version (Old)
          </label>
          <Select
            value={leftVersionId ?? ''}
            onValueChange={(val) => setLeftVersionId(val || null)}
          >
            <SelectTrigger className="w-full bg-card/50 border-border text-muted-foreground text-xs">
              <SelectValue placeholder="Select base version" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              {versions.map((ver) => (
                <SelectItem
                  key={ver.id}
                  value={ver.id}
                  className="text-xs text-muted-foreground focus:bg-muted focus:text-foreground"
                >
                  v{ver.version_number} — {formatSource(ver.source)} — {formatDate(ver.created_at)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ArrowLeftRight className="h-4 w-4 text-muted-foreground mt-5 shrink-0" />

        <div className="flex-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
            Compare Version (New)
          </label>
          <Select
            value={rightVersionId ?? ''}
            onValueChange={(val) => setRightVersionId(val || null)}
          >
            <SelectTrigger className="w-full bg-card/50 border-border text-muted-foreground text-xs">
              <SelectValue placeholder="Select compare version" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              {versions.map((ver) => (
                <SelectItem
                  key={ver.id}
                  value={ver.id}
                  className="text-xs text-muted-foreground focus:bg-muted focus:text-foreground"
                >
                  v{ver.version_number} — {formatSource(ver.source)} — {formatDate(ver.created_at)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Diff stats bar */}
      {stats && !diffLoading && (
        <div className="flex items-center gap-4 rounded-lg border border-border bg-card/30 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <GitCompareArrows className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Changes:</span>
          </div>
          <div className="flex items-center gap-1">
            <Plus className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs text-emerald-700 dark:text-emerald-300">{stats.additions} added</span>
          </div>
          <div className="flex items-center gap-1">
            <Minus className="h-3 w-3 text-red-600 dark:text-red-400" />
            <span className="text-xs text-red-700 dark:text-red-300">{stats.deletions} removed</span>
          </div>
          <div className="flex items-center gap-1">
            <PenLine className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            <span className="text-xs text-amber-700 dark:text-amber-300">{stats.modifications} modified</span>
          </div>
          <span className="text-xs text-muted-foreground ml-auto">
            {stats.unchanged} unchanged
          </span>
        </div>
      )}

      {/* Diff content */}
      {diffLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Computing diff...</span>
        </div>
      ) : !leftVersionId || !rightVersionId ? (
        <div className="rounded-lg border border-border bg-card/30 px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Select two versions above to compare.
          </p>
        </div>
      ) : leftVersionId === rightVersionId ? (
        <div className="rounded-lg border border-border bg-card/30 px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Same version selected on both sides. Select different versions to compare.
          </p>
        </div>
      ) : diffResult ? (
        <div className="rounded-lg border border-border overflow-hidden">
          {/* Diff header */}
          <div className="grid grid-cols-2 gap-px bg-muted">
            <div className="bg-card/70 px-3 py-2 flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Base
              </span>
              <span className="text-[10px] text-muted-foreground">
                (v{versions.find((v) => v.id === leftVersionId)?.version_number ?? '?'})
              </span>
            </div>
            <div className="bg-card/70 px-3 py-2 flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Compare
              </span>
              <span className="text-[10px] text-muted-foreground">
                (v{versions.find((v) => v.id === rightVersionId)?.version_number ?? '?'})
              </span>
            </div>
          </div>

          {/* Diff blocks */}
          <div className="max-h-[500px] overflow-y-auto font-mono text-xs leading-relaxed">
            {/* Additions */}
            {diffResult.additions.map((block, idx) => (
              <DiffBlockRow
                key={`add-${idx}`}
                type="addition"
                block={block}
              />
            ))}

            {/* Deletions */}
            {diffResult.deletions.map((block, idx) => (
              <DiffBlockRow
                key={`del-${idx}`}
                type="deletion"
                block={block}
              />
            ))}

            {/* Modifications */}
            {diffResult.modifications.map((block, idx) => (
              <DiffBlockRow
                key={`mod-${idx}`}
                type="modification"
                block={block}
              />
            ))}

            {/* Empty state */}
            {diffResult.additions.length === 0 &&
              diffResult.deletions.length === 0 &&
              diffResult.modifications.length === 0 && (
                <div className="px-4 py-6 text-center text-muted-foreground">
                  No differences found between these versions.
                </div>
              )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-700 dark:text-red-300">
            Could not compute diff. One or both versions may be unavailable.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Diff Block Row ──────────────────────────────────────────

interface DiffBlockRowProps {
  type: 'addition' | 'deletion' | 'modification'
  block: {
    path: string
    content: string
    lineStart?: number
    lineEnd?: number
  }
}

function DiffBlockRow({ type, block }: DiffBlockRowProps) {
  const lines = block.content.split('\n')
  const lineStart = block.lineStart ?? 0

  const typeConfig = {
    addition: {
      bg: 'bg-emerald-500/8',
      borderColor: 'border-l-emerald-500',
      textColor: 'text-emerald-700 dark:text-emerald-300',
      prefix: '+',
      prefixColor: 'text-emerald-600 dark:text-emerald-400',
      label: 'Added',
    },
    deletion: {
      bg: 'bg-red-500/8',
      borderColor: 'border-l-red-500',
      textColor: 'text-red-700 dark:text-red-300',
      prefix: '-',
      prefixColor: 'text-red-600 dark:text-red-400',
      label: 'Removed',
    },
    modification: {
      bg: 'bg-amber-500/8',
      borderColor: 'border-l-amber-500',
      textColor: 'text-amber-700 dark:text-amber-300',
      prefix: '~',
      prefixColor: 'text-amber-600 dark:text-amber-400',
      label: 'Modified',
    },
  }

  const config = typeConfig[type]

  return (
    <div className={cn('border-l-2', config.borderColor, config.bg)}>
      {/* Block header with path info */}
      {block.path !== 'line' && (
        <div className="px-3 py-1 border-b border-border/50">
          <span className={cn('text-[10px] font-semibold', config.prefixColor)}>
            {config.label}
          </span>
          <span className="text-[10px] text-muted-foreground ml-2">
            {block.path}
          </span>
        </div>
      )}

      {/* Content lines */}
      {lines.map((line, idx) => (
        <div
          key={idx}
          className="flex items-start px-3 py-0.5 border-b border-border/20"
        >
          <span className="w-8 shrink-0 text-right pr-3 text-muted-foreground select-none">
            {lineStart + idx + 1}
          </span>
          <span className={cn('w-4 shrink-0 text-center select-none', config.prefixColor)}>
            {config.prefix}
          </span>
          <span
            className={cn(
              'flex-1 whitespace-pre-wrap break-all',
              config.textColor,
              type === 'deletion' && 'line-through opacity-70'
            )}
          >
            {line || '\u00A0'}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Format a document source into a human-readable label.
 */
function formatSource(source: string): string {
  const labels: Record<string, string> = {
    missionpulse: 'MissionPulse',
    word_online: 'Word Online',
    excel_online: 'Excel Online',
    pptx_online: 'PowerPoint',
    google_docs: 'Google Docs',
    google_sheets: 'Google Sheets',
  }
  return labels[source] ?? source
}

/**
 * Format an ISO timestamp into a compact date/time string.
 */
function formatDate(iso: string): string {
  try {
    const date = new Date(iso)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return iso
  }
}
