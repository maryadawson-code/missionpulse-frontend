// filepath: components/features/launch/SyncStatusOverview.tsx
/**
 * Sync Status Overview
 *
 * Displays a grid of cards showing the sync status of all proposal
 * artifacts (volumes/sections) for an opportunity. Each card shows
 * the volume name, sync badge, cloud provider, last editor, and
 * word count. Includes an overall sync health percentage.
 *
 * v1.3 Sprint 30 -- Cross-Document Intelligence
 */
'use client'

import { useEffect, useState } from 'react'
import {
  Loader2,
  Cloud,
  FileText,
  Activity,
  ShieldCheck,
  AlertOctagon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SyncStatusBadge } from '@/components/features/sync/SyncStatusBadge'
import { getArtifactStatuses } from '@/lib/utils/cloud-binder-assembly'
import type { ArtifactStatus, SyncStatus } from '@/lib/types/sync'

// -- Props ------------------------------------------------------------------

interface SyncStatusOverviewProps {
  opportunityId: string
}

// -- Helpers ----------------------------------------------------------------

function computeSyncHealth(artifacts: ArtifactStatus[]): number {
  if (artifacts.length === 0) return 100
  const healthy = artifacts.filter(
    (a) => a.syncStatus === 'synced' || a.syncStatus === 'idle'
  ).length
  return Math.round((healthy / artifacts.length) * 100)
}

function formatWordCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toLocaleString()
}

function formatRelativeTime(iso: string | null): string {
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
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const HEALTH_RING_COLORS: Record<string, string> = {
  excellent: 'text-emerald-400',
  good: 'text-emerald-400',
  warning: 'text-amber-400',
  critical: 'text-red-400',
}

function getHealthLevel(percentage: number): string {
  if (percentage >= 90) return 'excellent'
  if (percentage >= 70) return 'good'
  if (percentage >= 50) return 'warning'
  return 'critical'
}

function cardBorderClass(status: SyncStatus): string {
  switch (status) {
    case 'error':
      return 'border-red-500/30 bg-red-950/10'
    case 'conflict':
      return 'border-amber-500/30 bg-amber-950/10'
    case 'syncing':
      return 'border-blue-500/30 bg-blue-950/10'
    case 'synced':
      return 'border-emerald-500/20 bg-emerald-950/5'
    default:
      return 'border-border bg-background'
  }
}

// -- Status Summary ---------------------------------------------------------

function StatusSummaryBar({ artifacts }: { artifacts: ArtifactStatus[] }) {
  const counts: Record<SyncStatus, number> = {
    synced: 0,
    syncing: 0,
    idle: 0,
    conflict: 0,
    error: 0,
  }
  for (const a of artifacts) {
    counts[a.syncStatus]++
  }

  const total = artifacts.length
  if (total === 0) return null

  const segments: { status: SyncStatus; count: number; color: string }[] = [
    { status: 'synced', count: counts.synced, color: 'bg-emerald-500' },
    { status: 'syncing', count: counts.syncing, color: 'bg-blue-500' },
    { status: 'idle', count: counts.idle, color: 'bg-slate-500' },
    { status: 'conflict', count: counts.conflict, color: 'bg-amber-500' },
    { status: 'error', count: counts.error, color: 'bg-red-500' },
  ]

  return (
    <div className="space-y-2">
      {/* Bar */}
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        {segments
          .filter((s) => s.count > 0)
          .map((segment) => (
            <div
              key={segment.status}
              className={cn('h-full transition-all', segment.color)}
              style={{ width: `${(segment.count / total) * 100}%` }}
              title={`${segment.status}: ${segment.count}`}
            />
          ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments
          .filter((s) => s.count > 0)
          .map((segment) => (
            <div
              key={segment.status}
              className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
            >
              <span
                className={cn('inline-block h-2 w-2 rounded-full', segment.color)}
              />
              <span className="capitalize">{segment.status}</span>
              <span className="font-mono">({segment.count})</span>
            </div>
          ))}
      </div>
    </div>
  )
}

// -- Component --------------------------------------------------------------

export function SyncStatusOverview({
  opportunityId,
}: SyncStatusOverviewProps) {
  const [artifacts, setArtifacts] = useState<ArtifactStatus[]>([])
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Loading sync status...
          </span>
        </div>
      </div>
    )
  }

  const syncHealth = computeSyncHealth(artifacts)
  const healthLevel = getHealthLevel(syncHealth)
  const totalWords = artifacts.reduce((sum, a) => sum + a.wordCount, 0)
  const conflictCount = artifacts.filter(
    (a) => a.syncStatus === 'conflict'
  ).length
  const errorCount = artifacts.filter((a) => a.syncStatus === 'error').length

  return (
    <div className="space-y-6">
      {/* Health Overview Card */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <Activity className="h-4 w-4 text-[#00E5FA]" />
          <h3 className="text-sm font-semibold text-foreground">
            Sync Status Overview
          </h3>
        </div>

        <div className="px-5 py-4">
          {artifacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Cloud className="h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No artifacts found. Add proposal sections to see sync status.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* KPI row */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg border border-border bg-background p-3 text-center">
                  <p
                    className={cn(
                      'text-2xl font-bold',
                      HEALTH_RING_COLORS[healthLevel]
                    )}
                  >
                    {syncHealth}%
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                    Sync Health
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {artifacts.length}
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                    Artifacts
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {formatWordCount(totalWords)}
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                    Total Words
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background p-3 text-center">
                  <p
                    className={cn(
                      'text-2xl font-bold',
                      conflictCount + errorCount > 0
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    )}
                  >
                    {conflictCount + errorCount}
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                    Issues
                  </p>
                </div>
              </div>

              {/* Status Distribution Bar */}
              <StatusSummaryBar artifacts={artifacts} />
            </div>
          )}
        </div>
      </div>

      {/* Volume Cards Grid */}
      {artifacts.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {artifacts.map((artifact) => (
            <div
              key={artifact.documentId}
              className={cn(
                'rounded-xl border p-4 transition-colors',
                cardBorderClass(artifact.syncStatus)
              )}
            >
              {/* Volume name + badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="truncate text-sm font-medium text-foreground">
                    {artifact.volumeName}
                  </p>
                </div>
                <SyncStatusBadge
                  status={artifact.syncStatus}
                  provider={artifact.cloudProvider}
                />
              </div>

              {/* Details */}
              <div className="mt-3 space-y-1.5">
                {/* Cloud Provider */}
                {artifact.cloudProvider && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Provider</span>
                    <span className="flex items-center gap-1 text-foreground">
                      <Cloud className="h-3 w-3" />
                      {artifact.cloudProvider === 'google_drive'
                        ? 'Google Drive'
                        : artifact.cloudProvider === 'onedrive'
                          ? 'OneDrive'
                          : 'SharePoint'}
                    </span>
                  </div>
                )}

                {/* Last Edited By */}
                {artifact.lastEditedBy && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Last editor</span>
                    <span className="truncate max-w-[140px] text-foreground">
                      {artifact.lastEditedBy}
                    </span>
                  </div>
                )}

                {/* Last Edited At */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Last edit</span>
                  <span className="text-foreground">
                    {formatRelativeTime(artifact.lastEditedAt)}
                  </span>
                </div>

                {/* Word Count */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Word count</span>
                  <span className="font-mono text-foreground">
                    {formatWordCount(artifact.wordCount)}
                  </span>
                </div>

                {/* Edit Source */}
                {artifact.editSource && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Source</span>
                    <span className="text-foreground">
                      {artifact.editSource.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Status indicator footer */}
              <div className="mt-3 flex items-center gap-1.5 border-t border-border/50 pt-2">
                {artifact.syncStatus === 'synced' ? (
                  <>
                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400">
                      In sync with cloud
                    </span>
                  </>
                ) : artifact.syncStatus === 'conflict' ? (
                  <>
                    <AlertOctagon className="h-3 w-3 text-amber-400" />
                    <span className="text-[10px] text-amber-400">
                      Conflict detected -- needs resolution
                    </span>
                  </>
                ) : artifact.syncStatus === 'error' ? (
                  <>
                    <AlertOctagon className="h-3 w-3 text-red-400" />
                    <span className="text-[10px] text-red-400">
                      Sync error -- check connection
                    </span>
                  </>
                ) : artifact.syncStatus === 'syncing' ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                    <span className="text-[10px] text-blue-400">
                      Syncing in progress...
                    </span>
                  </>
                ) : (
                  <>
                    <Cloud className="h-3 w-3 text-slate-400" />
                    <span className="text-[10px] text-slate-400">
                      Not connected to cloud
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
