// filepath: app/(dashboard)/page.tsx

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Dashboard — MissionPulse',
}
import { createClient } from '@/lib/supabase/server'
import { resolveRole } from '@/lib/rbac/config'
import { formatCurrencyCompact, formatPwin, phaseColor } from '@/lib/utils/formatters'
import type { Opportunity } from '@/lib/types'
import Link from 'next/link'
import { getRecentActivity } from '@/lib/actions/audit'
import { ActivityFeed } from '@/components/modules/ActivityFeed'
import { TeamWorkloadHeatmap } from '@/components/features/dashboard/TeamWorkloadHeatmap'
import { DashboardCustomizer } from '@/components/features/dashboard/DashboardCustomizer'

const WIDGET_DEFS = [
  { widget_type: 'kpi_cards', title: 'KPI Cards' },
  { widget_type: 'quick_start', title: 'Quick Start' },
  { widget_type: 'pipeline_phases', title: 'Pipeline by Phase' },
  { widget_type: 'upcoming_deadlines', title: 'Upcoming Deadlines' },
  { widget_type: 'team_workload', title: 'Team Workload' },
  { widget_type: 'recent_activity', title: 'Recent Activity' },
]

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
      href={`/pipeline/${opp.id}`}
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
  const supabase = createClient()

  // Author role redirect — authors land on their workflow page
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = resolveRole(profile?.role)
    if (role === 'author') {
      redirect('/proposals')
    }
  }

  // Fetch widget visibility preferences
  const { data: widgetRows } = await supabase
    .from('dashboard_widgets')
    .select('widget_type, is_visible')
    .eq('user_id', user?.id ?? '')

  const widgetVisibility = new Map<string, boolean>()
  for (const w of widgetRows ?? []) {
    widgetVisibility.set(w.widget_type, w.is_visible ?? true)
  }
  const isVisible = (type: string) => widgetVisibility.get(type) ?? true
  const widgetConfigs = WIDGET_DEFS.map((d) => ({
    ...d,
    is_visible: isVisible(d.widget_type),
  }))

  // Fetch all opportunities for the user's company (RLS enforces tenant isolation)
  const { data: opportunities, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('due_date', { ascending: true })

  const opps: Opportunity[] = opportunities ?? []

  // Fetch recent activity for feed
  let activityItems: Awaited<ReturnType<typeof getRecentActivity>>['data'] = []
  try {
    const result = await getRecentActivity(10)
    activityItems = result.data ?? []
  } catch {
    // Non-critical — continue without activity feed
  }

  // ─── Module Summary Counts ─────────────────────────────────
  const [
    { count: sectionsInReview },
    { count: complianceGaps },
    { count: clausesNeedReview },
    { count: docsInReview },
    { count: unreadNotifications },
    { count: complianceTotal },
    { count: complianceCompliant },
  ] = await Promise.all([
    supabase.from('proposal_sections').select('id', { count: 'exact', head: true }).in('status', ['pink_review', 'green_review', 'red_review']),
    supabase.from('compliance_requirements').select('id', { count: 'exact', head: true }).eq('status', 'Addressed'),
    supabase.from('contract_clauses').select('id', { count: 'exact', head: true }).eq('compliance_status', 'Review Needed'),
    supabase.from('documents').select('id', { count: 'exact', head: true }).eq('status', 'in_review'),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('is_read', false).eq('is_dismissed', false),
    supabase.from('opportunity_compliance').select('id', { count: 'exact', head: true }),
    supabase.from('opportunity_compliance').select('id', { count: 'exact', head: true }).eq('status', 'compliant'),
  ])

  const complianceHealthPct =
    (complianceTotal ?? 0) > 0
      ? Math.round(((complianceCompliant ?? 0) / (complianceTotal ?? 1)) * 100)
      : 0

  // Team workload data (for operations dashboard)
  const { data: assignments } = await supabase
    .from('opportunity_assignments')
    .select('assignee_name, opportunity_id')

  const { data: allSections } = await supabase
    .from('proposal_sections')
    .select('writer_id, status')

  const assignmentMap = new Map<string, Set<string>>()
  for (const a of assignments ?? []) {
    const existing = assignmentMap.get(a.assignee_name) ?? new Set()
    existing.add(a.opportunity_id)
    assignmentMap.set(a.assignee_name, existing)
  }

  const sectionsByWriter = new Map<string, { inProgress: number; total: number }>()
  for (const s of allSections ?? []) {
    const writer = s.writer_id ?? '__unassigned__'
    const existing = sectionsByWriter.get(writer) ?? { inProgress: 0, total: 0 }
    existing.total++
    if (s.status === 'in_progress' || s.status === 'draft') existing.inProgress++
    sectionsByWriter.set(writer, existing)
  }

  const teamMembers = Array.from(assignmentMap.entries())
    .map(([name, oppIds]) => {
      const writerData = sectionsByWriter.get(name) ?? { inProgress: 0, total: 0 }
      return {
        name,
        assignedOpps: oppIds.size,
        sectionsInProgress: writerData.inProgress,
        sectionsTotal: writerData.total,
      }
    })
    .sort((a, b) => b.assignedOpps - a.assignedOpps)
    .slice(0, 10)

  const moduleShortcuts = [
    { label: 'Swimlane', href: '/pipeline', count: sectionsInReview ?? 0, desc: 'sections in review', iconPath: 'M4 6h16M4 10h16M4 14h16M4 18h16', color: 'text-[#00E5FA]' },
    { label: 'Compliance', href: '/compliance', count: complianceGaps ?? 0, desc: 'items addressed', iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: 'text-emerald-400' },
    { label: 'Contracts', href: '/pipeline', count: clausesNeedReview ?? 0, desc: 'need review', iconPath: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3', color: 'text-amber-400' },
    { label: 'Documents', href: '/documents', count: docsInReview ?? 0, desc: 'in review', iconPath: 'M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z', color: 'text-blue-400' },
    { label: 'Notifications', href: '/notifications', count: unreadNotifications ?? 0, desc: 'unread', iconPath: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0', color: 'text-red-400' },
    { label: 'AI Assistant', href: '/ai-chat', count: null, desc: 'Ask questions', iconPath: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', color: 'text-purple-400' },
  ]

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
        <div className="flex items-center gap-3">
          <DashboardCustomizer widgets={widgetConfigs} />
          <Link
            href="/pipeline/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#00E5FA] px-4 py-2 text-sm font-medium text-[#00050F] transition-colors hover:bg-[#00E5FA]/90"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Opportunity
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      {isVisible('kpi_cards') && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
          label="Compliance Health"
          value={`${complianceHealthPct}%`}
          subtext={`${complianceCompliant ?? 0} of ${complianceTotal ?? 0} compliant`}
          iconPath="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
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
      </div>}

      {/* Quick Start Modules */}
      {isVisible('quick_start') && <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Quick Start
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {moduleShortcuts.map((mod) => (
            <Link
              key={mod.label}
              href={mod.href}
              className="group flex flex-col items-center gap-2 rounded-lg border border-gray-800 bg-gray-900/50 p-4 transition-colors hover:border-gray-700 hover:bg-gray-800/50"
            >
              <svg
                className={`h-6 w-6 ${mod.color} transition-transform group-hover:scale-110`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={mod.iconPath} />
              </svg>
              <span className="text-xs font-medium text-gray-200">{mod.label}</span>
              <span className="text-[10px] text-gray-500">
                {mod.count !== null ? `${mod.count} ${mod.desc}` : mod.desc}
              </span>
            </Link>
          ))}
        </div>
      </div>}

      {/* Two-column lower section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pipeline by Phase */}
        {isVisible('pipeline_phases') && (
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
        )}

        {/* Upcoming Deadlines */}
        {isVisible('upcoming_deadlines') && (
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
                href="/pipeline"
                className="mt-3 block text-center text-xs font-medium text-[#00E5FA] hover:underline"
              >
                View all {upcoming.length} deadlines →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Team Workload Heatmap */}
      {isVisible('team_workload') && teamMembers.length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Team Workload
          </h2>
          <div className="mt-4">
            <TeamWorkloadHeatmap members={teamMembers} />
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {isVisible('recent_activity') && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Recent Activity
          </h2>
          <div className="mt-4">
            <ActivityFeed items={activityItems} />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
          Failed to load dashboard data: {error.message}
        </div>
      )}
    </div>
  )
}
