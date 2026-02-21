'use client'

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
} from 'recharts'

interface TokenEntry {
  id: string
  agent_id: string
  input_tokens: number
  output_tokens: number
  estimated_cost_usd: number
  created_at: string
  metadata: unknown
}

interface TokenUsageChartsProps {
  entries: TokenEntry[]
  monthlyBudget: number
}

const AGENT_COLORS: Record<string, string> = {
  chat: '#00E5FA',
  capture: '#10b981',
  compliance: '#f59e0b',
  writer: '#8b5cf6',
  strategy: '#ec4899',
  contracts: '#f97316',
  orals: '#06b6d4',
  summarize: '#64748b',
  classify: '#94a3b8',
}

function formatCost(value: number): string {
  return `$${value.toFixed(2)}`
}

export function TokenUsageCharts({
  entries,
  monthlyBudget,
}: TokenUsageChartsProps) {
  // Aggregate by agent
  const agentMap = new Map<
    string,
    { tokens: number; cost: number; count: number }
  >()
  let totalCost = 0
  let totalTokens = 0

  for (const entry of entries) {
    const agent = entry.agent_id
    const existing = agentMap.get(agent) ?? { tokens: 0, cost: 0, count: 0 }
    const tokens = entry.input_tokens + entry.output_tokens
    existing.tokens += tokens
    existing.cost += entry.estimated_cost_usd
    existing.count++
    totalCost += entry.estimated_cost_usd
    totalTokens += tokens
    agentMap.set(agent, existing)
  }

  const costByAgent = Array.from(agentMap.entries())
    .map(([name, data]) => ({
      name,
      cost: Number(data.cost.toFixed(4)),
      tokens: data.tokens,
      count: data.count,
    }))
    .sort((a, b) => b.cost - a.cost)

  // Daily usage
  const dailyMap = new Map<string, { tokens: number; cost: number }>()
  for (const entry of entries) {
    const day = entry.created_at.slice(0, 10)
    const existing = dailyMap.get(day) ?? { tokens: 0, cost: 0 }
    existing.tokens += entry.input_tokens + entry.output_tokens
    existing.cost += entry.estimated_cost_usd
    dailyMap.set(day, existing)
  }

  const dailyUsage = Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      tokens: data.tokens,
      cost: Number(data.cost.toFixed(4)),
    }))

  const budgetRemaining = monthlyBudget - totalCost
  const budgetPct = Math.round((totalCost / monthlyBudget) * 100)

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Total Tokens
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {totalTokens.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Total Cost
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {formatCost(totalCost)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Budget Remaining
          </p>
          <p
            className={`mt-2 text-2xl font-bold ${budgetPct > 75 ? 'text-red-400' : 'text-emerald-400'}`}
          >
            {formatCost(budgetRemaining)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {budgetPct}% of ${monthlyBudget} used
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            AI Requests
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {entries.length}
          </p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Daily usage */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Token Usage by Day
          </h3>
          {dailyUsage.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    border: '1px solid #1E293B',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="tokens" fill="#00E5FA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
              No usage data yet
            </div>
          )}
        </div>

        {/* Cost by agent */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Cost by Agent Type
          </h3>
          {costByAgent.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={250}>
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
            <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
              No usage data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent requests table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            Recent AI Requests
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                  Time
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                  Agent
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                  Tokens
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                  Cost
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    No AI requests recorded yet
                  </td>
                </tr>
              ) : (
                entries.slice(0, 20).map((entry) => (
                  <tr
                    key={entry.id}
                    className="transition-colors hover:bg-muted/10"
                  >
                    <td className="whitespace-nowrap px-4 py-2 text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: `${AGENT_COLORS[entry.agent_id] ?? '#64748b'}20`,
                          color: AGENT_COLORS[entry.agent_id] ?? '#94a3b8',
                        }}
                      >
                        {entry.agent_id}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs font-mono text-foreground">
                      {(
                        entry.input_tokens + entry.output_tokens
                      ).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-xs font-mono text-foreground">
                      {formatCost(entry.estimated_cost_usd)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
