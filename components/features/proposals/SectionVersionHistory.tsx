'use client'

import { useState, useEffect, useCallback } from 'react'
import { History, RotateCcw, Loader2, ChevronDown, ChevronRight } from 'lucide-react'

import { addToast } from '@/components/ui/Toast'

interface VersionEntry {
  id: string
  action: string
  user_name: string
  created_at: string
  details: {
    entity_id?: string
    content_snapshot?: string
    content_length?: number
    status_change?: string | null
    version_number?: number
    opportunity_id?: string
  }
}

interface SectionVersionHistoryProps {
  sectionId: string
  onRestore: (_content: string) => void
}

export function SectionVersionHistory({
  sectionId,
  onRestore,
}: SectionVersionHistoryProps) {
  const [versions, setVersions] = useState<VersionEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [previewId, setPreviewId] = useState<string | null>(null)

  const loadVersions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/section-versions?sectionId=${encodeURIComponent(sectionId)}`
      )
      if (res.ok) {
        const data = await res.json()
        setVersions(data.versions ?? [])
      }
    } catch {
      // silently fail — versions are optional
    }
    setLoading(false)
  }, [sectionId])

  useEffect(() => {
    if (!expanded) return
    loadVersions()
  }, [expanded, loadVersions])

  function handleRestore(version: VersionEntry) {
    if (!version.details.content_snapshot) {
      addToast('error', 'No content snapshot available for this version')
      return
    }
    if (!confirm('Restore this version? Current content will be replaced.')) return
    onRestore(version.details.content_snapshot)
    addToast('success', 'Version restored to editor. Save to persist.')
  }

  function formatDate(ts: string): string {
    return new Date(ts).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const STATUS_LABELS: Record<string, string> = {
    draft: 'Draft',
    pink_review: 'Pink Team',
    revision: 'Revision',
    green_review: 'Green Team',
    red_review: 'Red Team',
    final: 'Final',
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-gray-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Version History
          </span>
          {versions.length > 0 && (
            <span className="rounded-full bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-400">
              {versions.length}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-gray-800 px-4 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            </div>
          ) : versions.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-3">
              No version history yet. Versions are created when you save changes.
            </p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="rounded-lg border border-gray-800 bg-gray-900/30 p-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-300">
                        {formatDate(version.created_at)}
                      </span>
                      {version.details.status_change && (
                        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary">
                          {STATUS_LABELS[version.details.status_change] ??
                            version.details.status_change}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {version.details.content_length != null && (
                        <span className="text-[10px] text-gray-600">
                          {version.details.content_length.toLocaleString()} chars
                        </span>
                      )}
                      {version.details.content_snapshot && (
                        <button
                          onClick={() => handleRestore(version)}
                          className="p-1 text-gray-500 hover:text-[#00E5FA] transition-colors"
                          title="Restore this version"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    by {version.user_name}
                  </p>

                  {/* Preview */}
                  {previewId === version.id ? (
                    <div className="mt-2">
                      <pre className="max-h-[150px] overflow-y-auto rounded border border-gray-800 bg-gray-950 p-2 text-[10px] text-gray-400 whitespace-pre-wrap">
                        {version.details.content_snapshot ?? 'No content captured'}
                      </pre>
                      <button
                        onClick={() => setPreviewId(null)}
                        className="mt-1 text-[10px] text-primary hover:underline"
                      >
                        Hide preview
                      </button>
                    </div>
                  ) : version.details.content_snapshot ? (
                    <button
                      onClick={() => setPreviewId(version.id)}
                      className="mt-1 text-[10px] text-primary hover:underline"
                    >
                      Preview content
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
