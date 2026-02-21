'use client'

interface ConfidenceBadgeProps {
  level: 'high' | 'medium' | 'low'
}

const BADGE_STYLES = {
  high: 'bg-emerald-500/20 text-emerald-400',
  medium: 'bg-amber-500/20 text-amber-400',
  low: 'bg-red-500/20 text-red-400',
}

const BADGE_LABELS = {
  high: 'High Confidence',
  medium: 'Medium Confidence',
  low: 'Low Confidence',
}

export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${BADGE_STYLES[level]}`}
    >
      <span
        className={`mr-1 h-1.5 w-1.5 rounded-full ${
          level === 'high'
            ? 'bg-emerald-400'
            : level === 'medium'
              ? 'bg-amber-400'
              : 'bg-red-400'
        }`}
      />
      {BADGE_LABELS[level]}
    </span>
  )
}
