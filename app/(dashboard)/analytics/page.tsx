// filepath: app/(dashboard)/analytics/page.tsx

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'analytics', 'shouldRender')) {
    redirect('/')
  }

  // Fetch live metrics from opportunities
  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('id, ceiling, pwin, phase, status, due_date')

  const opps = opportunities ?? []
  const activeOpps = opps.filter((o) => o.status === 'Active')
  const pipelineValue = activeOpps.reduce((sum, o) => sum + (o.ceiling ? Number(o.ceiling) : 0), 0)
  const avgPwin = activeOpps.length > 0
    ? Math.round(activeOpps.reduce((sum, o) => sum + (o.pwin ?? 50), 0) / activeOpps.length)
    : 0
  const wonOpps = opps.filter((o) => o.status === 'Won')
  const lostOpps = opps.filter((o) => o.status === 'Lost')
  const winRate = wonOpps.length + lostOpps.length > 0
    ? Math.round((wonOpps.length / (wonOpps.length + lostOpps.length)) * 100)
    : 0

  // Phase breakdown
  const phaseMap = new Map<string, number>()
  for (const opp of activeOpps) {
    const phase = opp.phase ?? 'Gate 1'
    phaseMap.set(phase, (phaseMap.get(phase) ?? 0) + 1)
  }
  const phaseBreakdown = Array.from(phaseMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))

  // Fetch analytics snapshots for trend data
  const { data: snapshots, error: snapError } = await supabase
    .from('analytics_snapshots')
    .select('id, snapshot_date, pipeline_value, active_opportunities, avg_pwin, win_count, loss_count, avg_deal_size, team_utilization, compliance_score')
    .order('snapshot_date', { ascending: false })
    .limit(20)

  const snaps = snapshots ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pipeline metrics, win rate trends, and performance dashboards across your portfolio.
        </p>
      </div>

      {/* Live KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Active Pipeline</p>
          <p className="mt-2 text-2xl font-bold text-white">{activeOpps.length}</p>
          <p className="mt-1 text-xs text-gray-500">opportunities</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Pipeline Value</p>
          <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(pipelineValue)}</p>
          <p className="mt-1 text-xs text-gray-500">total ceiling</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Avg pWin</p>
          <p className="mt-2 text-2xl font-bold text-[#00E5FA]">{avgPwin}%</p>
          <p className="mt-1 text-xs text-gray-500">across active opps</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Win Rate</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">{winRate}%</p>
          <p className="mt-1 text-xs text-gray-500">{wonOpps.length}W / {lostOpps.length}L</p>
        </div>
      </div>

      {/* Phase Breakdown */}
      {phaseBreakdown.length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Pipeline by Phase</h2>
          <div className="space-y-3">
            {phaseBreakdown.map(([phase, count]) => (
              <div key={phase} className="flex items-center gap-3">
                <span className="w-28 text-xs text-gray-400 truncate">{phase}</span>
                <div className="flex-1 h-2 rounded-full bg-gray-800">
                  <div
                    className="h-2 rounded-full bg-[#00E5FA]"
                    style={{ width: `${Math.max(4, (count / activeOpps.length) * 100)}%` }}
                  />
                </div>
                <span className="w-8 text-right text-xs font-mono text-gray-400">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Snapshot History */}
      {snapError && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
          Failed to load snapshots: {snapError.message}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">Snapshot History</h2>
          <p className="text-xs text-gray-500 mt-1">Periodic pipeline performance snapshots</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Pipeline Value</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Active Opps</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Avg pWin</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">W/L</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Avg Deal</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {snaps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                    No snapshots yet. Snapshots are generated periodically to track pipeline trends.
                  </td>
                </tr>
              ) : (
                snaps.map((snap) => (
                  <tr key={snap.id} className="transition-colors hover:bg-gray-800/30">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                      {formatDate(snap.snapshot_date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-gray-200">
                      {formatCurrency(snap.pipeline_value)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-300">
                      {snap.active_opportunities ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-300">
                      {snap.avg_pwin != null ? `${snap.avg_pwin}%` : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                      {snap.win_count ?? 0}W / {snap.loss_count ?? 0}L
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-gray-300">
                      {formatCurrency(snap.avg_deal_size)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-300">
                      {snap.team_utilization != null ? `${snap.team_utilization}%` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-600">
        Live metrics computed from {opps.length} total opportunities. Snapshots updated periodically.
      </p>
    </div>
  )
}
