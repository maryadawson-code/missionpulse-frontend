'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface Section {
  id: string
  section_title: string
  volume: string | null
  status: string | null
  due_date: string | null
  writer_id: string | null
  reviewer_id: string | null
  sort_order: number | null
  opportunity_id: string | null
}

interface OpportunityOption {
  id: string
  title: string
}

interface WorkflowBoardProps {
  opportunities: OpportunityOption[]
  sections: Section[]
  canEdit: boolean
}

const COLUMNS = [
  { key: 'draft', label: 'Draft', color: 'border-gray-600' },
  { key: 'pink_review', label: 'Pink Team', color: 'border-pink-500' },
  { key: 'revision', label: 'Revision', color: 'border-amber-500' },
  { key: 'green_review', label: 'Green Team', color: 'border-emerald-500' },
  { key: 'red_review', label: 'Red Team', color: 'border-red-500' },
  { key: 'final', label: 'Final', color: 'border-blue-500' },
]

function daysUntil(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'Overdue'
  if (diff === 0) return 'Today'
  return `${diff}d`
}

function dueColor(dateStr: string | null): string {
  if (!dateStr) return 'text-gray-600'
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'text-red-400'
  if (diff <= 3) return 'text-amber-400'
  return 'text-gray-500'
}

export function WorkflowBoard({ opportunities, sections, canEdit }: WorkflowBoardProps) {
  const [selectedOpp, setSelectedOpp] = useState<string>('')

  const filteredSections = useMemo(() => {
    if (!selectedOpp) return sections
    return sections.filter((s) => s.opportunity_id != null && s.opportunity_id === selectedOpp)
  }, [sections, selectedOpp])

  // Group sections by status column
  const columns = useMemo(() => {
    const groups: Record<string, Section[]> = {}
    for (const col of COLUMNS) groups[col.key] = []
    for (const s of filteredSections) {
      const status = s.status ?? 'draft'
      if (groups[status]) {
        groups[status].push(s)
      } else {
        groups.draft.push(s)
      }
    }
    return groups
  }, [filteredSections])

  // Map opportunity IDs to titles for display
  const oppMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const o of opportunities) m[o.id] = o.title
    return m
  }, [opportunities])

  return (
    <div className="space-y-4">
      {/* Opportunity Filter */}
      <div className="flex items-center gap-3">
        <select
          value={selectedOpp}
          onChange={(e) => setSelectedOpp(e.target.value)}
          className="rounded-md border border-gray-700 bg-gray-900/50 px-3 py-2 text-sm text-gray-200 focus:border-[#00E5FA]/50 focus:outline-none focus:ring-1 focus:ring-[#00E5FA]/25"
        >
          <option value="">All Opportunities ({filteredSections.length} sections)</option>
          {opportunities.map((o) => (
            <option key={o.id} value={o.id}>{o.title}</option>
          ))}
        </select>
      </div>

      {/* Swimlane Columns */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {COLUMNS.map((col) => (
          <div key={col.key} className={`rounded-xl border-t-2 ${col.color} border border-gray-800 bg-gray-900/30`}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
              <h3 className="text-xs font-semibold text-gray-400 uppercase">{col.label}</h3>
              <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                {columns[col.key].length}
              </span>
            </div>
            <div className="p-2 space-y-2 min-h-[120px]">
              {columns[col.key].length === 0 ? (
                <p className="text-center text-[10px] text-gray-600 py-6">No sections</p>
              ) : (
                columns[col.key].map((section) => (
                  <Link
                    key={section.id}
                    href={`/pipeline/${section.opportunity_id ?? ''}/sections/${section.id}`}
                    className="block rounded-lg border border-gray-800 bg-gray-900/50 p-2.5 hover:border-[#00E5FA]/30 hover:bg-gray-800/50 transition-colors"
                  >
                    <p className="text-xs font-medium text-gray-200 truncate">
                      {section.section_title}
                    </p>
                    {section.volume && (
                      <p className="text-[10px] text-gray-500 mt-0.5 truncate">{section.volume}</p>
                    )}
                    <div className="flex items-center justify-between mt-1.5">
                      {!selectedOpp && (
                        <span className="text-[9px] text-gray-600 truncate max-w-[80px]">
                          {section.opportunity_id ? (oppMap[section.opportunity_id] ?? '') : ''}
                        </span>
                      )}
                      {section.due_date && (
                        <span className={`text-[10px] font-medium ${dueColor(section.due_date)}`}>
                          {daysUntil(section.due_date)}
                        </span>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-600">
        {filteredSections.length} section{filteredSections.length !== 1 ? 's' : ''} across {COLUMNS.length} stages.
        {canEdit ? ' Click a section to edit.' : ''}
      </p>
    </div>
  )
}
