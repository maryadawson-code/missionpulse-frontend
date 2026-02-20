// filepath: app/(dashboard)/page.tsx
import { Suspense } from 'react'
import { getDashboardKPIs } from '@/lib/actions/dashboard'
import { KPICards } from '@/components/dashboard/KPICards'
import { KPIGridSkeleton } from '@/components/dashboard/KPICardSkeleton'
import { createClient } from '@/lib/supabase/server'

async function DashboardKPISection() {
  const { data: kpis, error } = await getDashboardKPIs()

  if (error || !kpis) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-6">
        <p className="text-red-400 text-sm">
          Failed to load dashboard metrics. {error}
        </p>
      </div>
    )
  }

  return <KPICards kpis={kpis} />
}

async function RecentActivity() {
  const supabase = await createClient()

  const { data: activities } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  const items = activities ?? []

  if (items.length === 0) {
    return (
      <p className="text-sm text-slate">No recent activity.</p>
    )
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-start gap-3 text-sm border-b border-border pb-3 last:border-0"
        >
          <div className="mt-1 h-2 w-2 rounded-full bg-cyan flex-shrink-0" />
          <div>
            <span className="text-white font-medium capitalize">
              {item.action?.replace(/_/g, ' ') ?? 'Action'}
            </span>
            <span className="text-slate ml-1">
              on {String(item.details ?? '')}
            </span>
            {item.timestamp && (
              <p className="text-xs text-slate-500 mt-0.5">
                {new Date(item.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">MissionPulse War Room</h1>
        <p className="text-sm text-slate mt-1">
          Pipeline overview and capture intelligence
        </p>
      </div>

      {/* KPI Cards */}
      <Suspense fallback={<KPIGridSkeleton />}>
        <DashboardKPISection />
      </Suspense>

      {/* Two-column lower section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Recent Activity
          </h2>
          <Suspense
            fallback={
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 rounded bg-slate-700" />
                ))}
              </div>
            }
          >
            <RecentActivity />
          </Suspense>
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Quick Actions
          </h2>
          <div className="space-y-2">
            <a
              href="/pipeline/new"
              className="flex items-center gap-2 rounded-md border border-border px-4 py-3 text-sm text-white hover:border-cyan/40 hover:bg-cyan/5 transition-colors"
            >
              <span className="text-cyan">+</span>
              New Opportunity
            </a>
            <a
              href="/pipeline"
              className="flex items-center gap-2 rounded-md border border-border px-4 py-3 text-sm text-white hover:border-cyan/40 hover:bg-cyan/5 transition-colors"
            >
              <span className="text-cyan">→</span>
              View Pipeline
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
