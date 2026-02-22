'use client'

import { useState } from 'react'
import { Users, Shield, AlertTriangle, CheckCircle } from 'lucide-react'

interface StaffingRequirement {
  id: string
  laborCategory: string
  level: string | null
  clearanceRequired: string | null
  assigned: string | null
  status: 'filled' | 'unfilled' | 'pending'
}

interface StaffingRequirementsTabProps {
  requirements: StaffingRequirement[]
}

function statusConfig(status: string) {
  switch (status) {
    case 'filled':
      return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: CheckCircle, label: 'Filled' }
    case 'pending':
      return { color: 'text-amber-400', bg: 'bg-amber-500/15', icon: AlertTriangle, label: 'Pending' }
    default:
      return { color: 'text-red-400', bg: 'bg-red-500/15', icon: AlertTriangle, label: 'Unfilled' }
  }
}

export function StaffingRequirementsTab({ requirements }: StaffingRequirementsTabProps) {
  const [filter, setFilter] = useState<string>('All')

  const filled = requirements.filter((r) => r.status === 'filled').length
  const unfilled = requirements.filter((r) => r.status === 'unfilled').length
  const pending = requirements.filter((r) => r.status === 'pending').length

  const filtered =
    filter === 'All'
      ? requirements
      : requirements.filter((r) => r.status === filter)

  return (
    <div className="space-y-4">
      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-muted/20 p-3 text-center">
          <Users className="mx-auto h-4 w-4 text-primary" />
          <p className="mt-1 text-lg font-bold text-foreground">{requirements.length}</p>
          <p className="text-[10px] text-muted-foreground">Total Positions</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-3 text-center">
          <CheckCircle className="mx-auto h-4 w-4 text-emerald-400" />
          <p className="mt-1 text-lg font-bold text-emerald-400">{filled}</p>
          <p className="text-[10px] text-muted-foreground">Filled</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-3 text-center">
          <AlertTriangle className="mx-auto h-4 w-4 text-red-400" />
          <p className="mt-1 text-lg font-bold text-red-400">{unfilled + pending}</p>
          <p className="text-[10px] text-muted-foreground">Gaps</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-8 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="All">All Positions</option>
          <option value="filled">Filled</option>
          <option value="unfilled">Unfilled</option>
          <option value="pending">Pending</option>
        </select>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} position{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            {requirements.length === 0
              ? 'No staffing requirements defined. Add labor categories via the Pricing module.'
              : 'No positions match your filter.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Labor Category
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Level
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Clearance
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Assigned
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((req) => {
                const cfg = statusConfig(req.status)
                const Icon = cfg.icon
                return (
                  <tr key={req.id} className="transition-colors hover:bg-muted/10">
                    <td className="px-4 py-2.5 text-sm font-medium text-foreground">
                      {req.laborCategory}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {req.level ?? '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      {req.clearanceRequired ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                          <Shield className="h-3 w-3" />
                          {req.clearanceRequired}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-foreground">
                      {req.assigned ?? '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.bg} ${cfg.color}`}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
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
