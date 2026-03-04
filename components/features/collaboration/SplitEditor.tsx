'use client'

/**
 * Split Editor — Dual-pane layout for parallel volume editing
 * Sprint 30 (T-30.4) — Phase J v1.3
 * © 2026 Mission Meets Tech
 */

import { useState, useMemo } from 'react'

interface Volume {
  id: string
  name: string
  number: number
}

interface Section {
  id: string
  title: string
  volume: string | null
  content: string
  sectionNumber: string | null
}

interface SplitEditorProps {
  volumes: Volume[]
  sections: Section[]
}

export default function SplitEditor({ volumes, sections }: SplitEditorProps) {
  const [leftVolume, setLeftVolume] = useState(volumes[0]?.id ?? '')
  const [rightVolume, setRightVolume] = useState(volumes[1]?.id ?? volumes[0]?.id ?? '')
  const [selectedLeftSection, setSelectedLeftSection] = useState<string | null>(null)
  const [selectedRightSection, setSelectedRightSection] = useState<string | null>(null)

  const leftSections = useMemo(
    () => sections.filter(s => s.volume === leftVolume),
    [sections, leftVolume]
  )
  const rightSections = useMemo(
    () => sections.filter(s => s.volume === rightVolume),
    [sections, rightVolume]
  )

  const leftContent = leftSections.find(s => s.id === selectedLeftSection)?.content ?? ''
  const rightContent = rightSections.find(s => s.id === selectedRightSection)?.content ?? ''

  return (
    <div className="flex-1 flex gap-1 min-h-0">
      {/* Left Pane */}
      <div className="flex-1 flex flex-col border border-white/10 rounded-lg overflow-hidden bg-[#00050F]/80">
        <div className="px-3 py-2 border-b border-white/10 bg-white/5">
          <select
            value={leftVolume}
            onChange={e => { setLeftVolume(e.target.value); setSelectedLeftSection(null) }}
            className="w-full bg-transparent text-sm text-white border-none outline-none"
          >
            {volumes.map(v => (
              <option key={v.id} value={v.id} className="bg-[#00050F]">
                Vol {v.number}: {v.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Section list */}
          <div className="w-48 border-r border-white/10 overflow-y-auto shrink-0">
            {leftSections.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedLeftSection(s.id)}
                className={`w-full text-left px-3 py-2 text-xs border-b border-white/5 hover:bg-white/10
                  ${selectedLeftSection === s.id ? 'bg-[#00E5FA]/10 text-[#00E5FA]' : 'text-white/70'}`}
              >
                {s.sectionNumber ? `${s.sectionNumber}. ` : ''}{s.title}
              </button>
            ))}
            {leftSections.length === 0 && (
              <p className="text-xs text-white/30 p-3">No sections in this volume.</p>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedLeftSection ? (
              <div className="text-sm text-white/80 whitespace-pre-wrap">{leftContent}</div>
            ) : (
              <p className="text-sm text-white/30">Select a section to view.</p>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-1 bg-white/10 rounded cursor-col-resize shrink-0" />

      {/* Right Pane */}
      <div className="flex-1 flex flex-col border border-white/10 rounded-lg overflow-hidden bg-[#00050F]/80">
        <div className="px-3 py-2 border-b border-white/10 bg-white/5">
          <select
            value={rightVolume}
            onChange={e => { setRightVolume(e.target.value); setSelectedRightSection(null) }}
            className="w-full bg-transparent text-sm text-white border-none outline-none"
          >
            {volumes.map(v => (
              <option key={v.id} value={v.id} className="bg-[#00050F]">
                Vol {v.number}: {v.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Section list */}
          <div className="w-48 border-r border-white/10 overflow-y-auto shrink-0">
            {rightSections.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedRightSection(s.id)}
                className={`w-full text-left px-3 py-2 text-xs border-b border-white/5 hover:bg-white/10
                  ${selectedRightSection === s.id ? 'bg-[#00E5FA]/10 text-[#00E5FA]' : 'text-white/70'}`}
              >
                {s.sectionNumber ? `${s.sectionNumber}. ` : ''}{s.title}
              </button>
            ))}
            {rightSections.length === 0 && (
              <p className="text-xs text-white/30 p-3">No sections in this volume.</p>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedRightSection ? (
              <div className="text-sm text-white/80 whitespace-pre-wrap">{rightContent}</div>
            ) : (
              <p className="text-sm text-white/30">Select a section to view.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
