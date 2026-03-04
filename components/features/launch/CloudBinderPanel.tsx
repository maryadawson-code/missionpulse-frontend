// filepath: components/features/launch/CloudBinderPanel.tsx
/**
 * Cloud Binder Panel
 *
 * Panel for assembling and downloading a cloud-aware proposal binder.
 * Shows artifact sync statuses in a grid and provides a one-click
 * "Build Binder" action that packages all volumes with sync metadata.
 *
 * v1.3 Sprint 30 -- Cross-Document Intelligence
 */
'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  Download,
  FileArchive,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { addToast } from '@/components/ui/Toast'
import { SyncStatusBadge } from '@/components/features/sync/SyncStatusBadge'
import { ConflictResolutionModal } from '@/components/features/sync/ConflictResolutionModal'
import {
  assembleCloudBinder,
  getArtifactStatuses,
} from '@/lib/utils/cloud-binder-assembly'
import {
  getConflictForDocument,
  resolveDocumentConflict,
} from '@/app/(dashboard)/pipeline/[id]/launch/actions'
import type { ArtifactStatus, SyncStatus, SyncConflict, ConflictResolution } from '@/lib/types/sync'

// -- Props ------------------------------------------------------------------

interface CloudBinderPanelProps {
  opportunityId: string
  opportunityTitle: string
}

// -- Helpers ----------------------------------------------------------------

const SYNC_STATUS_ORDER: Record<SyncStatus, number> = {
  error: 0,
  conflict: 1,
  syncing: 2,
  idle: 3,
  synced: 4,
}

function sortByStatusSeverity(a: ArtifactStatus, b: ArtifactStatus): number {
  return SYNC_STATUS_ORDER[a.syncStatus] - SYNC_STATUS_ORDER[b.syncStatus]
}

function formatWordCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toLocaleString()
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return 'Never'
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// -- Component --------------------------------------------------------------

export function CloudBinderPanel({
  opportunityId,
  opportunityTitle,
}: CloudBinderPanelProps) {
  const [artifacts, setArtifacts] = useState<ArtifactStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [activeConflict, setActiveConflict] = useState<SyncConflict | null>(null)
  const [resolvingDocId, setResolvingDocId] = useState<string | null>(null)

  // Fetch artifact statuses on mount
  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const statuses = await getArtifactStatuses(opportunityId)
      if (!cancelled) {
        setArtifacts(statuses)
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [opportunityId])

  // Computed stats
  const totalArtifacts = artifacts.length
  const syncedCount = artifacts.filter(
    (a) => a.syncStatus === 'synced' || a.syncStatus === 'idle'
  ).length
  const conflictCount = artifacts.filter(
    (a) => a.syncStatus === 'conflict'
  ).length
  const errorCount = artifacts.filter(
    (a) => a.syncStatus === 'error'
  ).length
  const syncHealth =
    totalArtifacts > 0
      ? Math.round((syncedCount / totalArtifacts) * 100)
      : 100
  const totalWords = artifacts.reduce((sum, a) => sum + a.wordCount, 0)

  const hasIssues = conflictCount > 0 || errorCount > 0

  async function handleOpenConflict(documentId: string) {
    setResolvingDocId(documentId)
    const result = await getConflictForDocument(documentId)
    if (result.conflict) {
      setActiveConflict(result.conflict as SyncConflict)
    } else {
      addToast('error', result.error ?? 'No conflict found for this document')
      setResolvingDocId(null)
    }
  }

  async function handleResolveConflict(resolution: ConflictResolution) {
    if (!activeConflict) return
    const result = await resolveDocumentConflict(activeConflict.id, resolution as 'keep_mp' | 'keep_cloud' | 'merge')
    if (result.success) {
      addToast('success', 'Conflict resolved')
      const statuses = await getArtifactStatuses(opportunityId)
      setArtifacts(statuses)
    } else {
      addToast('error', result.error ?? 'Failed to resolve conflict')
    }
    setActiveConflict(null)
    setResolvingDocId(null)
  }

  function handleBuild() {
    startTransition(async () => {
      const result = await assembleCloudBinder(opportunityId)
      if (result.success && result.data) {
        setDownloadUrl(result.data.url)
        addToast(
          'success',
          `Binder assembled: ${totalArtifacts} artifacts, ${formatWordCount(totalWords)} words`
        )
      } else {
        addToast('error', result.error ?? 'Binder assembly failed')
      }
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <FileArchive className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Cloud Binder Assembly
            </h3>
            <p className="text-xs text-muted-foreground">
              {opportunityTitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {downloadUrl && (
            <a
              href={downloadUrl}
              download
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30',
                'bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300',
                'transition-colors hover:bg-emerald-500/20'
              )}
            >
              <Download className="h-3.5 w-3.5" />
              Download ZIP
            </a>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleBuild}
            disabled={isPending || loading}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileArchive className="h-4 w-4" />
            )}
            Build Binder
          </Button>
        </div>
      </div>

      {/* Sync Health Summary */}
      <div className="grid grid-cols-2 gap-4 border-b border-border px-5 py-4 sm:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Sync Health
          </p>
          <p
            className={cn(
              'mt-1 text-xl font-bold',
              syncHealth >= 80
                ? 'text-emerald-600 dark:text-emerald-400'
                : syncHealth >= 50
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-red-600 dark:text-red-400'
            )}
          >
            {loading ? '--' : `${syncHealth}%`}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Artifacts
          </p>
          <p className="mt-1 text-xl font-bold text-foreground">
            {loading ? '--' : totalArtifacts}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Total Words
          </p>
          <p className="mt-1 text-xl font-bold text-foreground">
            {loading ? '--' : formatWordCount(totalWords)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Issues
          </p>
          <p
            className={cn(
              'mt-1 text-xl font-bold',
              hasIssues ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
            )}
          >
            {loading ? '--' : conflictCount + errorCount}
          </p>
        </div>
      </div>

      {/* Warnings */}
      {!loading && hasIssues && (
        <div className="border-b border-border px-5 py-3">
          <div className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-3 space-y-1.5">
            {conflictCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {conflictCount} artifact{conflictCount !== 1 ? 's' : ''} with
                sync conflicts -- resolve before building binder
              </div>
            )}
            {errorCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {errorCount} artifact{errorCount !== 1 ? 's' : ''} with sync
                errors
              </div>
            )}
          </div>
        </div>
      )}

      {/* Artifact Grid */}
      <div className="px-5 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading artifacts...
            </span>
          </div>
        ) : artifacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              No proposal sections found for this opportunity.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...artifacts].sort(sortByStatusSeverity).map((artifact) => (
              <div
                key={artifact.documentId}
                className={cn(
                  'rounded-lg border p-3 transition-colors',
                  artifact.syncStatus === 'error'
                    ? 'border-red-500/30 bg-red-50 dark:bg-red-950/10'
                    : artifact.syncStatus === 'conflict'
                      ? 'border-amber-500/30 bg-amber-50 dark:bg-amber-950/10'
                      : artifact.syncStatus === 'syncing'
                        ? 'border-blue-500/30 bg-blue-50 dark:bg-blue-950/10'
                        : 'border-border bg-background'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {artifact.volumeName}
                    </p>
                  </div>
                  <SyncStatusBadge
                    status={artifact.syncStatus}
                    provider={artifact.cloudProvider}
                  />
                </div>

                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Words</span>
                    <span className="font-mono">
                      {formatWordCount(artifact.wordCount)}
                    </span>
                  </div>
                  {artifact.lastEditedBy && (
                    <div className="flex items-center justify-between">
                      <span>Editor</span>
                      <span className="truncate max-w-[140px]">
                        {artifact.lastEditedBy}
                      </span>
                    </div>
                  )}
                  {artifact.lastEditedAt && (
                    <div className="flex items-center justify-between">
                      <span>Last edit</span>
                      <span>{formatTimestamp(artifact.lastEditedAt)}</span>
                    </div>
                  )}
                </div>

                {artifact.syncStatus === 'synced' && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Cloud synced
                  </div>
                )}

                {artifact.syncStatus === 'conflict' && (
                  <button
                    onClick={() => handleOpenConflict(artifact.documentId)}
                    disabled={resolvingDocId === artifact.documentId}
                    className="mt-2 flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-700 dark:text-amber-300 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    Resolve Conflict
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conflict Resolution Modal */}
      {activeConflict && (
        <ConflictResolutionModal
          conflict={activeConflict}
          onResolve={handleResolveConflict}
          onClose={() => {
            setActiveConflict(null)
            setResolvingDocId(null)
          }}
        />
      )}
    </div>
  )
}
