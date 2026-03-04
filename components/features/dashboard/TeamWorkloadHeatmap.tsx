'use client'

interface TeamMember {
  name: string
  assignedOpps: number
  sectionsInProgress: number
  sectionsTotal: number
}

interface TeamWorkloadHeatmapProps {
  members: TeamMember[]
}

function utilizationColor(pct: number): string {
  if (pct >= 80) return 'bg-red-500/30 text-red-700 dark:text-red-300'
  if (pct >= 50) return 'bg-amber-500/30 text-amber-700 dark:text-amber-300'
  if (pct > 0) return 'bg-emerald-500/30 text-emerald-700 dark:text-emerald-300'
  return 'bg-muted/50 text-muted-foreground'
}

export function TeamWorkloadHeatmap({ members }: TeamWorkloadHeatmapProps) {
  if (members.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No team assignment data available.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-card/80">
            <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Team Member
            </th>
            <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
              Opps
            </th>
            <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
              In Progress
            </th>
            <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
              Total Sections
            </th>
            <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Utilization
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {members.map((m) => {
            const util = Math.min(Math.round((m.assignedOpps / 5) * 100), 100)
            return (
              <tr key={m.name} className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-2.5 text-sm font-medium text-foreground">
                  {m.name}
                </td>
                <td className="px-4 py-2.5 text-center text-sm text-muted-foreground">
                  {m.assignedOpps}
                </td>
                <td className="px-4 py-2.5 text-center text-sm text-amber-600 dark:text-amber-400">
                  {m.sectionsInProgress}
                </td>
                <td className="px-4 py-2.5 text-center text-sm text-muted-foreground">
                  {m.sectionsTotal}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-20 rounded-full bg-muted">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          util >= 80
                            ? 'bg-red-400'
                            : util >= 50
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${util}%` }}
                      />
                    </div>
                    <span
                      className={`inline-block min-w-[40px] rounded-md px-1.5 py-0.5 text-center text-[10px] font-medium ${utilizationColor(util)}`}
                    >
                      {util}%
                    </span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
