'use client'

/**
 * PowerPoint Online Sync Panel — Per-slide sync status
 * Sprint 29 (T-29.4) — Phase J v1.3
 * © 2026 Mission Meets Tech
 */

import { useState, useCallback } from 'react'

interface SyncSlide {
  slideIndex: number
  title: string
  status: 'synced' | 'pending' | 'conflict'
  lastSyncAt: string | null
}

interface PptxSyncPanelProps {
  documentId: string
  cloudWebUrl: string | null
  slides: SyncSlide[]
  onSync: (_slideIndex: number) => void
}

const STATUS_CONFIG = {
  synced: { color: 'text-green-400', label: 'Synced' },
  pending: { color: 'text-yellow-400', label: 'Pending' },
  conflict: { color: 'text-red-400', label: 'Conflict' },
} as const

export default function PptxSyncPanel({
  documentId,
  cloudWebUrl,
  slides,
  onSync,
}: PptxSyncPanelProps) {
  const [syncing, setSyncing] = useState<number | null>(null)

  const handleSync = useCallback(async (slideIndex: number) => {
    setSyncing(slideIndex)
    try {
      onSync(slideIndex)
    } finally {
      setSyncing(null)
    }
  }, [onSync])

  const syncedCount = slides.filter(s => s.status === 'synced').length

  return (
    <div className="rounded-lg border border-white/10 bg-[#00050F]/80 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <h3 className="text-sm font-semibold text-white">PowerPoint Online Sync</h3>
        </div>
        {cloudWebUrl && (
          <a
            href={cloudWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#00E5FA] hover:underline flex items-center gap-1"
          >
            Open in PowerPoint Online
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>

      <p className="text-xs text-white/50 mb-1">Document: {documentId.slice(0, 8)}…</p>
      <p className="text-xs text-white/40 mb-3">
        {syncedCount}/{slides.length} slides synced
      </p>

      <div className="space-y-1.5">
        {slides.map(slide => {
          const cfg = STATUS_CONFIG[slide.status]
          return (
            <div key={slide.slideIndex} className="flex items-center justify-between p-2 rounded bg-white/5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-white/30 w-6 text-right">{slide.slideIndex + 1}.</span>
                <span className="text-sm text-white truncate">{slide.title}</span>
              </div>
              <div className="flex items-center gap-2 ml-2 shrink-0">
                <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                <button
                  onClick={() => handleSync(slide.slideIndex)}
                  disabled={syncing === slide.slideIndex}
                  className="text-xs px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white disabled:opacity-50"
                >
                  {syncing === slide.slideIndex ? '…' : 'Sync'}
                </button>
              </div>
            </div>
          )
        })}

        {slides.length === 0 && (
          <p className="text-sm text-white/40 text-center py-4">
            No slides linked for sync.
          </p>
        )}
      </div>

      <p className="text-[10px] text-white/30 mt-3 text-center">
        AI GENERATED — REQUIRES HUMAN REVIEW
      </p>
    </div>
  )
}
