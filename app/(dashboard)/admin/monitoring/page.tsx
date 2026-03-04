import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { Suspense } from 'react'

// ─── Data Fetchers ─────────────────────────────────────────

async function getHealthData() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://missionpulse.ai'
  try {
    const resp = await fetch(`${siteUrl}/api/health`, {
      next: { revalidate: 60 },
    })
    if (!resp.ok) return null
    return resp.json()
  } catch {
    return null
  }
}

async function getMonitoringEvents(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from('monitoring_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  return data ?? []
}

async function getHealthSnapshots(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from('health_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: false })
    .limit(7)
  return data ?? []
}

// ─── Components ────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    healthy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    degraded: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    unhealthy: 'bg-red-500/20 text-red-400 border-red-500/30',
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    unknown: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${colors[status] ?? colors.unknown}`}>
      {status}
    </span>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    info: 'bg-sky-500/20 text-sky-400',
    warning: 'bg-amber-500/20 text-amber-400',
    critical: 'bg-red-500/20 text-red-400',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[severity] ?? colors.info}`}>
      {severity}
    </span>
  )
}

async function HealthOverview() {
  const health = await getHealthData() as Record<string, unknown> | null
  if (!health) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6">
        <h2 className="text-lg font-semibold text-red-400">Health endpoint unreachable</h2>
        <p className="mt-1 text-sm text-red-400/80">Could not connect to /api/health</p>
      </div>
    )
  }

  const checks = (health.checks ?? {}) as Record<string, { status?: string; latency_ms?: number }>
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-4 w-4 rounded-full ${health.status === 'healthy' ? 'bg-emerald-500' : health.status === 'degraded' ? 'bg-amber-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
          <h2 className="text-xl font-bold text-foreground">System Status</h2>
        </div>
        <StatusBadge status={health.status as string} />
      </div>
      <p className="text-sm text-muted-foreground">
        Version {health.version as string} &middot; Last checked {new Date(health.timestamp as string).toLocaleString()}
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Object.entries(checks).map(([name, check]) => (
          <div key={name} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground capitalize">{name.replace(/_/g, ' ')}</span>
              <div className={`h-2.5 w-2.5 rounded-full ${check.status === 'healthy' ? 'bg-emerald-500' : check.status === 'degraded' ? 'bg-amber-500' : 'bg-red-500'}`} />
            </div>
            {check.latency_ms !== undefined && (
              <p className="mt-1 text-xs text-muted-foreground">{check.latency_ms}ms</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

async function RecentEvents({ supabase }: { supabase: Awaited<ReturnType<typeof createClient>> }) {
  const events = await getMonitoringEvents(supabase)
  const unresolvedCount = events.filter((e) => !e.resolved).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Recent Events</h2>
        {unresolvedCount > 0 && (
          <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-medium text-red-400">
            {unresolvedCount} active
          </span>
        )}
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No monitoring events recorded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Time</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Severity</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Title</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Source</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Resolved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.map((event) => (
                <tr key={event.id} className={!event.resolved ? 'bg-red-500/5' : ''}>
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {event.created_at ? new Date(event.created_at).toLocaleString() : '-'}
                  </td>
                  <td className="px-3 py-2"><SeverityBadge severity={event.severity} /></td>
                  <td className="px-3 py-2 text-foreground">{event.event_type}</td>
                  <td className="max-w-[300px] truncate px-3 py-2 text-foreground">{event.title}</td>
                  <td className="px-3 py-2 text-muted-foreground">{event.source}</td>
                  <td className="px-3 py-2">{event.resolved ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

async function HealthTrend({ supabase }: { supabase: Awaited<ReturnType<typeof createClient>> }) {
  const snapshots = await getHealthSnapshots(supabase)

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">7-Day Health Trend</h2>
      {snapshots.length === 0 ? (
        <p className="text-sm text-muted-foreground">No health snapshots recorded yet. Snapshots are created by the Sentinel health check (every 6 hours).</p>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {snapshots.reverse().map((snap) => (
            <div key={snap.id} className="rounded-lg border border-border bg-card p-3 text-center">
              <p className="text-xs text-muted-foreground">{snap.snapshot_date}</p>
              <div className={`mx-auto mt-2 h-3 w-3 rounded-full ${snap.health_status === 'healthy' ? 'bg-emerald-500' : snap.health_status === 'degraded' ? 'bg-amber-500' : 'bg-red-500'}`} />
              {snap.response_time_ms && (
                <p className="mt-1 text-xs text-muted-foreground">{snap.response_time_ms}ms</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────

export default async function MonitoringPage() {
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
  if (!hasPermission(role, 'admin', 'canView')) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sentinel Monitoring</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Autonomous health monitoring and alerting for MissionPulse.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="https://sentry.io"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition"
          >
            Sentry
          </a>
          <a
            href="https://app.netlify.com/projects/missionpulse"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition"
          >
            Netlify
          </a>
        </div>
      </div>

      <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-muted" />}>
        <HealthOverview />
      </Suspense>

      <Suspense fallback={<div className="h-32 animate-pulse rounded-lg bg-muted" />}>
        <HealthTrend supabase={supabase} />
      </Suspense>

      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-muted" />}>
        <RecentEvents supabase={supabase} />
      </Suspense>
    </div>
  )
}
