import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { Skeleton } from '@/components/ui/skeleton'

const AnalyticsDashboard = dynamic(
  () => import('@/components/features/analytics/AnalyticsDashboard').then((m) => m.AnalyticsDashboard),
  {
    loading: () => (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    ),
  }
)

export const metadata: Metadata = {
  title: 'Analytics — MissionPulse',
}

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'analytics', 'shouldRender')) {
    return null
  }

  // Fetch opportunities for live metrics
  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('id, title, ceiling, pwin, phase, status, owner_id')

  const opps = opportunities ?? []
  const activeOpps = opps.filter((o) => o.status === 'Active')

  // KPI calculations
  const pipelineValue = activeOpps.reduce(
    (sum, o) => sum + (o.ceiling ? Number(o.ceiling) : 0),
    0
  )
  const avgPwin =
    activeOpps.length > 0
      ? Math.round(
          activeOpps.reduce((sum, o) => sum + (o.pwin ?? 50), 0) /
            activeOpps.length
        )
      : 0
  const wonOpps = opps.filter((o) => o.status === 'Won')
  const lostOpps = opps.filter((o) => o.status === 'Lost')
  const winRate =
    wonOpps.length + lostOpps.length > 0
      ? Math.round(
          (wonOpps.length / (wonOpps.length + lostOpps.length)) * 100
        )
      : 0

  // Pipeline by phase (bar chart data)
  const phaseMap = new Map<string, { value: number; count: number }>()
  for (const opp of activeOpps) {
    const phase = opp.phase ?? 'Gate 1'
    const existing = phaseMap.get(phase) ?? { value: 0, count: 0 }
    phaseMap.set(phase, {
      value: existing.value + (opp.ceiling ? Number(opp.ceiling) : 0),
      count: existing.count + 1,
    })
  }
  const pipelineByPhase = Array.from(phaseMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([phase, data]) => ({ phase, ...data }))

  // Status breakdown (donut chart)
  const statusMap = new Map<string, number>()
  for (const opp of opps) {
    const status = opp.status ?? 'Unknown'
    statusMap.set(status, (statusMap.get(status) ?? 0) + 1)
  }
  const statusBreakdown = Array.from(statusMap.entries()).map(
    ([name, value]) => ({ name, value })
  )

  // Team workload — count opportunities per owner
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')

  const profileMap = new Map<string, string>()
  for (const p of profiles ?? []) {
    profileMap.set(p.id, p.full_name ?? p.id.slice(0, 8))
  }

  const ownerMap = new Map<string, number>()
  for (const opp of activeOpps) {
    if (opp.owner_id) {
      const name = profileMap.get(opp.owner_id) ?? 'Unknown'
      ownerMap.set(name, (ownerMap.get(name) ?? 0) + 1)
    }
  }
  const teamWorkload = Array.from(ownerMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Win rate trend from snapshots
  const { data: snapshots } = await supabase
    .from('analytics_snapshots')
    .select('snapshot_date, win_count, loss_count')
    .order('snapshot_date', { ascending: true })
    .limit(20)

  const winRateTrend = (snapshots ?? []).map((snap) => {
    const wins = snap.win_count ?? 0
    const losses = snap.loss_count ?? 0
    const total = wins + losses
    return {
      date: new Date(snap.snapshot_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
      wins,
      losses,
    }
  })

  // Compliance health by opportunity
  const { data: complianceData } = await supabase
    .from('compliance_requirements')
    .select('opportunity_id, status')

  const complianceMap = new Map<
    string,
    { total: number; addressed: number }
  >()
  for (const req of complianceData ?? []) {
    if (!req.opportunity_id) continue
    const existing = complianceMap.get(req.opportunity_id) ?? {
      total: 0,
      addressed: 0,
    }
    existing.total++
    if (
      req.status === 'Addressed' ||
      req.status === 'Verified' ||
      req.status === 'Compliant'
    ) {
      existing.addressed++
    }
    complianceMap.set(req.opportunity_id, existing)
  }

  // Map opportunity IDs to titles
  const oppTitleMap = new Map<string, string>()
  for (const opp of opps) {
    oppTitleMap.set(opp.id, opp.title ?? opp.id.slice(0, 8))
  }

  const complianceHealth = Array.from(complianceMap.entries())
    .map(([oppId, data]) => ({
      opportunity: oppTitleMap.get(oppId) ?? oppId.slice(0, 8),
      score:
        data.total > 0 ? Math.round((data.addressed / data.total) * 100) : 0,
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 10)

  // Team performance — per-owner stats
  const ownerWins = new Map<string, { wins: number; losses: number }>()
  for (const opp of opps) {
    if (!opp.owner_id) continue
    const name = profileMap.get(opp.owner_id) ?? 'Unknown'
    const existing = ownerWins.get(name) ?? { wins: 0, losses: 0 }
    if (opp.status === 'Won') existing.wins++
    if (opp.status === 'Lost') existing.losses++
    ownerWins.set(name, existing)
  }

  const teamPerformance = Array.from(ownerMap.entries()).map(([name, count]) => {
    const wl = ownerWins.get(name) ?? { wins: 0, losses: 0 }
    const total = wl.wins + wl.losses
    return {
      name,
      activeOpps: count,
      avgCycleTimeDays: null as number | null,
      winRate: total > 0 ? Math.round((wl.wins / total) * 100) : null,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pipeline metrics, win rate trends, and performance dashboards across
            your portfolio.
          </p>
        </div>
        <Link
          href="/analytics/ai-usage"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 hover:border-cyan/40 hover:bg-elevated transition-colors group shrink-0"
        >
          <span className="text-base">🤖</span>
          <div>
            <p className="text-sm font-medium text-foreground group-hover:text-cyan transition-colors">
              AI Usage Analytics
            </p>
            <p className="text-[11px] text-slate">Token consumption &amp; cost breakdown</p>
          </div>
        </Link>
      </div>

      <AnalyticsDashboard
        kpis={{
          activeCount: activeOpps.length,
          pipelineValue,
          avgPwin,
          winRate,
          wonCount: wonOpps.length,
          lostCount: lostOpps.length,
        }}
        pipelineByPhase={pipelineByPhase}
        winRateTrend={winRateTrend}
        statusBreakdown={statusBreakdown}
        teamWorkload={teamWorkload}
        complianceHealth={complianceHealth}
        teamPerformance={teamPerformance}
        avgCycleTime={null}
      />
    </div>
  )
}
