'use client'

import { useState } from 'react'
import { Search, Shield, User, Briefcase } from 'lucide-react'

interface PersonnelRecord {
  id: string
  firstName: string
  lastName: string
  title: string | null
  laborCategory: string | null
  clearanceLevel: string | null
  clearanceStatus: string | null
  availabilityStatus: string | null
  skills: string[] | null
}

interface PersonnelAssignmentPanelProps {
  personnel: PersonnelRecord[]
  assignedIds: string[]
  onAssign?: (_personId: string) => void
}

function clearanceColor(status: string | null): string {
  switch (status) {
    case 'active':
      return 'text-emerald-400'
    case 'pending':
    case 'interim':
      return 'text-amber-400'
    case 'expired':
    case 'inactive':
      return 'text-red-400'
    default:
      return 'text-gray-400'
  }
}

function availabilityBadge(status: string | null): { bg: string; text: string; label: string } {
  switch (status) {
    case 'available':
      return { bg: 'bg-emerald-500/15', text: 'text-emerald-300', label: 'Available' }
    case 'partially_available':
      return { bg: 'bg-amber-500/15', text: 'text-amber-300', label: 'Partial' }
    case 'unavailable':
    case 'assigned':
      return { bg: 'bg-red-500/15', text: 'text-red-300', label: 'Unavailable' }
    default:
      return { bg: 'bg-gray-500/15', text: 'text-gray-300', label: status ?? 'Unknown' }
  }
}

export function PersonnelAssignmentPanel({
  personnel,
  assignedIds,
  onAssign,
}: PersonnelAssignmentPanelProps) {
  const [search, setSearch] = useState('')
  const [filterClearance, setFilterClearance] = useState<string>('All')

  const clearanceLevels = Array.from(
    new Set(personnel.map((p) => p.clearanceLevel).filter(Boolean))
  ).sort() as string[]

  const filtered = personnel.filter((p) => {
    if (filterClearance !== 'All' && p.clearanceLevel !== filterClearance) return false
    const q = search.toLowerCase()
    if (
      q &&
      !`${p.firstName} ${p.lastName}`.toLowerCase().includes(q) &&
      !(p.laborCategory ?? '').toLowerCase().includes(q) &&
      !(p.title ?? '').toLowerCase().includes(q)
    )
      return false
    return true
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search personnel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-[200px] rounded-md border border-border bg-background pl-7 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={filterClearance}
          onChange={(e) => setFilterClearance(e.target.value)}
          className="h-8 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="All">All Clearances</option>
          {clearanceLevels.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {personnel.length} personnel
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <User className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            {personnel.length === 0
              ? 'No personnel records. Add key personnel in the Personnel module.'
              : 'No results match your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {filtered.map((p) => {
            const isAssigned = assignedIds.includes(p.id)
            const avail = availabilityBadge(p.availabilityStatus)
            return (
              <div
                key={p.id}
                className={`rounded-lg border p-3 transition-colors ${
                  isAssigned
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border bg-card hover:border-border/80'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {p.firstName} {p.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.title ?? p.laborCategory ?? 'No title'}
                    </p>
                  </div>
                  {onAssign && !isAssigned && (
                    <button
                      onClick={() => onAssign(p.id)}
                      className="rounded-md border border-primary/30 px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/10"
                    >
                      Assign
                    </button>
                  )}
                  {isAssigned && (
                    <span className="text-[10px] font-medium text-primary">
                      Assigned
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {p.laborCategory && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Briefcase className="h-3 w-3" />
                      {p.laborCategory}
                    </span>
                  )}
                  {p.clearanceLevel && (
                    <span className={`inline-flex items-center gap-1 text-[10px] ${clearanceColor(p.clearanceStatus)}`}>
                      <Shield className="h-3 w-3" />
                      {p.clearanceLevel}
                    </span>
                  )}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${avail.bg} ${avail.text}`}>
                    {avail.label}
                  </span>
                </div>

                {p.skills && p.skills.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {(p.skills as string[]).slice(0, 3).map((s) => (
                      <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
