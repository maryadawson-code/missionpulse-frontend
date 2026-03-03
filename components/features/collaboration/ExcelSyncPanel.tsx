'use client'

/**
 * Excel Online Sync Panel — Pricing worksheet sync status
 * Sprint 29 (T-29.3) — Phase J v1.3
 * © 2026 Mission Meets Tech
 */

import { useState, useCallback } from 'react'

interface ExcelSyncPanelProps {
  documentId: string
  cloudWebUrl: string | null
  worksheetName: string
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error' | 'idle'
  lastSyncAt: string | null
  onSync: () => void
}

const STATUS_MAP = {
  synced: { color: 'text-green-400', bg: 'bg-green-900/30', label: 'Synced', icon: '✓' },
  pending: { color: 'text-yellow-400', bg: 'bg-yellow-900/30', label: 'Pending', icon: '⏳' },
  conflict: { color: 'text-red-400', bg: 'bg-red-900/30', label: 'Conflict', icon: '⚠' },
  error: { color: 'text-red-400', bg: 'bg-red-900/30', label: 'Error', icon: '✗' },
  idle: { color: 'text-white/50', bg: 'bg-white/5', label: 'Idle', icon: '—' },
} as const

export default function ExcelSyncPanel({
  documentId,
  cloudWebUrl,
  worksheetName,
  syncStatus,
  lastSyncAt,
  onSync,
}: ExcelSyncPanelProps) {
  const [syncing, setSyncing] = useState(false)

  const handleSync = useCallback(async () => {
    setSyncing(true)
    try {
      onSync()
    } finally {
      setSyncing(false)
    }
  }, [onSync])

  const cfg = STATUS_MAP[syncStatus]

  return (
    <div className="rounded-lg border border-white/10 bg-[#00050F]/80 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <h3 className="text-sm font-semibold text-white">Excel Online Sync</h3>
        </div>
        {cloudWebUrl && (
          <a
            href={cloudWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#00E5FA] hover:underline flex items-center gap-1"
          >
            Open in Excel Online
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>

      <div className={`rounded p-3 ${cfg.bg}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white font-medium">{worksheetName}</p>
            <p className="text-xs text-white/40 mt-0.5">
              Document: {documentId.slice(0, 8)}…
            </p>
          </div>
          <span className={`text-xs font-medium ${cfg.color}`}>
            {cfg.icon} {cfg.label}
          </span>
        </div>

        {lastSyncAt && (
          <p className="text-xs text-white/40 mt-2">
            Last synced: {new Date(lastSyncAt).toLocaleString()}
          </p>
        )}
      </div>

      <div className="mt-3 flex justify-end">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="text-xs px-3 py-1.5 rounded bg-[#00E5FA]/20 hover:bg-[#00E5FA]/30 text-[#00E5FA] disabled:opacity-50"
        >
          {syncing ? 'Syncing…' : 'Sync Now'}
        </button>
      </div>

      <p className="text-[10px] text-white/30 mt-3 text-center">
        AI GENERATED — REQUIRES HUMAN REVIEW
      </p>
    </div>
  )
}
