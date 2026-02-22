// filepath: components/features/sync/ConflictResolutionModal.tsx
/**
 * Conflict Resolution Modal
 *
 * Side-by-side diff viewer for resolving sync conflicts between
 * MissionPulse and cloud provider versions of a document section.
 * Supports keep-MP, keep-cloud, and merge resolution strategies.
 *
 * v1.3 Sprint 29 — Sync Engine
 */
'use client'

import { useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, FileText, Cloud, GitMerge } from 'lucide-react'
import type { SyncConflict, ConflictResolution } from '@/lib/types/sync'

// ─── Props ────────────────────────────────────────────────────

interface ConflictResolutionModalProps {
  conflict: SyncConflict
  onResolve: (resolution: ConflictResolution) => void
  onClose: () => void
}

// ─── Diff Line Types ──────────────────────────────────────────

type LineType = 'addition' | 'deletion' | 'unchanged'

interface DiffLine {
  content: string
  type: LineType
  lineNumber: number
}

// ─── Component ────────────────────────────────────────────────

export function ConflictResolutionModal({
  conflict,
  onResolve,
  onClose,
}: ConflictResolutionModalProps) {
  const mpLines = useMemo(
    () => computeDiffLines(conflict.mp_version.content, conflict.cloud_version.content),
    [conflict.mp_version.content, conflict.cloud_version.content]
  )

  const cloudLines = useMemo(
    () => computeDiffLines(conflict.cloud_version.content, conflict.mp_version.content),
    [conflict.cloud_version.content, conflict.mp_version.content]
  )

  const handleResolve = useCallback(
    (resolution: ConflictResolution) => {
      onResolve(resolution)
    },
    [onResolve]
  )

  const mpTimestamp = formatTimestamp(conflict.mp_version.updated_at)
  const cloudTimestamp = formatTimestamp(conflict.cloud_version.updated_at)

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Sync Conflict Detected
          </DialogTitle>
          <DialogDescription>
            Both MissionPulse and the cloud version have been modified.
            Choose which version to keep, or merge both.
          </DialogDescription>
        </DialogHeader>

        {/* Side-by-side diff panels */}
        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0 overflow-hidden">
          {/* MissionPulse version */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/50 rounded-t-md">
              <FileText className="h-4 w-4 text-cyan" />
              <span className="text-sm font-medium">MissionPulse Version</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {mpTimestamp}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto border border-t-0 border-border rounded-b-md bg-background">
              <DiffPanel lines={mpLines} />
            </div>
          </div>

          {/* Cloud version */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/50 rounded-t-md">
              <Cloud className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium">Cloud Version</span>
              {conflict.cloud_version.source && (
                <span className="text-xs text-muted-foreground">
                  via {conflict.cloud_version.source}
                </span>
              )}
              <span className="ml-auto text-xs text-muted-foreground">
                {cloudTimestamp}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto border border-t-0 border-border rounded-b-md bg-background">
              <DiffPanel lines={cloudLines} />
            </div>
          </div>
        </div>

        {/* Resolution actions */}
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => handleResolve('keep_cloud')}
            className="gap-1.5"
          >
            <Cloud className="h-4 w-4" />
            Keep Cloud
          </Button>
          <Button
            variant="outline"
            onClick={() => handleResolve('merge')}
            className="gap-1.5"
          >
            <GitMerge className="h-4 w-4" />
            Merge
          </Button>
          <Button
            onClick={() => handleResolve('keep_mp')}
            className="gap-1.5 bg-cyan text-navy hover:bg-cyan/90"
          >
            <FileText className="h-4 w-4" />
            Keep MissionPulse
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Diff Panel ───────────────────────────────────────────────

function DiffPanel({ lines }: { lines: DiffLine[] }) {
  return (
    <div className="font-mono text-xs leading-relaxed">
      {lines.map((line, index) => (
        <div
          key={`${index}-${line.lineNumber}`}
          className={cn(
            'flex items-start px-3 py-0.5 border-b border-border/30',
            line.type === 'addition' && 'bg-emerald-500/10',
            line.type === 'deletion' && 'bg-red-500/10'
          )}
        >
          <span className="w-8 shrink-0 text-right pr-3 text-muted-foreground select-none">
            {line.lineNumber}
          </span>
          <span className="shrink-0 w-4 text-center select-none">
            {line.type === 'addition' && (
              <span className="text-emerald-400">+</span>
            )}
            {line.type === 'deletion' && (
              <span className="text-red-400">-</span>
            )}
          </span>
          <span
            className={cn(
              'flex-1 whitespace-pre-wrap break-all',
              line.type === 'addition' && 'text-emerald-300',
              line.type === 'deletion' && 'text-red-300 line-through opacity-70'
            )}
          >
            {line.content || '\u00A0'}
          </span>
        </div>
      ))}
      {lines.length === 0 && (
        <div className="px-3 py-4 text-center text-muted-foreground">
          No content
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Compute diff lines for a "primary" version compared against an "other" version.
 * Lines unique to primary are marked as additions, lines only in other as deletions,
 * and shared lines as unchanged.
 */
function computeDiffLines(primary: string, other: string): DiffLine[] {
  const primaryLines = primary.split('\n')
  const otherLines = other.split('\n')
  const otherSet = new Set(otherLines)
  const result: DiffLine[] = []

  // Build a map of lines in the other version for quick lookup
  const otherLineMap = new Map<string, number[]>()
  for (let i = 0; i < otherLines.length; i++) {
    const line = otherLines[i]
    const indices = otherLineMap.get(line) ?? []
    indices.push(i)
    otherLineMap.set(line, indices)
  }

  for (let i = 0; i < primaryLines.length; i++) {
    const line = primaryLines[i]
    const type: LineType = otherSet.has(line) ? 'unchanged' : 'addition'

    result.push({
      content: line,
      type,
      lineNumber: i + 1,
    })
  }

  // Append lines that are only in the other version as deletions
  const primarySet = new Set(primaryLines)
  let deletionLineNumber = primaryLines.length + 1

  for (const line of otherLines) {
    if (!primarySet.has(line)) {
      result.push({
        content: line,
        type: 'deletion',
        lineNumber: deletionLineNumber++,
      })
    }
  }

  return result
}

/**
 * Format an ISO timestamp into a human-readable date/time string.
 */
function formatTimestamp(iso: string): string {
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
