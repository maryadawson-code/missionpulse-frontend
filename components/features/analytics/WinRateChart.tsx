'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface WinRateChartProps {
  data: { date: string; winRate: number; wins: number; losses: number }[]
}

export function WinRateChart({ data }: WinRateChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No win/loss data yet. Snapshots build over time.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={{ stroke: '#1E293B' }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
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
          formatter={(value, name) => [
            `${value ?? 0}%`,
            name === 'winRate' ? 'Win Rate' : String(name),
          ]}
        />
        <Line
          type="monotone"
          dataKey="winRate"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ fill: '#10b981', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
