import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { runBenchmark, type BenchmarkResult } from '@/lib/monitoring/benchmarks'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Performance Benchmarks — MissionPulse Admin',
}

// ─── Helper Components ──────────────────────────────────────

function StatusBadge({ status }: { status: 'pass' | 'warn' | 'fail' }) {
  const styles = {
    pass: 'bg-emerald-900/50 text-emerald-400 border-emerald-800',
    warn: 'bg-amber-900/50 text-amber-400 border-amber-800',
    fail: 'bg-red-900/50 text-red-400 border-red-800',
  }
  const labels = { pass: 'PASS', warn: 'WARN', fail: 'FAIL' }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles[status]}`}
    >
      {labels[status]}
    </span>
  )
}

function BenchmarkRow({ result }: { result: BenchmarkResult }) {
  return (
    <tr className="hover:bg-gray-800/30">
      <td className="px-4 py-3 text-sm font-medium text-gray-200">
        {result.name}
      </td>
      <td className="px-4 py-3 text-right text-sm tabular-nums text-white">
        {result.unit === 'USD' ? `$${result.value}` : result.value.toLocaleString()}
        <span className="ml-1 text-xs text-gray-500">
          {result.unit !== 'USD' ? result.unit : ''}
        </span>
      </td>
      <td className="px-4 py-3 text-right text-sm text-gray-400 tabular-nums">
        {result.targetUnit === 'USD'
          ? `≤ $${result.target}`
          : result.unit === '%'
            ? `≥ ${result.target}${result.targetUnit}`
            : result.unit === 'score'
              ? `= ${result.target}`
              : `≤ ${result.target.toLocaleString()} ${result.targetUnit}`}
      </td>
      <td className="px-4 py-3 text-center">
        <StatusBadge status={result.status} />
      </td>
    </tr>
  )
}

// ─── Page ───────────────────────────────────────────────────

export default async function AdminBenchmarksPage() {
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
  if (!hasPermission(role, 'admin', 'canView')) redirect('/dashboard')

  const report = await runBenchmark()

  const overallColor =
    report.overallStatus === 'pass'
      ? 'text-emerald-400'
      : report.overallStatus === 'warn'
        ? 'text-amber-400'
        : 'text-red-400'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Performance Benchmarks
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            v1.1 targets from Product Spec — measured against live data
          </p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${overallColor}`}>
            {report.overallStatus.toUpperCase()}
          </p>
          <p className="text-xs text-gray-500">{report.summary}</p>
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50">
        <div className="border-b border-gray-800 px-5 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-400">
            Benchmark Results
          </h2>
          <span className="text-xs text-gray-600">
            {new Date(report.timestamp).toLocaleString()}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                  Metric
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                  Current
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                  Target
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {report.results.map((result) => (
                <BenchmarkRow key={result.name} result={result} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Spec Targets Reference */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">
          Product Spec Targets
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-gray-800 p-3">
            <p className="text-xs text-gray-500">AI Response Time</p>
            <p className="text-sm font-bold text-white">≤ 3,000 ms</p>
          </div>
          <div className="rounded-lg border border-gray-800 p-3">
            <p className="text-xs text-gray-500">AI Cost / Proposal</p>
            <p className="text-sm font-bold text-white">$50 – $185</p>
          </div>
          <div className="rounded-lg border border-gray-800 p-3">
            <p className="text-xs text-gray-500">Cache Hit Rate</p>
            <p className="text-sm font-bold text-white">≥ 50%</p>
          </div>
          <div className="rounded-lg border border-gray-800 p-3">
            <p className="text-xs text-gray-500">Time to First Value</p>
            <p className="text-sm font-bold text-white">&lt; 15 min</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <Link
          href="/admin/analytics"
          className="rounded-lg border border-gray-700 px-4 py-2 text-xs text-gray-400 hover:border-gray-500 hover:text-white transition-colors"
        >
          ← System Analytics
        </Link>
        <Link
          href="/admin/performance"
          className="rounded-lg border border-gray-700 px-4 py-2 text-xs text-gray-400 hover:border-gray-500 hover:text-white transition-colors"
        >
          Performance Monitor →
        </Link>
      </div>
    </div>
  )
}
