'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface PipelineValueChartProps {
  data: { phase: string; value: number; count: number }[]
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

export function PipelineValueChart({ data }: PipelineValueChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No pipeline data to display
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
        <XAxis
          dataKey="phase"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={{ stroke: '#1E293B' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatCurrency}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={{ stroke: '#1E293B' }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0F172A',
            border: '1px solid #1E293B',
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: '#e2e8f0' }}
          formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Pipeline Value']}
        />
        <Bar dataKey="value" fill="#00E5FA" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
