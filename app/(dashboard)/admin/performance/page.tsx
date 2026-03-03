// filepath: app/(dashboard)/admin/performance/page.tsx

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { getPerformanceReport } from '@/lib/monitoring/performance'

export const metadata: Metadata = {
  title: 'Performance Monitoring — MissionPulse Admin',
}

function LatencyBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const color =
    value > 2000
      ? 'bg-red-500'
      : value > 1000
        ? 'bg-amber-500'
        : 'bg-emerald-500'

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400">{value}ms</span>
    </div>
  )
}

export default async function PerformancePage() {
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

  const report = await getPerformanceReport()

  const statusColor = {
    healthy: 'text-emerald-400',
    degraded: 'text-amber-400',
    critical: 'text-red-400',
  }

  const maxP95 = Math.max(...report.endpoints.map((e) => e.p95), 1)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Performance Monitoring
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Endpoint latency tracking and system health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`h-2.5 w-2.5 rounded-full ${
              report.healthStatus === 'healthy'
                ? 'bg-emerald-400'
                : report.healthStatus === 'degraded'
                  ? 'bg-amber-400'
                  : 'bg-red-400'
            }`}
          />
          <span
            className={`text-sm font-medium capitalize ${statusColor[report.healthStatus]}`}
          >
            {report.healthStatus}
          </span>
        </div>
      </div>

      {/* Metrics Table */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50">
        <div className="border-b border-gray-800 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-400">
            Endpoint Latencies
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-2 text-xs font-semibold uppercase text-gray-500">
                  Endpoint
                </th>
                <th className="px-4 py-2 text-xs font-semibold uppercase text-gray-500">
                  p50
                </th>
                <th className="px-4 py-2 text-xs font-semibold uppercase text-gray-500">
                  p95
                </th>
                <th className="px-4 py-2 text-xs font-semibold uppercase text-gray-500">
                  p99
                </th>
                <th className="px-4 py-2 text-xs font-semibold uppercase text-gray-500">
                  Max
                </th>
                <th className="px-4 py-2 text-xs font-semibold uppercase text-gray-500">
                  Samples
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {report.endpoints.length > 0 ? (
                report.endpoints.map((ep) => (
                  <tr key={ep.endpoint} className="hover:bg-gray-800/30">
                    <td className="px-4 py-2 font-mono text-xs text-gray-200">
                      {ep.endpoint}
                    </td>
                    <td className="px-4 py-2">
                      <LatencyBar value={ep.p50} max={maxP95} />
                    </td>
                    <td className="px-4 py-2">
                      <LatencyBar value={ep.p95} max={maxP95} />
                    </td>
                    <td className="px-4 py-2">
                      <LatencyBar value={ep.p99} max={maxP95} />
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-400">
                      {ep.maxMs}ms
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-400">
                      {ep.sampleCount}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No performance data collected yet. Metrics accumulate as the
                    system processes requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4">
        <p className="text-xs text-gray-500">
          Latency thresholds: green &lt;1000ms, amber 1000-2000ms, red
          &gt;2000ms. System status degrades if any p95 exceeds 2000ms.
          Generated at {new Date(report.generatedAt).toLocaleString()}.
        </p>
      </div>
    </div>
  )
}
