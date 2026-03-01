/**
 * Token Gauge — Consumed / Allocated gauge with color zones.
 *
 * Green <50%, Yellow 50-75%, Orange 75-90%, Red >90%
 */
'use client'

import Link from 'next/link'
import { Zap } from 'lucide-react'

interface TokenGaugeProps {
  consumed: number
  allocated: number
  purchased: number
  planName: string
  usagePercent: number
  showUpgradeCta: boolean
}

function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toLocaleString()
}

export function TokenGauge({
  consumed,
  allocated,
  purchased,
  planName,
  usagePercent,
  showUpgradeCta,
}: TokenGaugeProps) {
  const totalAvailable = allocated + purchased
  const remaining = Math.max(0, totalAvailable - consumed)

  const gaugeColor =
    usagePercent >= 90
      ? '#EF4444'
      : usagePercent >= 75
        ? '#F97316'
        : usagePercent >= 50
          ? '#EAB308'
          : '#00E5FA'

  // SVG gauge dimensions
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const fillPercent = Math.min(usagePercent, 100)
  const dashOffset = circumference - (fillPercent / 100) * circumference

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Token Allocation
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {planName} — {formatTokens(allocated)} tokens/mo
          </p>
        </div>
        {showUpgradeCta && (
          <Link
            href="/settings/billing"
            className="inline-flex items-center gap-1 rounded-md bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-cyan-500 transition-colors"
          >
            <Zap className="h-3 w-3" />
            {usagePercent >= 100 ? 'Buy More' : 'Upgrade'}
          </Link>
        )}
      </div>

      <div className="mt-4 flex items-center gap-6">
        {/* Circular gauge */}
        <div className="relative shrink-0">
          <svg width="160" height="160" viewBox="0 0 160 160">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="12"
            />
            {/* Progress arc */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={gaugeColor}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 80 80)"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground">
              {usagePercent}%
            </span>
            <span className="text-xs text-muted-foreground">used</span>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3 flex-1">
          <div>
            <p className="text-xs text-muted-foreground">Consumed</p>
            <p className="text-lg font-semibold text-foreground">
              {formatTokens(consumed)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
              {formatTokens(remaining)}
            </p>
          </div>
          {purchased > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">Purchased (add-on)</p>
              <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
                +{formatTokens(purchased)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="h-2 w-full rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(usagePercent, 100)}%`,
              backgroundColor: gaugeColor,
            }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>0</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  )
}
