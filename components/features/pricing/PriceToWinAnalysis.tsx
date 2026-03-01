'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Scenario {
  label: string
  pricePoint: number | null
  winProbability: number | null
  positioning: string
}

interface PriceToWinAnalysisProps {
  ceiling: number | null
  scenarios?: Scenario[]
}

function formatCurrency(value: number | null): string {
  if (value === null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function probabilityColor(pct: number | null): string {
  if (pct === null) return 'text-muted-foreground'
  if (pct >= 60) return 'text-emerald-400'
  if (pct >= 40) return 'text-amber-400'
  return 'text-red-400'
}

const DEFAULT_SCENARIOS: Scenario[] = [
  {
    label: 'Aggressive',
    pricePoint: null,
    winProbability: null,
    positioning: 'Below market — maximizes price score, risks margin compression',
  },
  {
    label: 'Moderate',
    pricePoint: null,
    winProbability: null,
    positioning: 'Market-competitive — balances competitiveness with profitability',
  },
  {
    label: 'Conservative',
    pricePoint: null,
    winProbability: null,
    positioning: 'Above market — preserves margins, relies on technical superiority',
  },
]

export function PriceToWinAnalysis({
  ceiling,
  scenarios,
}: PriceToWinAnalysisProps) {
  const displayScenarios = scenarios ?? DEFAULT_SCENARIOS.map((s, i) => ({
    ...s,
    pricePoint: ceiling
      ? Math.round(ceiling * (i === 0 ? 0.85 : i === 1 ? 0.92 : 0.98))
      : null,
    winProbability: i === 0 ? 70 : i === 1 ? 55 : 35,
  }))

  const [selected, setSelected] = useState<number>(1) // default to moderate

  return (
    <div className="space-y-4">
      {/* Ceiling Reference */}
      {ceiling !== null && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card/80 px-4 py-3">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Government Ceiling Estimate
          </span>
          <span className="font-mono text-lg font-bold text-foreground">
            {formatCurrency(ceiling)}
          </span>
        </div>
      )}

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {displayScenarios.map((scenario, idx) => {
          const isSelected = idx === selected
          const Icon =
            idx === 0
              ? TrendingDown
              : idx === 2
              ? TrendingUp
              : Minus
          return (
            <button
              key={scenario.label}
              onClick={() => setSelected(idx)}
              className={`rounded-lg border p-4 text-left transition-all ${
                isSelected
                  ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border bg-card/50 hover:border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    isSelected ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {scenario.label}
                </span>
                <Icon
                  className={`h-4 w-4 ${
                    idx === 0
                      ? 'text-emerald-400'
                      : idx === 2
                      ? 'text-red-400'
                      : 'text-amber-400'
                  }`}
                />
              </div>
              <p className="mt-2 font-mono text-xl font-bold text-foreground">
                {formatCurrency(scenario.pricePoint)}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Win Prob:</span>
                <span
                  className={`font-mono text-sm font-semibold ${probabilityColor(
                    scenario.winProbability
                  )}`}
                >
                  {scenario.winProbability !== null
                    ? `${scenario.winProbability}%`
                    : '—'}
                </span>
              </div>
              {ceiling && scenario.pricePoint && (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {Math.round((scenario.pricePoint / ceiling) * 100)}% of
                  ceiling
                </p>
              )}
            </button>
          )
        })}
      </div>

      {/* Detail for selected scenario */}
      <div className="rounded-lg border border-border bg-card/50 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {displayScenarios[selected]?.label} Positioning
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {displayScenarios[selected]?.positioning}
        </p>
      </div>

      {/* Comparison Table */}
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-card/80">
              <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Metric
              </th>
              {displayScenarios.map((s) => (
                <th
                  key={s.label}
                  className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            <tr className="hover:bg-muted/30">
              <td className="px-4 py-2.5 text-xs text-muted-foreground">
                Price Point
              </td>
              {displayScenarios.map((s) => (
                <td
                  key={s.label}
                  className="px-4 py-2.5 text-center font-mono text-sm text-foreground"
                >
                  {formatCurrency(s.pricePoint)}
                </td>
              ))}
            </tr>
            <tr className="hover:bg-muted/30">
              <td className="px-4 py-2.5 text-xs text-muted-foreground">
                Win Probability
              </td>
              {displayScenarios.map((s) => (
                <td
                  key={s.label}
                  className={`px-4 py-2.5 text-center font-mono text-sm font-semibold ${probabilityColor(
                    s.winProbability
                  )}`}
                >
                  {s.winProbability !== null ? `${s.winProbability}%` : '—'}
                </td>
              ))}
            </tr>
            <tr className="hover:bg-muted/30">
              <td className="px-4 py-2.5 text-xs text-muted-foreground">
                % of Ceiling
              </td>
              {displayScenarios.map((s) => (
                <td
                  key={s.label}
                  className="px-4 py-2.5 text-center text-xs text-muted-foreground"
                >
                  {ceiling && s.pricePoint
                    ? `${Math.round((s.pricePoint / ceiling) * 100)}%`
                    : '—'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
