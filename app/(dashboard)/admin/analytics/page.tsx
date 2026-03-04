import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { getPerformanceReport, getHistoricalMetrics } from '@/lib/monitoring/performance'
import { getCacheMetrics } from '@/lib/cache/semantic-cache'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'System Analytics — MissionPulse Admin',
}

// ─── Helper Components ──────────────────────────────────────

function MetricCard({
  label,
  value,
  subtext,
  color = 'text-white',
}: {
  label: string
  value: string
  subtext?: string
  color?: string
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
      {subtext && <p className="mt-1 text-xs text-gray-400">{subtext}</p>}
    </div>
  )
}

function CacheGauge({ hitRate }: { hitRate: number }) {
  const pct = Math.round(hitRate * 100)
  const color = pct > 70 ? '#10B981' : pct > 40 ? '#F59E0B' : '#EF4444'

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-14 w-14 flex-shrink-0">
        <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#1E293B"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${pct}, 100`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white">{pct}%</span>
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-white">Cache Hit Rate</p>
        <p className="text-[10px] text-gray-500">
          {pct > 70 ? 'Excellent' : pct > 40 ? 'Moderate' : 'Low'} — saves AI
          API costs
        </p>
      </div>
    </div>
  )
}

// ─── Agent type definitions ─────────────────────────────────

interface AgentCostRow {
  agent: string
  queries: number
  inputTokens: number
  outputTokens: number
  totalCost: number
}

// ─── Page ───────────────────────────────────────────────────

export default async function AdminAnalyticsPage() {
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

  // Fetch data in parallel
  const [perfReport, historicalMetrics, cacheMetrics] = await Promise.all([
    getPerformanceReport(),
    getHistoricalMetrics(7),
    getCacheMetrics(),
  ])

  // Fetch AI usage data (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: tokenEntries } = await supabase
    .from('token_usage')
    .select(
      'agent_id, input_tokens, output_tokens, estimated_cost_usd, created_at'
    )
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(5000)

  // Aggregate by agent
  const agentMap = new Map<string, AgentCostRow>()
  for (const entry of tokenEntries ?? []) {
    const agent = (entry.agent_id as string) ?? 'unknown'
    const existing = agentMap.get(agent) ?? {
      agent,
      queries: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalCost: 0,
    }
    existing.queries += 1
    existing.inputTokens += (entry.input_tokens as number) ?? 0
    existing.outputTokens += (entry.output_tokens as number) ?? 0
    existing.totalCost += (entry.estimated_cost_usd as number) ?? 0
    agentMap.set(agent, existing)
  }
  const agentBreakdown = Array.from(agentMap.values()).sort(
    (a, b) => b.totalCost - a.totalCost
  )

  const totalQueries = agentBreakdown.reduce((s, a) => s + a.queries, 0)
  const totalCost = agentBreakdown.reduce((s, a) => s + a.totalCost, 0)
  const totalTokens = agentBreakdown.reduce(
    (s, a) => s + a.inputTokens + a.outputTokens,
    0
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">System Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          AI costs, cache performance, and system latency — last 30 days
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard
          label="AI Queries (30d)"
          value={totalQueries.toLocaleString()}
          subtext={`${agentBreakdown.length} agents active`}
        />
        <MetricCard
          label="Total AI Cost"
          value={`$${totalCost.toFixed(2)}`}
          subtext={`${(totalTokens / 1000).toFixed(0)}K tokens`}
          color="text-[#00E5FA]"
        />
        <MetricCard
          label="Cache Savings"
          value={`${cacheMetrics.hits} hits`}
          subtext={`${cacheMetrics.misses} misses`}
          color="text-emerald-400"
        />
        <MetricCard
          label="System Health"
          value={perfReport.healthStatus}
          subtext={`${perfReport.endpoints.length} endpoints tracked`}
          color={
            perfReport.healthStatus === 'healthy'
              ? 'text-emerald-400'
              : perfReport.healthStatus === 'degraded'
                ? 'text-amber-400'
                : 'text-red-400'
          }
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Per-Agent Cost Breakdown */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50">
          <div className="border-b border-gray-800 px-5 py-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-400">
              AI Cost by Agent
            </h2>
            <Link
              href="/admin/ai-usage"
              className="text-xs text-[#00E5FA] hover:underline"
            >
              Details →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                    Agent
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                    Queries
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                    Tokens
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {agentBreakdown.length > 0 ? (
                  agentBreakdown.map((row) => (
                    <tr key={row.agent} className="hover:bg-gray-800/30">
                      <td className="px-4 py-2 text-xs font-medium text-gray-200 capitalize">
                        {row.agent}
                      </td>
                      <td className="px-4 py-2 text-right text-xs text-gray-400">
                        {row.queries}
                      </td>
                      <td className="px-4 py-2 text-right text-xs text-gray-400">
                        {((row.inputTokens + row.outputTokens) / 1000).toFixed(
                          0
                        )}
                        K
                      </td>
                      <td className="px-4 py-2 text-right text-xs text-gray-200">
                        ${row.totalCost.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-xs text-gray-500"
                    >
                      No AI usage data in the last 30 days
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cache Performance */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-400">
              Cache Performance
            </h2>
            <Link
              href="/admin/cache"
              className="text-xs text-[#00E5FA] hover:underline"
            >
              Manage →
            </Link>
          </div>
          <CacheGauge hitRate={cacheMetrics.hit_rate} />
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-gray-800 p-3 text-center">
              <p className="text-lg font-bold text-emerald-400">
                {cacheMetrics.hits}
              </p>
              <p className="text-[10px] text-gray-500">Cache Hits</p>
            </div>
            <div className="rounded-lg border border-gray-800 p-3 text-center">
              <p className="text-lg font-bold text-red-400">
                {cacheMetrics.misses}
              </p>
              <p className="text-[10px] text-gray-500">Cache Misses</p>
            </div>
            <div className="rounded-lg border border-gray-800 p-3 text-center">
              <p className="text-lg font-bold text-[#00E5FA]">
                $
                {(
                  cacheMetrics.hits *
                  (totalQueries > 0 ? totalCost / totalQueries : 0.02)
                ).toFixed(2)}
              </p>
              <p className="text-[10px] text-gray-500">Est. Savings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Latency Trends */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50">
        <div className="border-b border-gray-800 px-5 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-400">
            Latency Trends (7 days)
          </h2>
          <Link
            href="/admin/performance"
            className="text-xs text-[#00E5FA] hover:underline"
          >
            Full Report →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                  Endpoint
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                  p50
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                  p95
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                  p99
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                  Samples
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {historicalMetrics.length > 0 ? (
                historicalMetrics.slice(0, 10).map((m, i) => (
                  <tr key={`${m.endpoint}-${i}`} className="hover:bg-gray-800/30">
                    <td className="px-4 py-2 font-mono text-xs text-gray-200">
                      {m.endpoint}
                    </td>
                    <td className="px-4 py-2 text-right text-xs text-gray-400">
                      {m.p50}ms
                    </td>
                    <td
                      className={`px-4 py-2 text-right text-xs font-medium ${
                        m.p95 > 2000
                          ? 'text-red-400'
                          : m.p95 > 1000
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                      }`}
                    >
                      {m.p95}ms
                    </td>
                    <td className="px-4 py-2 text-right text-xs text-gray-400">
                      {m.p99}ms
                    </td>
                    <td className="px-4 py-2 text-right text-xs text-gray-400">
                      {m.sampleCount}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-xs text-gray-500"
                  >
                    No historical metrics yet — data appears after the
                    performance monitor runs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
