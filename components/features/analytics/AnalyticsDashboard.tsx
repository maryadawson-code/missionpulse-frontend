'use client'

import { PipelineValueChart } from './PipelineValueChart'
import { WinRateChart } from './WinRateChart'
import { StatusDonutChart } from './StatusDonutChart'
import { TeamWorkload } from './TeamWorkload'
import { ComplianceHeatmap } from './ComplianceHeatmap'

interface AnalyticsDashboardProps {
  kpis: {
    activeCount: number
    pipelineValue: number
    avgPwin: number
    winRate: number
    wonCount: number
    lostCount: number
  }
  pipelineByPhase: { phase: string; value: number; count: number }[]
  winRateTrend: { date: string; winRate: number; wins: number; losses: number }[]
  statusBreakdown: { name: string; value: number }[]
  teamWorkload: { name: string; count: number }[]
  complianceHealth: { opportunity: string; score: number }[]
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function AnalyticsDashboard({
  kpis,
  pipelineByPhase,
  winRateTrend,
  statusBreakdown,
  teamWorkload,
  complianceHealth,
}: AnalyticsDashboardProps) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Active Pipeline
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {kpis.activeCount}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">opportunities</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Pipeline Value
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {formatCurrency(kpis.pipelineValue)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">total ceiling</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Avg pWin
          </p>
          <p className="mt-2 text-2xl font-bold text-primary">
            {kpis.avgPwin}%
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            across active opps
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Win Rate
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {kpis.winRate}%
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {kpis.wonCount}W / {kpis.lostCount}L
          </p>
        </div>
      </div>

      {/* Row 1: Pipeline by Phase + Win Rate */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Pipeline Value by Phase
          </h2>
          <PipelineValueChart data={pipelineByPhase} />
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Win Rate Over Time
          </h2>
          <WinRateChart data={winRateTrend} />
        </div>
      </div>

      {/* Row 2: Status Donut + Team Workload */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Active Pursuits by Status
          </h2>
          <StatusDonutChart data={statusBreakdown} />
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Team Workload
          </h2>
          <TeamWorkload data={teamWorkload} />
        </div>
      </div>

      {/* Row 3: Compliance Heatmap */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          Compliance Health by Opportunity
        </h2>
        <ComplianceHeatmap data={complianceHealth} />
      </div>
    </div>
  )
}
