// filepath: lib/proposals/timeline-utils.ts
/**
 * Proposal Timeline Utilities
 *
 * Pure TypeScript helpers for milestone timeline calculations,
 * color mapping, and date positioning. No server/client directives.
 *
 * v1.3 Sprint 31 T-31.1 — Proposal Timeline & Milestones
 */

import type { MilestoneType, MilestoneStatus, ProposalMilestone } from '@/lib/types/sync'

// ─── Date Calculations ────────────────────────────────────────────

/**
 * Calculate the number of days between two ISO date strings.
 * Returns a positive integer regardless of order.
 */
export function daysBetween(dateA: string, dateB: string): number {
  const msPerDay = 86_400_000
  const a = new Date(dateA).getTime()
  const b = new Date(dateB).getTime()
  return Math.round(Math.abs(a - b) / msPerDay)
}

// ─── Milestone Type → Color ───────────────────────────────────────

const MILESTONE_TYPE_COLORS: Record<MilestoneType, string> = {
  gate_review: 'text-purple-400',
  color_team: 'text-amber-400',
  submission: 'text-red-400',
  debrief: 'text-blue-400',
  kickoff: 'text-emerald-400',
  draft_due: 'text-cyan-400',
  final_due: 'text-rose-400',
  custom: 'text-slate-400',
}

/**
 * Return a Tailwind text-color class for a milestone type.
 */
export function getMilestoneColor(type: MilestoneType): string {
  return MILESTONE_TYPE_COLORS[type] ?? 'text-slate-400'
}

// ─── Milestone Type → Background Color (for dots / markers) ──────

const MILESTONE_TYPE_BG_COLORS: Record<MilestoneType, string> = {
  gate_review: 'bg-purple-400',
  color_team: 'bg-amber-400',
  submission: 'bg-red-400',
  debrief: 'bg-blue-400',
  kickoff: 'bg-emerald-400',
  draft_due: 'bg-cyan-400',
  final_due: 'bg-rose-400',
  custom: 'bg-slate-400',
}

export function getMilestoneBgColor(type: MilestoneType): string {
  return MILESTONE_TYPE_BG_COLORS[type] ?? 'bg-slate-400'
}

// ─── Milestone Type → Icon Name ──────────────────────────────────

const MILESTONE_TYPE_ICONS: Record<MilestoneType, string> = {
  gate_review: 'ShieldCheck',
  color_team: 'Palette',
  submission: 'Send',
  debrief: 'MessageCircle',
  kickoff: 'Rocket',
  draft_due: 'FileEdit',
  final_due: 'FileCheck2',
  custom: 'Flag',
}

/**
 * Return a lucide-react icon name for a milestone type.
 */
export function getMilestoneIcon(type: MilestoneType): string {
  return MILESTONE_TYPE_ICONS[type] ?? 'Flag'
}

// ─── Milestone Status → Color ────────────────────────────────────

const STATUS_COLORS: Record<MilestoneStatus, string> = {
  upcoming: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  in_progress: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  completed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  missed: 'bg-red-500/15 text-red-300 border-red-500/30',
  cancelled: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
}

/**
 * Return Tailwind bg + text + border classes for a milestone status.
 */
export function getStatusColor(status: MilestoneStatus): string {
  return STATUS_COLORS[status] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/30'
}

// ─── Sorting ─────────────────────────────────────────────────────

/**
 * Sort milestones by scheduled_date ascending (earliest first).
 * Returns a new array — does not mutate the input.
 */
export function sortMilestones(milestones: ProposalMilestone[]): ProposalMilestone[] {
  return [...milestones].sort(
    (a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
  )
}

// ─── Timeline Range ──────────────────────────────────────────────

interface TimelineRange {
  start: string
  end: string
  totalDays: number
}

/**
 * Calculate the date range spanning all milestones.
 * Returns start/end ISO strings and the total number of days.
 * If no milestones, returns today-based defaults with 0 totalDays.
 */
export function getTimelineRange(milestones: ProposalMilestone[]): TimelineRange {
  if (milestones.length === 0) {
    const today = new Date().toISOString().slice(0, 10)
    return { start: today, end: today, totalDays: 0 }
  }

  const sorted = sortMilestones(milestones)
  const start = sorted[0].scheduled_date
  const end = sorted[sorted.length - 1].scheduled_date
  const totalDays = daysBetween(start, end)

  return { start, end, totalDays }
}

// ─── Position Calculation ────────────────────────────────────────

/**
 * Calculate a 0-100 percentage position for a date within a timeline range.
 * Clamps to [0, 100]. If totalDays is 0, returns 50 (center).
 */
export function calculatePosition(date: string, start: string, totalDays: number): number {
  if (totalDays === 0) return 50

  const msPerDay = 86_400_000
  const dateMs = new Date(date).getTime()
  const startMs = new Date(start).getTime()
  const dayOffset = (dateMs - startMs) / msPerDay

  const pct = (dayOffset / totalDays) * 100
  return Math.max(0, Math.min(100, pct))
}

// ─── Formatting Helpers ──────────────────────────────────────────

/**
 * Format a milestone type slug into a human-readable label.
 */
export function formatMilestoneType(type: MilestoneType): string {
  const labels: Record<MilestoneType, string> = {
    gate_review: 'Gate Review',
    color_team: 'Color Team',
    submission: 'Submission',
    debrief: 'Debrief',
    kickoff: 'Kickoff',
    draft_due: 'Draft Due',
    final_due: 'Final Due',
    custom: 'Custom',
  }
  return labels[type] ?? type
}

/**
 * Format a milestone status slug into a human-readable label.
 */
export function formatMilestoneStatus(status: MilestoneStatus): string {
  const labels: Record<MilestoneStatus, string> = {
    upcoming: 'Upcoming',
    in_progress: 'In Progress',
    completed: 'Completed',
    missed: 'Missed',
    cancelled: 'Cancelled',
  }
  return labels[status] ?? status
}

/**
 * Format an ISO date string into a short display format (e.g. "Feb 22, 2026").
 */
export function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Format an ISO date string into an abbreviated format (e.g. "Feb 22").
 */
export function formatDateShort(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
