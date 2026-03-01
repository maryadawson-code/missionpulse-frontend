'use client'

import { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import type { CacheMetrics } from '@/lib/cache/semantic-cache'

// ─── Types ───────────────────────────────────────────────────

interface TokenEntry {
  id: string
  agent_id: string
  input_tokens: number
  output_tokens: number
  estimated_cost_usd: number
  created_at: string
  opportunity_id: string | null
  metadata: unknown
}

interface AIUsageAnalyticsProps {
  entries: TokenEntry[]
  opportunityMap: Record<string, string>
  cacheMetrics: CacheMetrics
}

// ─── Constants ───────────────────────────────────────────────

const AGENT_COLORS: Record<string, string> = {
  chat: '#00E5FA',
  capture: '#10b981',
  compliance: '#f59e0b',
  writer: '#8b5cf6',
  strategy: '#ec4899',
  contracts: '#f97316',
  orals: '#06b6d4',
  pricing: '#ef4444',
  summarize: '#64748b',
  classify: '#94a3b8',
}

const DATE_RANGES = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '60 days', days: 60 },
  { label: '90 days', days: 90 },
] as const

function formatCost(value: number): string {
  return `$${value.toFixed(2)}`
}

// ─── Component ───────────────────────────────────────────────

export function AIUsageAnalytics({
  entries,
  opportunityMap,
  cacheMetrics,
}: AIUsageAnalyticsProps) {
  const [rangeDays, setRangeDays] = useState(30)

  // Filter entries by selected date range
  const filteredEntries = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - rangeDays)
    return entries.filter((e) => new Date(e.created_at) >= cutoff)
  }, [entries, rangeDays])

  // ─── Aggregations ──────────────────────────────────────

  const totals = useMemo(() => {
    let cost = 0
    let tokens = 0
    let requests = 0
    for (const e of filteredEntries) {
      cost += e.estimated_cost_usd
      tokens += e.input_tokens + e.output_tokens
      requests++
    }
    return { cost, tokens, requests }
  }, [filteredEntries])

  // Cost by model (from metadata)
  const costByModel = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of filteredEntries) {
      const meta = e.metadata as Record<string, unknown> | null
      const model = (meta?.model as string) ?? 'unknown'
      map.set(model, (map.get(model) ?? 0) + e.estimated_cost_usd)
    }
    return Array.from(map.entries())
      .map(([model, cost]) => ({ model, cost: Number(cost.toFixed(4)) }))
      .sort((a, b) => b.cost - a.cost)
  }, [filteredEntries])

  // Cost by agent
  const costByAgent = useMemo(() => {
    const map = new Map<string, { cost: number; count: number; tokens: number }>()
    for (const e of filteredEntries) {
      const existing = map.get(e.agent_id) ?? { cost: 0, count: 0, tokens: 0 }
      existing.cost += e.estimated_cost_usd
      existing.count++
      existing.tokens += e.input_tokens + e.output_tokens
      map.set(e.agent_id, existing)
    }
    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        cost: Number(data.cost.toFixed(4)),
        count: data.count,
        tokens: data.tokens,
      }))
      .sort((a, b) => b.cost - a.cost)
  }, [filteredEntries])

  // Cost per proposal (opportunity)
  const costPerProposal = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of filteredEntries) {
      if (!e.opportunity_id) continue
      map.set(e.opportunity_id, (map.get(e.opportunity_id) ?? 0) + e.estimated_cost_usd)
    }
    return Array.from(map.entries())
      .map(([id, cost]) => ({
        name: opportunityMap[id] ?? id.slice(0, 12),
        cost: Number(cost.toFixed(2)),
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10)
  }, [filteredEntries, opportunityMap])

  // Daily cost trend
  const dailyCostTrend = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of filteredEntries) {
      const day = e.created_at.slice(0, 10)
      map.set(day, (map.get(day) ?? 0) + e.estimated_cost_usd)
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, cost]) => ({
        date: new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        cost: Number(cost.toFixed(4)),
      }))
  }, [filteredEntries])

  // ─── CSV Export ────────────────────────────────────────

  function exportCSV() {
    const headers = [
      'Date',
      'Agent',
      'Model',
      'Input Tokens',
      'Output Tokens',
      'Cost (USD)',
      'Opportunity',
    ]
    const rows = filteredEntries.map((e) => {
      const meta = e.metadata as Record<string, unknown> | null
      return [
        e.created_at,
        e.agent_id,
        (meta?.model as string) ?? '',
        e.input_tokens,
        e.output_tokens,
        e.estimated_cost_usd.toFixed(4),
        e.opportunity_id ? (opportunityMap[e.opportunity_id] ?? e.opportunity_id) : '',
      ].join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-usage-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ─── Render ────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {DATE_RANGES.map((range) => (
            <button
              key={range.days}
              onClick={() => setRangeDays(range.days)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                rangeDays === range.days
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
        <button
          onClick={exportCSV}
          className="rounded-lg bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KPICard label="Total Cost" value={formatCost(totals.cost)} />
        <KPICard
          label="Total Tokens"
          value={totals.tokens.toLocaleString()}
        />
        <KPICard label="AI Requests" value={String(totals.requests)} />
        <KPICard
          label="Avg Cost/Request"
          value={totals.requests > 0 ? formatCost(totals.cost / totals.requests) : '$0.00'}
        />
        <KPICard
          label="Cache Hit Rate"
          value={`${Math.round(cacheMetrics.hit_rate * 100)}%`}
          subtitle={`${cacheMetrics.hits} hits / ${cacheMetrics.misses} misses`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Daily cost trend */}
        <div className="rounded-xl border border-border bg-card/50 p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Daily Cost Trend
          </h3>
          {dailyCostTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyCostTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    border: '1px solid #1E293B',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value) => [formatCost(Number(value)), 'Cost']}
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="#00E5FA"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Cost by agent pie */}
        <div className="rounded-xl border border-border bg-card/50 p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Cost by Agent
          </h3>
          {costByAgent.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={250}>
                <PieChart>
                  <Pie
                    data={costByAgent}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="cost"
                  >
                    {costByAgent.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          AGENT_COLORS[entry.name] ??
                          `hsl(${(i * 45) % 360}, 60%, 50%)`
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      border: '1px solid #1E293B',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value) => [formatCost(Number(value)), 'Cost']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {costByAgent.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor:
                          AGENT_COLORS[item.name] ?? '#64748b',
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {item.name}: {formatCost(item.cost)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Cost by model */}
        <div className="rounded-xl border border-border bg-card/50 p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Cost by Model
          </h3>
          {costByModel.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={costByModel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(v) => `$${v}`}
                />
                <YAxis
                  type="category"
                  dataKey="model"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    border: '1px solid #1E293B',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value) => [formatCost(Number(value)), 'Cost']}
                />
                <Bar dataKey="cost" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Cost per proposal */}
        <div className="rounded-xl border border-border bg-card/50 p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Cost per Proposal (Top 10)
          </h3>
          {costPerProposal.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={costPerProposal} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(v) => `$${v}`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  width={140}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    border: '1px solid #1E293B',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value) => [formatCost(Number(value)), 'Cost']}
                />
                <Bar dataKey="cost" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────

function KPICard({
  label,
  value,
  subtitle,
}: {
  label: string
  value: string
  subtitle?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-5">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
      No usage data for this period
    </div>
  )
}
