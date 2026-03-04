// filepath: components/features/proposals/TeamRollup.tsx
'use client'

/**
 * TeamRollup
 *
 * Per-person summary of section assignments. Shows a grid of team member
 * cards with progress bars, word counts, deadlines, and status breakdowns.
 *
 * v1.3 Sprint 31 T-31.2 — Work Breakdown Structure
 */

import Image from 'next/image'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────

interface TeamRollupProps {
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
  sections: {
    id: string
    title: string
  }[]
}

interface MemberSummary {
  member: TeamRollupProps['teamMembers'][number]
  totalAssignments: number
  completedCount: number
  assignedCount: number
  inProgressCount: number
  reviewCount: number
  completeCount: number
  totalWords: number
  nearestDeadline: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────

function getInitials(fullName: string | null, email: string): string {
  if (fullName) {
    return fullName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
  }
  return email.charAt(0).toUpperCase()
}

function formatDeadlineShort(deadline: string | null): { label: string; urgency: string } {
  if (!deadline) {
    return { label: 'No deadline', urgency: 'text-muted-foreground' }
  }

  const now = new Date()
  const target = new Date(deadline)
  const diffMs = target.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { label: `${Math.abs(diffDays)}d overdue`, urgency: 'text-red-600 dark:text-red-400' }
  }
  if (diffDays === 0) {
    return { label: 'Due today', urgency: 'text-red-600 dark:text-red-400' }
  }
  if (diffDays <= 3) {
    return { label: `${diffDays}d left`, urgency: 'text-amber-600 dark:text-amber-400' }
  }
  if (diffDays <= 7) {
    return { label: `${diffDays}d left`, urgency: 'text-yellow-700 dark:text-yellow-300' }
  }
  return { label: `${diffDays}d left`, urgency: 'text-muted-foreground' }
}

function formatWordCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return `${count}`
}

// ─── Component ───────────────────────────────────────────────────

export function TeamRollup({ assignments, teamMembers, sections: _sections }: TeamRollupProps) {
  // Build per-member summaries
  const summaries: MemberSummary[] = teamMembers
    .map((member): MemberSummary | null => {
      const memberAssignments = assignments.filter((a) => a.assignee_id === member.id)

      if (memberAssignments.length === 0) return null

      const assignedCount = memberAssignments.filter((a) => a.status === 'assigned').length
      const inProgressCount = memberAssignments.filter((a) => a.status === 'in_progress').length
      const reviewCount = memberAssignments.filter((a) => a.status === 'review').length
      const completeCount = memberAssignments.filter((a) => a.status === 'complete').length
      const totalWords = memberAssignments.reduce((sum, a) => sum + a.word_count, 0)

      // Find nearest future deadline
      const now = new Date()
      const upcomingDeadlines = memberAssignments
        .filter((a) => a.deadline && a.status !== 'complete')
        .map((a) => a.deadline!)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

      // Prefer nearest upcoming; if all past, use the most recent overdue
      const nearestUpcoming = upcomingDeadlines.find((d) => new Date(d).getTime() >= now.getTime())
      const nearestDeadline: string | null = nearestUpcoming ?? upcomingDeadlines[0] ?? null

      return {
        member,
        totalAssignments: memberAssignments.length,
        completedCount: completeCount,
        assignedCount,
        inProgressCount,
        reviewCount,
        completeCount,
        totalWords,
        nearestDeadline,
      }
    })
    .filter((s): s is MemberSummary => s !== null)
    .sort((a, b) => b.totalAssignments - a.totalAssignments)

  if (summaries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-6 py-8 text-center">
        <p className="text-sm text-muted-foreground">No team assignments yet.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {summaries.map((summary) => {
        const pct =
          summary.totalAssignments > 0
            ? Math.round((summary.completedCount / summary.totalAssignments) * 100)
            : 0

        const deadlineInfo = formatDeadlineShort(summary.nearestDeadline)

        return (
          <div
            key={summary.member.id}
            className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-border/80"
          >
            {/* Header: avatar + name */}
            <div className="flex items-center gap-3">
              {summary.member.avatar_url ? (
                <Image
                  src={summary.member.avatar_url}
                  alt={summary.member.full_name ?? summary.member.email}
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {getInitials(summary.member.full_name, summary.member.email)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {summary.member.full_name ?? summary.member.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.totalAssignments} section{summary.totalAssignments !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Progress</span>
                <span className="text-[11px] font-medium text-foreground">{pct}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    pct === 100
                      ? 'bg-emerald-500'
                      : pct >= 50
                        ? 'bg-primary'
                        : 'bg-amber-500'
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-3 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">
                {formatWordCount(summary.totalWords)} words
              </span>
              <span className={deadlineInfo.urgency}>{deadlineInfo.label}</span>
            </div>

            {/* Status breakdown */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {summary.assignedCount > 0 && (
                <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300">
                  {summary.assignedCount} assigned
                </span>
              )}
              {summary.inProgressCount > 0 && (
                <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                  {summary.inProgressCount} in progress
                </span>
              )}
              {summary.reviewCount > 0 && (
                <span className="inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/15 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:text-purple-300">
                  {summary.reviewCount} review
                </span>
              )}
              {summary.completeCount > 0 && (
                <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                  {summary.completeCount} complete
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
