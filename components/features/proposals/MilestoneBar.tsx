// filepath: components/features/proposals/MilestoneBar.tsx
'use client'

/**
 * MilestoneBar — individual milestone card for list views
 *
 * Displays a horizontal card with colored type icon, milestone details,
 * scheduled/actual dates, notes preview, and status badge.
 *
 * v1.3 Sprint 31 T-31.1 — Proposal Timeline & Milestones
 */

import {
  ShieldCheck,
  Palette,
  Send,
  MessageCircle,
  Rocket,
  FileEdit,
  FileCheck2,
  Flag,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  getMilestoneColor,
  getMilestoneBgColor,
  getStatusColor,
  formatMilestoneType,
  formatMilestoneStatus,
  formatDate,
} from '@/lib/proposals/timeline-utils'
import type { MilestoneType, MilestoneStatus } from '@/lib/types/sync'

// ─── Props ────────────────────────────────────────────────────────

interface MilestoneBarProps {
  milestone: {
    id: string
    title: string
    milestone_type: string
    scheduled_date: string
    actual_date: string | null
    status: string
    notes: string | null
    created_by_name: string | null
  }
}

// ─── Icon Map ─────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  gate_review: ShieldCheck,
  color_team: Palette,
  submission: Send,
  debrief: MessageCircle,
  kickoff: Rocket,
  draft_due: FileEdit,
  final_due: FileCheck2,
  custom: Flag,
}

// ─── Component ────────────────────────────────────────────────────

export function MilestoneBar({ milestone }: MilestoneBarProps) {
  const type = milestone.milestone_type as MilestoneType
  const status = milestone.status as MilestoneStatus
  const Icon = ICON_MAP[type] ?? Flag

  const isOverdue =
    status !== 'completed' &&
    status !== 'cancelled' &&
    new Date(milestone.scheduled_date) < new Date()

  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:border-border/80">
      {/* Left: Colored icon */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${getMilestoneBgColor(type)}/15`}
      >
        <Icon className={`h-5 w-5 ${getMilestoneColor(type)}`} />
      </div>

      {/* Center: Details */}
      <div className="min-w-0 flex-1">
        {/* Title row */}
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-medium text-white">
            {milestone.title}
          </h3>
          <span className={`shrink-0 text-[10px] font-medium ${getMilestoneColor(type)}`}>
            {formatMilestoneType(type)}
          </span>
        </div>

        {/* Date row */}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span>
            Scheduled: {formatDate(milestone.scheduled_date)}
          </span>
          {milestone.actual_date && (
            <span>
              Actual: {formatDate(milestone.actual_date)}
            </span>
          )}
          {isOverdue && (
            <span className="font-medium text-red-400">
              Overdue
            </span>
          )}
        </div>

        {/* Notes preview */}
        {milestone.notes && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground/80">
            {milestone.notes}
          </p>
        )}

        {/* Created by */}
        {milestone.created_by_name && (
          <p className="mt-1 text-[10px] text-muted-foreground/60">
            Created by {milestone.created_by_name}
          </p>
        )}
      </div>

      {/* Right: Status badge */}
      <span
        className={`shrink-0 self-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(status)}`}
      >
        {formatMilestoneStatus(status)}
      </span>
    </div>
  )
}
