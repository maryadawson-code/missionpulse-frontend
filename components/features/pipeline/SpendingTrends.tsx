'use client'

import { useState, useEffect, useTransition } from 'react'
import { TrendingUp, TrendingDown, BarChart3, Minus } from 'lucide-react'
import { type SpendingTrend } from '@/lib/integrations/usaspending/client'

// ─── Types ───────────────────────────────────────────────────

interface SpendingTrendsProps {
  agency: string | null
  naicsCode: string | null
  initialTrends?: SpendingTrend[]
}

// ─── Component ───────────────────────────────────────────────

export function SpendingTrends({
  agency,
  naicsCode,
  initialTrends = [],
}: SpendingTrendsProps) {
  const [trends, setTrends] = useState<SpendingTrend[]>(initialTrends)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Load data on mount if not provided
  useEffect(() => {
    if (!agency || initialTrends.length > 0) return

    startTransition(async () => {
      try {
        const { getSpendingTrends } = await import(
          '@/lib/integrations/usaspending/client'
        )
        const result = await getSpendingTrends(agency, naicsCode ?? undefined)
        if (result.error) setError(result.error)
        setTrends(result.trends)
      } catch {
        setError('Failed to load spending trends')
      }
    })
  }, [agency, naicsCode, initialTrends.length])

  const formatCurrency = (amount: number) => {
    if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`
    return `$${amount.toLocaleString()}`
  }

  if (!agency) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 text-center">
        <BarChart3 className="mx-auto mb-2 h-8 w-8 text-gray-600" />
        <p className="text-sm text-gray-500">No agency specified — spending trends unavailable</p>
      </div>
    )
  }

  // Sort trends by fiscal year ascending
  const sortedTrends = [...trends].sort((a, b) => a.fiscalYear - b.fiscalYear)

  // Calculate max for bar scaling
  const maxObligation = Math.max(...sortedTrends.map((t) => t.totalObligation), 1)

  // Calculate year-over-year change
  const getYoYChange = (index: number): number | null => {
    if (index === 0 || sortedTrends[index - 1].totalObligation === 0) return null
    const prev = sortedTrends[index - 1].totalObligation
    const curr = sortedTrends[index].totalObligation
    return ((curr - prev) / prev) * 100
  }

  // Overall trend direction
  const overallTrend = sortedTrends.length >= 2
    ? sortedTrends[sortedTrends.length - 1].totalObligation - sortedTrends[0].totalObligation
    : 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-cyan-400" />
          <h3 className="font-semibold text-white">Spending Trends</h3>
          <span className="text-xs text-gray-500">5-Year History</span>
        </div>
        {sortedTrends.length >= 2 && (
          <div className="flex items-center gap-1">
            {overallTrend > 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            ) : overallTrend < 0 ? (
              <TrendingDown className="h-4 w-4 text-red-400" />
            ) : (
              <Minus className="h-4 w-4 text-gray-400" />
            )}
            <span
              className={`text-xs font-medium ${
                overallTrend > 0
                  ? 'text-emerald-400'
                  : overallTrend < 0
                    ? 'text-red-400'
                    : 'text-gray-400'
              }`}
            >
              {overallTrend > 0 ? 'Growing' : overallTrend < 0 ? 'Declining' : 'Flat'}
            </span>
          </div>
        )}
      </div>

      {/* Loading */}
      {isPending && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 w-10 animate-pulse rounded bg-gray-800/50" />
              <div className="h-6 flex-1 animate-pulse rounded bg-gray-800/50" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-900/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Trend Bars */}
      {!isPending && sortedTrends.length > 0 && (
        <div className="space-y-2">
          {sortedTrends.map((trend, index) => {
            const barWidth = maxObligation > 0
              ? (trend.totalObligation / maxObligation) * 100
              : 0
            const yoyChange = getYoYChange(index)

            return (
              <div key={trend.fiscalYear} className="group">
                <div className="flex items-center gap-3">
                  {/* Year label */}
                  <span className="w-12 shrink-0 text-xs font-medium text-gray-400">
                    FY{trend.fiscalYear.toString().slice(-2)}
                  </span>

                  {/* Bar */}
                  <div className="flex-1 h-7 rounded bg-gray-800/30 relative overflow-hidden">
                    <div
                      className="h-full rounded bg-gradient-to-r from-cyan-500/30 to-cyan-500/60 transition-all duration-500"
                      style={{ width: `${Math.max(barWidth, 2)}%` }}
                    />
                    {/* Amount overlay */}
                    <div className="absolute inset-0 flex items-center px-2">
                      <span className="text-xs font-medium text-white/90">
                        {formatCurrency(trend.totalObligation)}
                      </span>
                    </div>
                  </div>

                  {/* Transaction count */}
                  <span className="w-16 shrink-0 text-right text-xs text-gray-500">
                    {trend.transactionCount.toLocaleString()} txns
                  </span>

                  {/* YoY change indicator */}
                  <div className="w-14 shrink-0 text-right">
                    {yoyChange !== null && (
                      <span
                        className={`text-xs font-medium ${
                          yoyChange > 0
                            ? 'text-emerald-400'
                            : yoyChange < 0
                              ? 'text-red-400'
                              : 'text-gray-500'
                        }`}
                      >
                        {yoyChange > 0 ? '+' : ''}
                        {yoyChange.toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!isPending && sortedTrends.length === 0 && !error && (
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 text-center">
          <BarChart3 className="mx-auto mb-2 h-6 w-6 text-gray-600" />
          <p className="text-sm text-gray-500">No spending trend data available</p>
        </div>
      )}

      {/* Summary stats */}
      {sortedTrends.length > 0 && (
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-800">
          <div className="text-center">
            <p className="text-xs text-gray-500">5yr Total</p>
            <p className="text-sm font-semibold text-white">
              {formatCurrency(sortedTrends.reduce((sum, t) => sum + t.totalObligation, 0))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Avg/Year</p>
            <p className="text-sm font-semibold text-white">
              {formatCurrency(
                sortedTrends.reduce((sum, t) => sum + t.totalObligation, 0) / sortedTrends.length
              )}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Total Txns</p>
            <p className="text-sm font-semibold text-white">
              {sortedTrends.reduce((sum, t) => sum + t.transactionCount, 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
