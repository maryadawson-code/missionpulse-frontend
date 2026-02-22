'use client'

import { Users, Clock, TrendingUp } from 'lucide-react'

interface TeamMember {
  name: string
  activeOpps: number
  avgCycleTimeDays: number | null
  winRate: number | null
}

interface TeamPerformanceProps {
  members: TeamMember[]
  avgCycleTime: number | null
}

export function TeamPerformance({ members, avgCycleTime }: TeamPerformanceProps) {
  return (
    <div className="space-y-4">
      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-muted/20 p-3 text-center">
          <Users className="mx-auto h-4 w-4 text-primary" />
          <p className="mt-1 text-lg font-bold text-foreground">{members.length}</p>
          <p className="text-[10px] text-muted-foreground">Team Members</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-3 text-center">
          <Clock className="mx-auto h-4 w-4 text-amber-400" />
          <p className="mt-1 text-lg font-bold text-foreground">
            {avgCycleTime !== null ? `${avgCycleTime}d` : '—'}
          </p>
          <p className="text-[10px] text-muted-foreground">Avg Cycle Time</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-3 text-center">
          <TrendingUp className="mx-auto h-4 w-4 text-emerald-400" />
          <p className="mt-1 text-lg font-bold text-foreground">
            {members.reduce((sum, m) => sum + m.activeOpps, 0)}
          </p>
          <p className="text-[10px] text-muted-foreground">Total Active</p>
        </div>
      </div>

      {/* Member Table */}
      {members.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No team data available.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Member
                </th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                  Active Opps
                </th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                  Cycle Time
                </th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                  Win Rate
                </th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Capacity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((m) => {
                const capacity = Math.min(m.activeOpps / 5, 1) * 100
                return (
                  <tr key={m.name} className="transition-colors hover:bg-muted/10">
                    <td className="px-3 py-2.5 text-sm font-medium text-foreground">
                      {m.name}
                    </td>
                    <td className="px-3 py-2.5 text-center text-sm text-foreground">
                      {m.activeOpps}
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs text-muted-foreground">
                      {m.avgCycleTimeDays !== null
                        ? `${m.avgCycleTimeDays}d`
                        : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={`text-sm font-medium ${
                          (m.winRate ?? 0) >= 50
                            ? 'text-emerald-400'
                            : (m.winRate ?? 0) >= 30
                            ? 'text-amber-400'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {m.winRate !== null ? `${m.winRate}%` : '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-muted">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              capacity >= 80
                                ? 'bg-red-400'
                                : capacity >= 50
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            }`}
                            style={{ width: `${capacity}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {Math.round(capacity)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
