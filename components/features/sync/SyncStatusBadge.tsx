// filepath: components/features/sync/SyncStatusBadge.tsx
/**
 * Sync Status Badge
 *
 * Color-coded badge showing the current sync state of a document.
 * Follows the same pattern as StatusBadge.tsx but with sync-specific
 * states and animated icons.
 *
 * v1.3 Sprint 29 — Sync Engine
 */
'use client'

import { Check, Loader2, AlertTriangle, XCircle, CloudOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SyncStatus, CloudProvider } from '@/lib/types/sync'

// ─── Props ────────────────────────────────────────────────────

interface SyncStatusBadgeProps {
  status: SyncStatus
  provider?: CloudProvider | null
  className?: string
}

// ─── Status Configuration ─────────────────────────────────────

interface StatusConfig {
  label: string
  icon: React.ComponentType<{ className?: string }>
  style: string
  iconClass?: string
}

const STATUS_MAP: Record<SyncStatus, StatusConfig> = {
  synced: {
    label: 'Synced',
    icon: Check,
    style: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  },
  syncing: {
    label: 'Syncing',
    icon: Loader2,
    style: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    iconClass: 'animate-spin',
  },
  conflict: {
    label: 'Conflict',
    icon: AlertTriangle,
    style: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  },
  error: {
    label: 'Error',
    icon: XCircle,
    style: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
  },
  idle: {
    label: 'Not Synced',
    icon: CloudOff,
    style: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
  },
}

const PROVIDER_LABELS: Record<CloudProvider, string> = {
  onedrive: 'OneDrive',
  google_drive: 'Google Drive',
  sharepoint: 'SharePoint',
}

// ─── Component ────────────────────────────────────────────────

export function SyncStatusBadge({
  status,
  provider,
  className,
}: SyncStatusBadgeProps) {
  const config = STATUS_MAP[status]
  const Icon = config.icon
  const providerLabel = provider ? PROVIDER_LABELS[provider] : null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.style,
        className
      )}
      title={
        providerLabel
          ? `${config.label} — ${providerLabel}`
          : config.label
      }
    >
      <Icon
        className={cn('h-3 w-3', config.iconClass)}
        aria-hidden="true"
      />
      <span>{config.label}</span>
      {providerLabel && (
        <span className="text-[10px] opacity-70">
          ({providerLabel})
        </span>
      )}
    </span>
  )
}
