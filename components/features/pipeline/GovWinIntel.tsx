'use client'

import { Shield, Building2, TrendingUp, Users, Calendar, DollarSign } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────

interface Competitor {
  name: string
  isIncumbent: boolean
  winProbability: number | null
  source: string
}

interface AgencyIntel {
  agencyName: string
  budgetForecast: number | null
  fiscalYear: string | null
  acquisitionTimeline: string | null
  incumbentContractor: string | null
  recompeteDate: string | null
}

interface GovWinIntelProps {
  govwinId: string | null
  competitors: Competitor[]
  agencyIntel: AgencyIntel | null
  lastUpdated: string | null
}

// ─── Component ───────────────────────────────────────────────

export function GovWinIntel({
  govwinId,
  competitors,
  agencyIntel,
  lastUpdated,
}: GovWinIntelProps) {
  if (!govwinId) {
    return (
      <div className="rounded-xl border border-border bg-card/50 p-6 text-center">
        <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-xs text-muted-foreground">
          No GovWin IQ data available. Link this opportunity to a GovWin ID or
          import from the GovWin integration page.
        </p>
      </div>
    )
  }

  function formatCurrency(value: number | null): string {
    if (value === null) return '—'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded flex items-center justify-center text-[10px] font-bold text-foreground bg-gradient-to-br from-blue-600 to-purple-600">
            GW
          </div>
          <h3 className="text-sm font-semibold text-foreground">GovWin IQ Intelligence</h3>
        </div>
        {lastUpdated && (
          <span className="text-[10px] text-muted-foreground">
            Updated:{' '}
            {new Date(lastUpdated).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}
      </div>

      {/* Competitor Tracking */}
      {competitors.length > 0 && (
        <div className="rounded-xl border border-border bg-card/50">
          <div className="border-b border-border px-4 py-2.5 flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <h4 className="text-xs font-semibold text-foreground">Known Competitors</h4>
            <span className="ml-auto text-[10px] text-muted-foreground">{competitors.length} identified</span>
          </div>
          <div className="divide-y divide-border/50">
            {competitors.map((comp, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-foreground">{comp.name}</span>
                  {comp.isIncumbent && (
                    <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600 dark:text-amber-400">
                      INCUMBENT
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {comp.winProbability !== null && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        {comp.winProbability}% est.
                      </span>
                    </div>
                  )}
                  <span className="text-[10px] text-muted-foreground">{comp.source}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agency Intel */}
      {agencyIntel && (
        <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            <h4 className="text-xs font-semibold text-foreground">
              Agency Intelligence — {agencyIntel.agencyName}
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {agencyIntel.budgetForecast !== null && (
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1">
                  <DollarSign className="h-2.5 w-2.5" />
                  Budget Forecast
                </p>
                <p className="text-xs font-medium text-foreground">
                  {formatCurrency(agencyIntel.budgetForecast)}
                </p>
                {agencyIntel.fiscalYear && (
                  <p className="text-[10px] text-muted-foreground">FY{agencyIntel.fiscalYear}</p>
                )}
              </div>
            )}

            {agencyIntel.acquisitionTimeline && (
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1">
                  <Calendar className="h-2.5 w-2.5" />
                  Acquisition Timeline
                </p>
                <p className="text-xs font-medium text-foreground">
                  {agencyIntel.acquisitionTimeline}
                </p>
              </div>
            )}

            {agencyIntel.incumbentContractor && (
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1">
                  <Users className="h-2.5 w-2.5" />
                  Incumbent
                </p>
                <p className="text-xs font-medium text-foreground">
                  {agencyIntel.incumbentContractor}
                </p>
                {agencyIntel.recompeteDate && (
                  <p className="text-[10px] text-muted-foreground">
                    Recompete: {new Date(agencyIntel.recompeteDate).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {competitors.length === 0 && !agencyIntel && (
        <div className="rounded-xl border border-border bg-card/50 p-6 text-center">
          <p className="text-xs text-muted-foreground">
            GovWin ID linked but no intelligence data synced yet.
            Run a sync from the GovWin integration page.
          </p>
        </div>
      )}
    </div>
  )
}
