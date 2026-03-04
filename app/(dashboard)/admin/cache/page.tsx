// filepath: app/(dashboard)/admin/cache/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { getCacheMetrics } from '@/lib/cache/semantic-cache'
import type { TaskType } from '@/lib/ai/types'

const AGENT_TYPES: TaskType[] = [
  'chat', 'strategy', 'compliance', 'capture', 'writer',
  'contracts', 'orals', 'pricing', 'summarize', 'classify',
]

const AGENT_TTL_DISPLAY: Record<string, string> = {
  pricing: '1 hour',
  strategy: '4 hours',
  chat: '4 hours',
  capture: '12 hours',
  orals: '12 hours',
  compliance: '24 hours',
  writer: '24 hours',
  contracts: '24 hours',
  summarize: '24 hours',
  classify: '24 hours',
}

export default async function CacheDashboardPage() {
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

  // Fetch aggregate and per-agent metrics
  const [aggregate, ...perAgent] = await Promise.all([
    getCacheMetrics(),
    ...AGENT_TYPES.map((t) => getCacheMetrics(t).then((m) => ({ type: t, ...m }))),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Cache Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Semantic cache performance — content-addressable caching for AI responses
        </p>
      </div>

      {/* Aggregate stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Requests</p>
          <p className="text-3xl font-bold">{(aggregate.hits + aggregate.misses).toLocaleString()}</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Hit Rate</p>
          <p className="text-3xl font-bold" style={{ color: aggregate.hit_rate > 0.5 ? '#10B981' : '#F59E0B' }}>
            {(aggregate.hit_rate * 100).toFixed(1)}%
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Cache Hits / Misses</p>
          <p className="text-3xl font-bold">
            <span className="text-green-500">{aggregate.hits.toLocaleString()}</span>
            {' / '}
            <span className="text-red-400">{aggregate.misses.toLocaleString()}</span>
          </p>
        </div>
      </div>

      {/* Per-agent table */}
      <div className="rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Per-Agent Cache Metrics</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Agent</th>
                <th className="text-right p-3 font-medium">Hits</th>
                <th className="text-right p-3 font-medium">Misses</th>
                <th className="text-right p-3 font-medium">Hit Rate</th>
                <th className="text-right p-3 font-medium">TTL</th>
                <th className="p-3 font-medium">Performance</th>
              </tr>
            </thead>
            <tbody>
              {perAgent.map((agent) => {
                const total = agent.hits + agent.misses
                const rate = total > 0 ? agent.hit_rate * 100 : 0
                return (
                  <tr key={agent.type} className="border-b last:border-0">
                    <td className="p-3 font-medium capitalize">{agent.type}</td>
                    <td className="p-3 text-right text-green-500">{agent.hits.toLocaleString()}</td>
                    <td className="p-3 text-right text-red-400">{agent.misses.toLocaleString()}</td>
                    <td className="p-3 text-right">{rate.toFixed(1)}%</td>
                    <td className="p-3 text-right text-muted-foreground">
                      {AGENT_TTL_DISPLAY[agent.type] ?? '24 hours'}
                    </td>
                    <td className="p-3">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, rate)}%`,
                            backgroundColor: rate > 60 ? '#10B981' : rate > 30 ? '#F59E0B' : '#EF4444',
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Cache uses SHA-256 content-addressable keys via Upstash Redis. CUI-classified prompts are never cached.
        TTL varies by agent sensitivity — pricing caches expire fastest (1hr).
      </p>
    </div>
  )
}
