// filepath: components/features/proposals/WorkBreakdownMatrix.tsx
'use client'

/**
 * WorkBreakdownMatrix
 *
 * Grid showing sections grouped by volume, with assignment status,
 * assignee info, word counts, and deadlines. Volumes are rendered
 * as accordion sections, all expanded by default.
 *
 * v1.3 Sprint 31 T-31.2 — Work Breakdown Structure
 */

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { SectionAssignmentCard } from './SectionAssignmentCard'

// ─── Types ───────────────────────────────────────────────────────

interface WorkBreakdownMatrixProps {
  volumes: {
    id: string
    volume_name: string
    volume_number: number
  }[]
  sections: {
    id: string
    title: string
    volume: string | null
    status: string
    content: string | null
  }[]
  assignments: {
    section_id: string
    assignee_id: string
    status: string
    word_count: number
    deadline: string | null
  }[]
  teamMembers: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  }[]
}

// ─── Helpers ─────────────────────────────────────────────────────

function buildAssignmentMap(
  assignments: WorkBreakdownMatrixProps['assignments']
): Map<string, WorkBreakdownMatrixProps['assignments'][number]> {
  const map = new Map<string, WorkBreakdownMatrixProps['assignments'][number]>()
  for (const a of assignments) {
    map.set(a.section_id, a)
  }
  return map
}

function buildMemberNameMap(
  members: WorkBreakdownMatrixProps['teamMembers']
): Map<string, string> {
  const map = new Map<string, string>()
  for (const m of members) {
    map.set(m.id, m.full_name ?? m.email)
  }
  return map
}

// ─── Component ───────────────────────────────────────────────────

export function WorkBreakdownMatrix({
  volumes,
  sections,
  assignments,
  teamMembers,
}: WorkBreakdownMatrixProps) {
  // All volumes expanded by default
  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(
    () => new Set(volumes.map((v) => v.id))
  )

  const assignmentMap = buildAssignmentMap(assignments)
  const memberNameMap = buildMemberNameMap(teamMembers)

  // Group sections by volume ID
  const sectionsByVolume = new Map<string, WorkBreakdownMatrixProps['sections']>()
  const unvolumeSections: WorkBreakdownMatrixProps['sections'] = []

  for (const section of sections) {
    if (section.volume) {
      const existing = sectionsByVolume.get(section.volume) ?? []
      existing.push(section)
      sectionsByVolume.set(section.volume, existing)
    } else {
      unvolumeSections.push(section)
    }
  }

  // Sort volumes by volume_number
  const sortedVolumes = [...volumes].sort((a, b) => a.volume_number - b.volume_number)

  function toggleVolume(volumeId: string) {
    setExpandedVolumes((prev) => {
      const next = new Set(prev)
      if (next.has(volumeId)) {
        next.delete(volumeId)
      } else {
        next.add(volumeId)
      }
      return next
    })
  }

  function renderSectionGrid(volumeSections: WorkBreakdownMatrixProps['sections']) {
    if (volumeSections.length === 0) {
      return (
        <div className="px-4 py-6 text-center text-xs text-muted-foreground">
          No sections in this volume.
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
        {volumeSections.map((section) => {
          const assignment = assignmentMap.get(section.id) ?? null
          const assigneeName = assignment
            ? memberNameMap.get(assignment.assignee_id) ?? null
            : null

          return (
            <SectionAssignmentCard
              key={section.id}
              section={section}
              assignment={assignment}
              assigneeName={assigneeName}
            />
          )
        })}
      </div>
    )
  }

  function renderVolumeStats(volumeSections: WorkBreakdownMatrixProps['sections']) {
    const total = volumeSections.length
    const assigned = volumeSections.filter((s) => assignmentMap.has(s.id)).length
    const completed = volumeSections.filter((s) => {
      const a = assignmentMap.get(s.id)
      return a?.status === 'complete'
    }).length

    return (
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <span>{total} section{total !== 1 ? 's' : ''}</span>
        <span className="h-3 w-px bg-border" />
        <span>{assigned} assigned</span>
        <span className="h-3 w-px bg-border" />
        <span className="text-emerald-400">{completed} complete</span>
      </div>
    )
  }

  if (sortedVolumes.length === 0 && unvolumeSections.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-6 py-10 text-center">
        <svg
          className="mx-auto h-8 w-8 text-muted-foreground/40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
          />
        </svg>
        <p className="mt-2 text-sm text-muted-foreground">
          No sections found. Add volumes and sections to this proposal.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Volume accordions */}
      {sortedVolumes.map((volume) => {
        const volumeSections = sectionsByVolume.get(volume.id) ?? []
        const isExpanded = expandedVolumes.has(volume.id)

        return (
          <div
            key={volume.id}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            {/* Volume header */}
            <button
              type="button"
              onClick={() => toggleVolume(volume.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <svg
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform',
                    isExpanded && 'rotate-90'
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>

                <div>
                  <span className="text-sm font-semibold text-foreground">
                    Vol {volume.volume_number}: {volume.volume_name}
                  </span>
                </div>
              </div>

              {renderVolumeStats(volumeSections)}
            </button>

            {/* Expanded content */}
            {isExpanded && renderSectionGrid(volumeSections)}
          </div>
        )
      })}

      {/* Unassigned-to-volume sections */}
      {unvolumeSections.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-semibold text-foreground">
              Unassigned to Volume
            </span>
            {renderVolumeStats(unvolumeSections)}
          </div>
          {renderSectionGrid(unvolumeSections)}
        </div>
      )}
    </div>
  )
}
