'use client'

import Link from 'next/link'

interface TokenMeterProps {
  consumed: number
  allocated: number
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

export function TokenMeter({ consumed, allocated }: TokenMeterProps) {
  if (allocated <= 0) return null

  const pct = Math.min(Math.round((consumed / allocated) * 100), 100)
  const color =
    pct >= 90
      ? 'bg-red-500'
      : pct >= 70
        ? 'bg-amber-500'
        : 'bg-emerald-500'

  const textColor =
    pct >= 90
      ? 'text-red-600 dark:text-red-400'
      : pct >= 70
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-muted-foreground'

  return (
    <Link
      href="/settings/billing"
      className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
      title={`${formatTokens(consumed)} / ${formatTokens(allocated)} tokens used this month`}
    >
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-[10px] font-medium ${textColor}`}>
        {formatTokens(consumed)}/{formatTokens(allocated)}
      </span>
    </Link>
  )
}
