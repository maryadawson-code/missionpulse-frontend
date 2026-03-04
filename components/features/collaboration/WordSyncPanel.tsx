'use client'

/**
 * Word Online Sync Panel — Section-level sync status + deep links
 * Sprint 29 (T-29.2) — Phase J v1.3
 * © 2026 Mission Meets Tech
 */

import { useState, useCallback } from 'react'

interface SyncSection {
  sectionId: string
  title: string
  status: 'synced' | 'pending' | 'conflict'
  lastSyncAt: string | null
}

interface WordSyncPanelProps {
  documentId: string
  cloudWebUrl: string | null
  sections: SyncSection[]
  onResolveConflict: (_sectionId: string) => void
  onSync: (_sectionId: string) => void
}

const STATUS_CONFIG = {
  synced: { color: 'text-green-400', bg: 'bg-green-900/30', label: 'Synced' },
  pending: { color: 'text-yellow-400', bg: 'bg-yellow-900/30', label: 'Pending' },
  conflict: { color: 'text-red-400', bg: 'bg-red-900/30', label: 'Conflict' },
} as const

export default function WordSyncPanel({
  documentId,
  cloudWebUrl,
  sections,
  onResolveConflict,
  onSync,
}: WordSyncPanelProps) {
  const [syncing, setSyncing] = useState<string | null>(null)

  const handleSync = useCallback(async (sectionId: string) => {
    setSyncing(sectionId)
    try {
      onSync(sectionId)
    } finally {
      setSyncing(null)
    }
  }, [onSync])

  return (
    <div className="rounded-lg border border-white/10 bg-[#00050F]/80 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-[#00E5FA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-sm font-semibold text-white">Word Online Sync</h3>
        </div>
        {cloudWebUrl && (
          <a
            href={cloudWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#00E5FA] hover:underline flex items-center gap-1"
          >
            Open in Word Online
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>

      <p className="text-xs text-white/50 mb-3">Document: {documentId.slice(0, 8)}…</p>

      <div className="space-y-2">
        {sections.map(section => {
          const cfg = STATUS_CONFIG[section.status]
          return (
            <div key={section.sectionId} className={`flex items-center justify-between p-2 rounded ${cfg.bg}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{section.title}</p>
                {section.lastSyncAt && (
                  <p className="text-xs text-white/40">
                    Last synced: {new Date(section.lastSyncAt).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-2">
                <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                {section.status === 'conflict' ? (
                  <button
                    onClick={() => onResolveConflict(section.sectionId)}
                    className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white"
                  >
                    Resolve
                  </button>
                ) : (
                  <button
                    onClick={() => handleSync(section.sectionId)}
                    disabled={syncing === section.sectionId}
                    className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white disabled:opacity-50"
                  >
                    {syncing === section.sectionId ? 'Syncing…' : 'Sync'}
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {sections.length === 0 && (
          <p className="text-sm text-white/40 text-center py-4">
            No sections linked for sync yet.
          </p>
        )}
      </div>

      <p className="text-[10px] text-white/30 mt-3 text-center">
        AI GENERATED — REQUIRES HUMAN REVIEW
      </p>
    </div>
  )
}
