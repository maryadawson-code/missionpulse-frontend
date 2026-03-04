// filepath: components/features/proposals/GanttTimeline.tsx
'use client'

/**
 * GanttTimeline — visual horizontal Gantt-style timeline
 *
 * Renders milestone markers on a date axis with hover tooltips,
 * status-based opacity, and a "today" indicator line.
 *
 * Pure display component — no data fetching.
 *
 * v1.3 Sprint 31 T-31.1 — Proposal Timeline & Milestones
 */

import { useState, useMemo } from 'react'
import {
  calculatePosition,
  getTimelineRange,
  getMilestoneBgColor,
  getMilestoneColor,
  getStatusColor,
  formatMilestoneType,
  formatMilestoneStatus,
  formatDate,
  sortMilestones,
} from '@/lib/proposals/timeline-utils'
import type { MilestoneType, MilestoneStatus, ProposalMilestone } from '@/lib/types/sync'

// ─── Props ────────────────────────────────────────────────────────

interface TimelineMilestone {
  id: string
  title: string
  type: string
  scheduled_date: string
  actual_date: string | null
  status: string
}

interface GanttTimelineProps {
  milestones: TimelineMilestone[]
}

// ─── Helpers ──────────────────────────────────────────────────────

function statusOpacity(status: string): string {
  switch (status) {
    case 'completed':
      return 'opacity-100'
    case 'missed':
      return 'opacity-50'
    case 'cancelled':
      return 'opacity-30'
    default:
      return 'opacity-100'
  }
}

/**
 * Generate evenly spaced date labels along the timeline range.
 */
function generateAxisLabels(
  start: string,
  end: string,
  count: number
): { label: string; position: number }[] {
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  const span = endMs - startMs

  if (span <= 0 || count < 2) {
    return [{ label: formatAxisDate(start), position: 50 }]
  }

  const labels: { label: string; position: number }[] = []
  for (let i = 0; i < count; i++) {
    const fraction = i / (count - 1)
    const ms = startMs + span * fraction
    const date = new Date(ms)
    labels.push({
      label: formatAxisDate(date.toISOString()),
      position: fraction * 100,
    })
  }
  return labels
}

function formatAxisDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Component ────────────────────────────────────────────────────

export function GanttTimeline({ milestones }: GanttTimelineProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Convert to ProposalMilestone shape for utility functions
  const asMilestones: ProposalMilestone[] = useMemo(
    () =>
      milestones.map((m) => ({
        id: m.id,
        opportunity_id: '',
        company_id: '',
        milestone_type: m.type as MilestoneType,
        title: m.title,
        scheduled_date: m.scheduled_date,
        actual_date: m.actual_date,
        status: m.status as MilestoneStatus,
        notes: null,
        created_by: null,
        created_at: '',
        updated_at: '',
      })),
    [milestones]
  )

  const sorted = useMemo(() => sortMilestones(asMilestones), [asMilestones])
  const range = useMemo(() => getTimelineRange(asMilestones), [asMilestones])
  const axisLabels = useMemo(
    () => generateAxisLabels(range.start, range.end, Math.min(6, Math.max(2, milestones.length))),
    [range, milestones.length]
  )

  // Today marker position
  const todayIso = new Date().toISOString().slice(0, 10)
  const todayPos = range.totalDays > 0 ? calculatePosition(todayIso, range.start, range.totalDays) : -1
  const showTodayMarker = todayPos >= 0 && todayPos <= 100

  if (milestones.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border bg-card py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No milestones to display. Add milestones to visualize the proposal timeline.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      {/* Timeline track */}
      <div className="relative">
        {/* Axis labels */}
        <div className="relative mb-2 h-5">
          {axisLabels.map((label, i) => (
            <span
              key={i}
              className="absolute -translate-x-1/2 text-[10px] text-muted-foreground"
              style={{ left: `${label.position}%` }}
            >
              {label.label}
            </span>
          ))}
        </div>

        {/* Track line */}
        <div className="relative h-16">
          {/* Horizontal rail */}
          <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border" />

          {/* Today marker */}
          {showTodayMarker && (
            <div
              className="absolute top-0 bottom-0 w-px border-l border-dashed border-primary/50"
              style={{ left: `${todayPos}%` }}
            >
              <span className="absolute -top-5 -translate-x-1/2 whitespace-nowrap rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                Today
              </span>
            </div>
          )}

          {/* Milestone dots */}
          {sorted.map((ms) => {
            const pos = calculatePosition(ms.scheduled_date, range.start, range.totalDays)
            const isHovered = hoveredId === ms.id
            const original = milestones.find((m) => m.id === ms.id)

            return (
              <div
                key={ms.id}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${pos}%` }}
                onMouseEnter={() => setHoveredId(ms.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Dot */}
                <div
                  className={`h-4 w-4 rounded-full border-2 border-background transition-transform ${getMilestoneBgColor(ms.milestone_type)} ${statusOpacity(ms.status)} ${isHovered ? 'scale-150' : ''}`}
                />

                {/* Label below dot */}
                <div className="absolute top-6 -translate-x-1/2 left-1/2 whitespace-nowrap">
                  <span className={`text-[10px] font-medium ${getMilestoneColor(ms.milestone_type)} ${statusOpacity(ms.status)}`}>
                    {ms.title.length > 18 ? `${ms.title.slice(0, 16)}...` : ms.title}
                  </span>
                </div>

                {/* Hover tooltip */}
                {isHovered && original && (
                  <div className="absolute bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-border bg-card px-4 py-3 shadow-xl">
                    <p className="whitespace-nowrap text-sm font-medium text-foreground">
                      {original.title}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${getStatusColor(ms.status as MilestoneStatus)}`}>
                        {formatMilestoneStatus(ms.status as MilestoneStatus)}
                      </span>
                      <span className={`text-[10px] ${getMilestoneColor(ms.milestone_type)}`}>
                        {formatMilestoneType(ms.milestone_type)}
                      </span>
                    </div>
                    <div className="mt-1 space-y-0.5 text-[10px] text-muted-foreground">
                      <p>Scheduled: {formatDate(ms.scheduled_date)}</p>
                      {ms.actual_date && <p>Actual: {formatDate(ms.actual_date)}</p>}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3">
        {(['gate_review', 'color_team', 'submission', 'debrief', 'kickoff', 'draft_due', 'final_due', 'custom'] as MilestoneType[]).map(
          (type) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className={`h-2.5 w-2.5 rounded-full ${getMilestoneBgColor(type)}`} />
              <span className="text-[10px] text-muted-foreground">
                {formatMilestoneType(type)}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  )
}
