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
  if (pct >= 80) return 'bg-red-500/30 text-red-300'
  if (pct >= 50) return 'bg-amber-500/30 text-amber-300'
  if (pct > 0) return 'bg-emerald-500/30 text-emerald-300'
  return 'bg-gray-800/50 text-gray-500'
}

export function TeamWorkloadHeatmap({ members }: TeamWorkloadHeatmapProps) {
  if (members.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-500">
        No team assignment data available.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-800">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900/80">
            <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Team Member
            </th>
            <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">
              Opps
            </th>
            <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">
              In Progress
            </th>
            <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">
              Total Sections
            </th>
            <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Utilization
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {members.map((m) => {
            const util = Math.min(Math.round((m.assignedOpps / 5) * 100), 100)
            return (
              <tr key={m.name} className="transition-colors hover:bg-gray-800/30">
                <td className="px-4 py-2.5 text-sm font-medium text-gray-200">
                  {m.name}
                </td>
                <td className="px-4 py-2.5 text-center text-sm text-gray-300">
                  {m.assignedOpps}
                </td>
                <td className="px-4 py-2.5 text-center text-sm text-amber-400">
                  {m.sectionsInProgress}
                </td>
                <td className="px-4 py-2.5 text-center text-sm text-gray-400">
                  {m.sectionsTotal}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-20 rounded-full bg-gray-800">
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
