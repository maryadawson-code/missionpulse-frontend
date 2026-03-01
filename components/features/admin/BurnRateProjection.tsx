/**
 * Burn Rate Projection — Shows projected exhaustion date.
 *
 * "At current pace, you'll hit your limit on March 18"
 */
'use client'

import { TrendingDown, TrendingUp, CheckCircle2 } from 'lucide-react'

interface BurnRateProjectionProps {
  avgDailyTokens: number
  projectedExhaustionDate: string | null
  daysRemaining: number | null
  periodEnd: string
}

function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toLocaleString()
}

export function BurnRateProjection({
  avgDailyTokens,
  projectedExhaustionDate,
  daysRemaining,
  periodEnd,
}: BurnRateProjectionProps) {
  const periodEndDate = new Date(periodEnd).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  })

  const isAtRisk = daysRemaining !== null && daysRemaining <= 7
  const willExhaust = projectedExhaustionDate !== null

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Burn Rate Projection
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Based on {formatTokens(avgDailyTokens)} tokens/day average
          </p>
        </div>
        {willExhaust ? (
          isAtRisk ? (
            <TrendingDown className="h-5 w-5 text-red-400" />
          ) : (
            <TrendingUp className="h-5 w-5 text-yellow-400" />
          )
        ) : (
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        )}
      </div>

      <div className="mt-4">
        {willExhaust ? (
          <div>
            <p className={`text-lg font-semibold ${isAtRisk ? 'text-red-400' : 'text-yellow-400'}`}>
              {daysRemaining === 0
                ? 'Limit reached'
                : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining`}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              At current pace, you&apos;ll hit your limit on{' '}
              <span className="font-medium text-foreground">
                {new Date(projectedExhaustionDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-semibold text-emerald-400">
              On track
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              At current pace, usage won&apos;t exceed allocation before{' '}
              <span className="font-medium text-foreground">{periodEndDate}</span>
            </p>
          </div>
        )}
      </div>

      {/* Daily average indicator */}
      <div className="mt-4 flex items-center gap-4 border-t border-border pt-4">
        <div>
          <p className="text-xs text-muted-foreground">Daily Avg</p>
          <p className="text-sm font-semibold text-foreground">
            {formatTokens(avgDailyTokens)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Period Ends</p>
          <p className="text-sm font-semibold text-foreground">{periodEndDate}</p>
        </div>
      </div>
    </div>
  )
}
