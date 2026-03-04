import Link from 'next/link'

interface OpportunityStat {
  id: string
  title: string
  status: string | null
  phase: string | null
  due_date: string | null
  total: number
  addressed: number
  notStarted: number
  inProgress: number
  verified: number
  pct: number
}

interface OpportunityComplianceTableProps {
  opportunities: OpportunityStat[]
}

export function OpportunityComplianceTable({
  opportunities,
}: OpportunityComplianceTableProps) {
  if (opportunities.length === 0) {
    return (
      <div className="rounded-lg border border-border p-12 text-center">
        <p className="text-sm text-muted-foreground">
          No active opportunities with compliance requirements.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Opportunity
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Phase
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                Total
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                Not Started
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                In Progress
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                Addressed
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                Verified
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Health
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {opportunities.map((opp) => (
              <tr key={opp.id} className="transition-colors hover:bg-card/50">
                <td className="px-4 py-3">
                  <Link
                    href={`/pipeline/${opp.id}/compliance`}
                    className="text-sm font-medium text-foreground hover:text-primary"
                  >
                    {opp.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {opp.phase ?? '—'}
                </td>
                <td className="px-4 py-3 text-center text-xs text-foreground">
                  {opp.total}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`text-xs font-medium ${
                      opp.notStarted > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
                    }`}
                  >
                    {opp.notStarted}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-xs text-amber-600 dark:text-amber-400">
                  {opp.inProgress}
                </td>
                <td className="px-4 py-3 text-center text-xs text-emerald-600 dark:text-emerald-400">
                  {opp.addressed}
                </td>
                <td className="px-4 py-3 text-center text-xs text-blue-600 dark:text-blue-400">
                  {opp.verified}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${
                          opp.pct >= 80
                            ? 'bg-emerald-500'
                            : opp.pct >= 50
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${opp.pct}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        opp.pct >= 80
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : opp.pct >= 50
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {opp.pct}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
