import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  // Opportunity statuses
  Active: 'bg-cyan/10 text-cyan border-cyan/30',
  Won: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30',
  Lost: 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/30',
  'No-Bid': 'bg-slate-100 dark:bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-500/30',

  // Section statuses (6-state color team workflow)
  draft: 'bg-slate-100 dark:bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-500/30',
  pink_review: 'bg-pink-100 dark:bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-300 dark:border-pink-500/30',
  revision: 'bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-500/30',
  green_review: 'bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300 border-green-300 dark:border-green-500/30',
  red_review: 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/30',
  final: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30',
  // Legacy section statuses (backwards compat)
  Draft: 'bg-slate-100 dark:bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-500/30',
  Review: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30',
  Revision: 'bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-500/30',
  Final: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30',

  // Compliance statuses
  'Not Started': 'bg-slate-100 dark:bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-500/30',
  'In Progress': 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-500/30',
  Addressed: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30',
  Verified: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30',

  // Generic
  Pending: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30',
  Approved: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30',
  Rejected: 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/30',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pink_review: 'Pink Team',
  revision: 'Revision',
  green_review: 'Green Team',
  red_review: 'Red Team',
  final: 'Final',
}

const DEFAULT_STYLE = 'bg-muted text-muted-foreground border-border'

interface StatusBadgeProps {
  status: string | null
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const raw = status ?? 'Unknown'
  const label = STATUS_LABELS[raw] ?? raw
  const style = STATUS_STYLES[raw] ?? DEFAULT_STYLE

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        style,
        className
      )}
    >
      {label}
    </span>
  )
}
