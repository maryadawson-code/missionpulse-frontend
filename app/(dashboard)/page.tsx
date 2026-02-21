// filepath: app/(dashboard)/page.tsx

import { createClient } from '@/lib/supabase/server'
import { formatCurrencyCompact, formatPwin, phaseColor } from '@/lib/utils/formatters'
import type { Opportunity } from '@/lib/types'
import Link from 'next/link'
import { getRecentActivity } from '@/lib/actions/audit'
import { ActivityFeed } from '@/components/modules/ActivityFeed'

// ─── KPI Card Component ─────────────────────────────────────────
function KPICard({
  label,
  value,
  subtext,
  iconPath,
}: {
  label: string
  value: string
  subtext?: string
  iconPath: string
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          {subtext && (
            <p className="mt-1 text-xs text-gray-400">{subtext}</p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00E5FA]/10">
          <svg
            className="h-5 w-5 text-[#00E5FA]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
          </svg>
        </div>
      </div>
    </div>
  )
}

// ─── Phase Summary Row ──────────────────────────────────────────
function PhaseSummary({ phase, count, total }: { phase: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${phaseColor(phase)}`}>
          {phase || 'Unassigned'}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-800">
          <div
            className="h-full rounded-full bg-[#00E5FA]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="w-8 text-right text-xs text-gray-400">{count}</span>
      </div>
    </div>
  )
}

// ─── Upcoming Deadline Row ──────────────────────────────────────
function DeadlineRow({ opp }: { opp: Opportunity }) {
  const dueDate = opp.due_date ?? opp.submission_date
  const daysUntil = dueDate
    ? Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <Link
      href={`/dashboard/pipeline/${opp.id}`}
      className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-800/50"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-200">{opp.title}</p>
        <p className="text-xs text-gray-500">{opp.agency ?? 'No agency'}</p>
      </div>
      <div className="ml-4 flex-shrink-0 text-right">
        {daysUntil !== null && (
          <span
            className={`text-xs font-medium ${
              daysUntil <= 7
                ? 'text-red-400'
                : daysUntil <= 30
                  ? 'text-amber-400'
                  : 'text-gray-400'
            }`}
          >
            {daysUntil <= 0 ? 'Overdue' : `${daysUntil}d`}
          </span>
        )}
      </div>
    </Link>
  )
}

// ─── Dashboard Page ─────────────────────────────────────────────
export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch all opportunities for the user's company (RLS enforces tenant isolation)
  const { data: opportunities, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('due_date', { ascending: true })

  const opps: Opportunity[] = opportunities ?? []

  // Fetch recent activity for feed
  const { data: activityItems } = await getRecentActivity(10)

  // ─── Compute KPIs ───────────────────────────────────────────
  const totalOpps = opps.length
  const activeOpps = opps.filter((o) => o.status === 'active' || o.status === 'open' || !o.status)
  const totalCeiling = opps.reduce((sum, o) => sum + (o.ceiling ?? 0), 0)
  const pwins = opps.filter((o) => o.pwin != null).map((o) => o.pwin as number)
  const avgPwin = pwins.length > 0 ? Math.round(pwins.reduce((a, b) => a + b, 0) / pwins.length) : 0

  // Upcoming deadlines (next 90 days)
  const now = Date.now()
  const ninetyDays = 90 * 24 * 60 * 60 * 1000
  const upcoming = opps.filter((o) => {
    const d = o.due_date ?? o.submission_date
    if (!d) return false
    const t = new Date(d).getTime()
    return t >= now && t <= now + ninetyDays
  })

  // Group by phase
  const phaseMap = new Map<string, number>()
  for (const o of opps) {
    const key = o.phase ?? 'Unassigned'
    phaseMap.set(key, (phaseMap.get(key) ?? 0) + 1)
  }
  const phases = Array.from(phaseMap.entries()).sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Pipeline overview and key metrics</p>
        </div>
        <Link
          href="/dashboard/pipeline/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[#00E5FA] px-4 py-2 text-sm font-medium text-[#00050F] transition-colors hover:bg-[#00E5FA]/90"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Opportunity
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Total Opportunities"
          value={totalOpps.toString()}
          subtext={`${activeOpps.length} active`}
          iconPath="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
        <KPICard
          label="Pipeline Value"
          value={formatCurrencyCompact(totalCeiling)}
          subtext="Total ceiling across all opps"
          iconPath="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
        <KPICard
          label="Avg Win Probability"
          value={formatPwin(avgPwin)}
          subtext={`Based on ${pwins.length} scored opps`}
          iconPath="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
        <KPICard
          label="Upcoming Deadlines"
          value={upcoming.length.toString()}
          subtext="Within 90 days"
          iconPath="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </div>

      {/* Two-column lower section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pipeline by Phase */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Pipeline by Phase
          </h2>
          <div className="mt-4 divide-y divide-gray-800">
            {phases.length > 0 ? (
              phases.map(([phase, count]) => (
                <PhaseSummary key={phase} phase={phase} count={count} total={totalOpps} />
              ))
            ) : (
              <p className="py-4 text-center text-sm text-gray-500">
                No opportunities in pipeline
              </p>
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Upcoming Deadlines
          </h2>
          <div className="mt-4 space-y-1">
            {upcoming.length > 0 ? (
              upcoming.slice(0, 8).map((opp) => (
                <DeadlineRow key={opp.id} opp={opp} />
              ))
            ) : (
              <p className="py-4 text-center text-sm text-gray-500">
                No deadlines in the next 90 days
              </p>
            )}
          </div>
          {upcoming.length > 8 && (
            <Link
              href="/dashboard/pipeline"
              className="mt-3 block text-center text-xs font-medium text-[#00E5FA] hover:underline"
            >
              View all {upcoming.length} deadlines →
            </Link>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Recent Activity
        </h2>
        <div className="mt-4">
          <ActivityFeed items={activityItems} />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
          Failed to load dashboard data: {error.message}
        </div>
      )}
    </div>
  )
}
