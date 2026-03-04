'use client'

/**
 * Version Diff Viewer — Visual diff between document versions
 * Sprint 30 (T-30.2) — Phase J v1.3
 * © 2026 Mission Meets Tech
 */

import { useState, useMemo } from 'react'

interface DiffLine {
  type: 'addition' | 'deletion' | 'unchanged'
  content: string
  lineNumber: number
}

interface VersionEntry {
  id: string
  versionNumber: number
  versionLabel: string | null
  source: 'local' | 'cloud'
  createdAt: string | null
}

interface VersionDiffProps {
  versions: VersionEntry[]
  diffLines: DiffLine[]
  additionCount: number
  deletionCount: number
  onSelectVersions: (_versionA: string, _versionB: string) => void
  onRestore: (_versionId: string) => void
}

const LINE_STYLES = {
  addition: 'bg-green-900/30 text-green-300',
  deletion: 'bg-red-900/30 text-red-300 line-through',
  unchanged: 'text-white/60',
} as const

export default function VersionDiff({
  versions,
  diffLines,
  additionCount,
  deletionCount,
  onSelectVersions,
  onRestore,
}: VersionDiffProps) {
  const [versionA, setVersionA] = useState(versions[1]?.id ?? '')
  const [versionB, setVersionB] = useState(versions[0]?.id ?? '')

  const handleCompare = useMemo(() => {
    return () => {
      if (versionA && versionB) {
        onSelectVersions(versionA, versionB)
      }
    }
  }, [versionA, versionB, onSelectVersions])

  return (
    <div className="rounded-lg border border-white/10 bg-[#00050F]/80 p-4">
      <h3 className="text-sm font-semibold text-white mb-3">Version History</h3>

      {/* Version Selectors */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <label className="text-xs text-white/40 block mb-1">Version A (older)</label>
          <select
            value={versionA}
            onChange={e => setVersionA(e.target.value)}
            className="w-full rounded bg-white/5 border border-white/10 text-sm text-white px-2 py-1.5"
          >
            {versions.map(v => (
              <option key={v.id} value={v.id}>
                {v.versionLabel ?? `v${v.versionNumber}`} ({v.source})
              </option>
            ))}
          </select>
        </div>
        <span className="text-white/30 mt-5">→</span>
        <div className="flex-1">
          <label className="text-xs text-white/40 block mb-1">Version B (newer)</label>
          <select
            value={versionB}
            onChange={e => setVersionB(e.target.value)}
            className="w-full rounded bg-white/5 border border-white/10 text-sm text-white px-2 py-1.5"
          >
            {versions.map(v => (
              <option key={v.id} value={v.id}>
                {v.versionLabel ?? `v${v.versionNumber}`} ({v.source})
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleCompare}
          className="mt-5 px-3 py-1.5 rounded bg-[#00E5FA]/20 text-[#00E5FA] text-xs hover:bg-[#00E5FA]/30"
        >
          Compare
        </button>
      </div>

      {/* Diff Stats */}
      <div className="flex items-center gap-4 mb-3 text-xs">
        <span className="text-green-400">+{additionCount} additions</span>
        <span className="text-red-400">-{deletionCount} deletions</span>
      </div>

      {/* Diff View */}
      <div className="max-h-96 overflow-y-auto rounded bg-black/40 border border-white/5">
        {diffLines.map((line, idx) => (
          <div
            key={idx}
            className={`flex items-start text-xs font-mono px-3 py-0.5 ${LINE_STYLES[line.type]}`}
          >
            <span className="w-8 text-right text-white/20 mr-3 select-none shrink-0">
              {line.lineNumber}
            </span>
            <span className="w-4 shrink-0 text-center">
              {line.type === 'addition' ? '+' : line.type === 'deletion' ? '-' : ' '}
            </span>
            <span className="flex-1 whitespace-pre-wrap break-all">{line.content}</span>
          </div>
        ))}

        {diffLines.length === 0 && (
          <p className="text-sm text-white/40 text-center py-8">
            Select two versions to compare.
          </p>
        )}
      </div>

      {/* Restore Button */}
      {versionA && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => onRestore(versionA)}
            className="text-xs px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white"
          >
            Restore This Version
          </button>
        </div>
      )}

      <p className="text-[10px] text-white/30 mt-3 text-center">
        AI GENERATED — REQUIRES HUMAN REVIEW
      </p>
    </div>
  )
}
