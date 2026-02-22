// filepath: components/features/proposals/SectionAssignmentCard.tsx
'use client'

/**
 * SectionAssignmentCard
 *
 * Individual section card used in the WorkBreakdownMatrix.
 * Shows section title, assignee, status badge, word count, and deadline.
 *
 * v1.3 Sprint 31 T-31.2 — Work Breakdown Structure
 */

import { cn } from '@/lib/utils'

// ─── Status Styles ───────────────────────────────────────────────

const ASSIGNMENT_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  assigned: {
    bg: 'bg-blue-500/15 border-blue-500/30',
    text: 'text-blue-300',
    label: 'Assigned',
  },
  in_progress: {
    bg: 'bg-amber-500/15 border-amber-500/30',
    text: 'text-amber-300',
    label: 'In Progress',
  },
  review: {
    bg: 'bg-purple-500/15 border-purple-500/30',
    text: 'text-purple-300',
    label: 'Review',
  },
  complete: {
    bg: 'bg-emerald-500/15 border-emerald-500/30',
    text: 'text-emerald-300',
    label: 'Complete',
  },
}

const DEFAULT_STATUS_STYLE = {
  bg: 'bg-slate-500/15 border-slate-500/30',
  text: 'text-slate-300',
  label: 'Unknown',
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatDeadline(deadline: string | null): { label: string; urgency: string } {
  if (!deadline) {
    return { label: 'No deadline', urgency: 'text-muted-foreground' }
  }

  const now = new Date()
  const target = new Date(deadline)
  const diffMs = target.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays)
    return {
      label: overdueDays === 1 ? '1 day overdue' : `${overdueDays} days overdue`,
      urgency: 'text-red-400',
    }
  }

  if (diffDays === 0) {
    return { label: 'Due today', urgency: 'text-red-400' }
  }

  if (diffDays === 1) {
    return { label: '1 day left', urgency: 'text-amber-400' }
  }

  if (diffDays <= 3) {
    return { label: `${diffDays} days left`, urgency: 'text-amber-400' }
  }

  if (diffDays <= 7) {
    return { label: `${diffDays} days left`, urgency: 'text-yellow-300' }
  }

  return { label: `${diffDays} days left`, urgency: 'text-muted-foreground' }
}

function formatWordCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k words`
  }
  return `${count} words`
}

// ─── Props ───────────────────────────────────────────────────────

interface SectionAssignmentCardProps {
  section: {
    id: string
    title: string
    status: string
    content: string | null
  }
  assignment: {
    assignee_id: string
    status: string
    word_count: number
    deadline: string | null
  } | null
  assigneeName: string | null
}

// ─── Component ───────────────────────────────────────────────────

export function SectionAssignmentCard({
  section,
  assignment,
  assigneeName,
}: SectionAssignmentCardProps) {
  const statusKey = assignment?.status ?? section.status
  const style = ASSIGNMENT_STATUS_STYLES[statusKey] ?? DEFAULT_STATUS_STYLE
  const deadline = formatDeadline(assignment?.deadline ?? null)
  const wordCount = assignment?.word_count ?? 0
  const isUnassigned = !assignment

  return (
    <div
      className={cn(
        'group rounded-lg border p-3 transition-colors',
        isUnassigned
          ? 'border-amber-500/20 bg-amber-500/[0.03]'
          : 'border-border bg-card hover:border-border/80'
      )}
    >
      {/* Title */}
      <p className="text-sm font-medium text-foreground leading-snug">
        {section.title}
      </p>

      {/* Assignee */}
      <div className="mt-2 flex items-center gap-2">
        {isUnassigned ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            Unassigned
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {assigneeName ?? 'Unknown'}
          </span>
        )}
      </div>

      {/* Meta row: status badge + word count + deadline */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {/* Status badge */}
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
            style.bg,
            style.text
          )}
        >
          {style.label}
        </span>

        {/* Word count */}
        {wordCount > 0 && (
          <span className="text-[11px] text-muted-foreground">
            {formatWordCount(wordCount)}
          </span>
        )}

        {/* Deadline */}
        <span className={cn('text-[11px]', deadline.urgency)}>
          {deadline.label}
        </span>
      </div>
    </div>
  )
}
