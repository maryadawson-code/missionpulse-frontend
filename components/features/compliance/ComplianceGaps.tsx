import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

interface GapRequirement {
  id: string
  opportunity_id: string | null
  reference: string
  requirement: string
  section: string | null
  priority: string | null
  assigned_to: string | null
  created_at: string | null
}

interface Opportunity {
  id: string
  title: string
}

interface ComplianceGapsProps {
  gaps: GapRequirement[]
  opportunities: Opportunity[]
}

export function ComplianceGaps({ gaps, opportunities }: ComplianceGapsProps) {
  const oppMap = new Map(opportunities.map((o) => [o.id, o.title]))

  // Show up to 20 most critical gaps, prioritized by priority level
  const priorityOrder: Record<string, number> = {
    Critical: 0,
    High: 1,
    Medium: 2,
    Low: 3,
  }

  const sorted = [...gaps].sort((a, b) => {
    const aP = priorityOrder[a.priority ?? 'Medium'] ?? 2
    const bP = priorityOrder[b.priority ?? 'Medium'] ?? 2
    return aP - bP
  })

  const displayed = sorted.slice(0, 20)

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {gaps.length} requirement{gaps.length !== 1 ? 's' : ''} with &quot;Not Started&quot; status.
        Showing top {displayed.length} by priority.
      </p>

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ref
                </th>
                <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Requirement
                </th>
                <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Opportunity
                </th>
                <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Priority
                </th>
                <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Assigned
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayed.map((gap) => {
                const priorityColor =
                  gap.priority === 'Critical'
                    ? 'text-red-400'
                    : gap.priority === 'High'
                      ? 'text-amber-400'
                      : gap.priority === 'Medium'
                        ? 'text-blue-400'
                        : 'text-muted-foreground'

                return (
                  <tr key={gap.id} className="transition-colors hover:bg-card/50">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="h-3 w-3 text-amber-400" />
                        <span className="font-mono text-xs font-semibold text-primary">
                          {gap.reference}
                        </span>
                      </div>
                    </td>
                    <td className="max-w-sm px-4 py-2 text-xs text-foreground line-clamp-1">
                      {gap.requirement}
                    </td>
                    <td className="px-4 py-2">
                      {gap.opportunity_id ? (
                        <Link
                          href={`/pipeline/${gap.opportunity_id}/compliance`}
                          className="text-xs text-muted-foreground hover:text-primary"
                        >
                          {oppMap.get(gap.opportunity_id) ?? 'Unknown'}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-xs font-medium ${priorityColor}`}>
                        {gap.priority ?? 'Medium'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {gap.assigned_to ?? 'Unassigned'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
