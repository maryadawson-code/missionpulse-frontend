// filepath: components/modules/PipelineTable.tsx
'use client'

import { useState, useMemo, useTransition } from 'react'
import { deleteOpportunity } from '@/lib/actions/opportunities'
import { addToast } from '@/components/ui/Toast'
import { exportToCSV } from '@/lib/utils/export'
import {
  SHIPLEY_PHASES,
  OPPORTUNITY_STATUSES,
  SET_ASIDES,
} from '@/lib/types/opportunities'
import type {
  Opportunity,
  SortField,
  SortDirection,
  PipelineFilters,
} from '@/lib/types/opportunities'

interface PipelineTableProps {
  opportunities: Pick<
    Opportunity,
    | 'id'
    | 'title'
    | 'agency'
    | 'ceiling'
    | 'pwin'
    | 'phase'
    | 'status'
    | 'set_aside'
    | 'due_date'
    | 'owner_id'
    | 'priority'
    | 'solicitation_number'
  >[]
  initialSearch?: string
  canEdit?: boolean
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function pwinColor(pwin: number | null): string {
  const v = pwin ?? 50
  if (v >= 70) return 'text-emerald-400'
  if (v >= 40) return 'text-amber-400'
  return 'text-red-400'
}

function phaseColor(phase: string | null): string {
  const p = phase ?? 'Gate 1'
  if (p.includes('5') || p.includes('6')) return 'bg-emerald-500/20 text-emerald-300'
  if (p.includes('3') || p.includes('4')) return 'bg-amber-500/20 text-amber-300'
  return 'bg-muted/20 text-muted-foreground'
}

const SortIcon = ({ active, direction }: { active: boolean; direction: SortDirection }) => (
  <span className={`ml-1 text-xs ${active ? 'text-cyan' : 'text-muted-foreground'}`}>
    {active ? (direction === 'asc' ? '▲' : '▼') : '⇅'}
  </span>
)

export function PipelineTable({ opportunities, initialSearch = '', canEdit = true }: PipelineTableProps) {
  const [sortField, setSortField] = useState<SortField>('due_date')
  const [sortDir, setSortDir] = useState<SortDirection>('asc')
  const [filters, setFilters] = useState<PipelineFilters>({
    phase: null,
    status: null,
    setAside: null,
    search: initialSearch,
    ceilingMin: '',
    ceilingMax: '',
    pwinMin: '',
    pwinMax: '',
    dueDateStart: '',
    dueDateEnd: '',
  })
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const filtered = useMemo(() => {
    let result = [...opportunities]

    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(
        (o) =>
          o.title?.toLowerCase().includes(q) ||
          o.agency?.toLowerCase().includes(q) ||
          o.solicitation_number?.toLowerCase().includes(q)
      )
    }
    if (filters.phase) result = result.filter((o) => o.phase === filters.phase)
    if (filters.status) result = result.filter((o) => o.status === filters.status)
    if (filters.setAside) result = result.filter((o) => o.set_aside === filters.setAside)

    // Range filters
    if (filters.ceilingMin) {
      const min = Number(filters.ceilingMin)
      result = result.filter((o) => (Number(o.ceiling) || 0) >= min)
    }
    if (filters.ceilingMax) {
      const max = Number(filters.ceilingMax)
      result = result.filter((o) => (Number(o.ceiling) || 0) <= max)
    }
    if (filters.pwinMin) {
      const min = Number(filters.pwinMin)
      result = result.filter((o) => (o.pwin ?? 0) >= min)
    }
    if (filters.pwinMax) {
      const max = Number(filters.pwinMax)
      result = result.filter((o) => (o.pwin ?? 0) <= max)
    }
    if (filters.dueDateStart) {
      result = result.filter((o) => o.due_date && o.due_date >= filters.dueDateStart)
    }
    if (filters.dueDateEnd) {
      result = result.filter((o) => o.due_date && o.due_date <= filters.dueDateEnd)
    }

    result.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'title':
          cmp = (a.title ?? '').localeCompare(b.title ?? '')
          break
        case 'agency':
          cmp = (a.agency ?? '').localeCompare(b.agency ?? '')
          break
        case 'ceiling':
          cmp = (Number(a.ceiling) || 0) - (Number(b.ceiling) || 0)
          break
        case 'pwin':
          cmp = (a.pwin ?? 0) - (b.pwin ?? 0)
          break
        case 'phase':
          cmp = (a.phase ?? '').localeCompare(b.phase ?? '')
          break
        case 'due_date':
          cmp =
            new Date(a.due_date ?? '9999').getTime() -
            new Date(b.due_date ?? '9999').getTime()
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [opportunities, filters, sortField, sortDir])

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteOpportunity(id)
      if (result.success) {
        addToast('success', 'Opportunity deleted')
      } else {
        addToast('error', result.error ?? 'Delete failed')
      }
      setDeleteTarget(null)
    })
  }

  const thClass =
    'px-4 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none'
  const tdClass = 'px-4 py-3 text-sm whitespace-nowrap'

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search pipeline..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="rounded-md border border-border bg-navy px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan w-64"
        />
        <select
          value={filters.phase ?? ''}
          onChange={(e) =>
            setFilters((f) => ({ ...f, phase: e.target.value || null }))
          }
          className="rounded-md border border-border bg-navy px-3 py-2 text-sm text-foreground focus:border-cyan focus:outline-none"
        >
          <option value="">All Phases</option>
          {SHIPLEY_PHASES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={filters.status ?? ''}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value || null }))
          }
          className="rounded-md border border-border bg-navy px-3 py-2 text-sm text-foreground focus:border-cyan focus:outline-none"
        >
          <option value="">All Statuses</option>
          {OPPORTUNITY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={filters.setAside ?? ''}
          onChange={(e) =>
            setFilters((f) => ({ ...f, setAside: e.target.value || null }))
          }
          className="rounded-md border border-border bg-navy px-3 py-2 text-sm text-foreground focus:border-cyan focus:outline-none"
        >
          <option value="">All Set-Asides</option>
          {SET_ASIDES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          onClick={() =>
            exportToCSV(
              filtered,
              [
                { header: 'Title', accessor: (o) => o.title },
                { header: 'Agency', accessor: (o) => o.agency },
                { header: 'Ceiling', accessor: (o) => o.ceiling ? Number(o.ceiling) : null },
                { header: 'pWin', accessor: (o) => o.pwin },
                { header: 'Phase', accessor: (o) => o.phase },
                { header: 'Status', accessor: (o) => o.status },
                { header: 'Set-Aside', accessor: (o) => o.set_aside },
                { header: 'Due Date', accessor: (o) => o.due_date },
                { header: 'Solicitation #', accessor: (o) => o.solicitation_number },
              ],
              `pipeline-export-${new Date().toISOString().slice(0, 10)}.csv`
            )
          }
          className="rounded-md border border-border px-3 py-2 text-sm text-slate hover:text-foreground hover:border-cyan transition-colors"
        >
          Export CSV
        </button>
        {canEdit && (
          <a
            href="/pipeline/new"
            className="ml-auto rounded-md bg-cyan px-4 py-2 text-sm font-medium text-navy hover:bg-cyan/80 transition-colors"
          >
            + New Opportunity
          </a>
        )}
      </div>

      {/* Range Filters Row */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-[10px] font-medium text-muted-foreground mb-1">Ceiling ($)</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              placeholder="Min"
              value={filters.ceilingMin}
              onChange={(e) => setFilters((f) => ({ ...f, ceilingMin: e.target.value }))}
              className="w-24 rounded-md border border-border bg-navy px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-cyan focus:outline-none"
            />
            <span className="text-muted-foreground text-xs">–</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.ceilingMax}
              onChange={(e) => setFilters((f) => ({ ...f, ceilingMax: e.target.value }))}
              className="w-24 rounded-md border border-border bg-navy px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-cyan focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-medium text-muted-foreground mb-1">pWin (%)</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              placeholder="Min"
              min={0}
              max={100}
              value={filters.pwinMin}
              onChange={(e) => setFilters((f) => ({ ...f, pwinMin: e.target.value }))}
              className="w-16 rounded-md border border-border bg-navy px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-cyan focus:outline-none"
            />
            <span className="text-muted-foreground text-xs">–</span>
            <input
              type="number"
              placeholder="Max"
              min={0}
              max={100}
              value={filters.pwinMax}
              onChange={(e) => setFilters((f) => ({ ...f, pwinMax: e.target.value }))}
              className="w-16 rounded-md border border-border bg-navy px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-cyan focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-medium text-muted-foreground mb-1">Due Date</label>
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={filters.dueDateStart}
              onChange={(e) => setFilters((f) => ({ ...f, dueDateStart: e.target.value }))}
              className="rounded-md border border-border bg-navy px-2 py-1.5 text-xs text-foreground focus:border-cyan focus:outline-none"
            />
            <span className="text-muted-foreground text-xs">–</span>
            <input
              type="date"
              value={filters.dueDateEnd}
              onChange={(e) => setFilters((f) => ({ ...f, dueDateEnd: e.target.value }))}
              className="rounded-md border border-border bg-navy px-2 py-1.5 text-xs text-foreground focus:border-cyan focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead className="bg-surface">
            <tr>
              <th className={thClass} onClick={() => toggleSort('title')}>
                Title <SortIcon active={sortField === 'title'} direction={sortDir} />
              </th>
              <th className={thClass} onClick={() => toggleSort('agency')}>
                Agency <SortIcon active={sortField === 'agency'} direction={sortDir} />
              </th>
              <th className={thClass} onClick={() => toggleSort('ceiling')}>
                Contract Value{' '}
                <SortIcon active={sortField === 'ceiling'} direction={sortDir} />
              </th>
              <th className={thClass} onClick={() => toggleSort('pwin')}>
                Win Probability{' '}
                <SortIcon active={sortField === 'pwin'} direction={sortDir} />
              </th>
              <th className={thClass} onClick={() => toggleSort('phase')}>
                Phase <SortIcon active={sortField === 'phase'} direction={sortDir} />
              </th>
              <th className={thClass} onClick={() => toggleSort('due_date')}>
                Due Date{' '}
                <SortIcon active={sortField === 'due_date'} direction={sortDir} />
              </th>
              {canEdit && <th className={`${thClass} text-right`}>Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate">
                  {opportunities.length === 0
                    ? 'No opportunities yet. Create one to get started.'
                    : 'No results match your filters.'}
                </td>
              </tr>
            ) : (
              filtered.map((opp) => (
                <tr
                  key={opp.id}
                  className="hover:bg-surface/50 transition-colors"
                >
                  <td className={tdClass}>
                    <a
                      href={`/war-room/${opp.id}`}
                      className="font-medium text-foreground hover:text-cyan transition-colors"
                    >
                      {opp.title}
                    </a>
                  </td>
                  <td className={`${tdClass} text-slate`}>{opp.agency ?? '—'}</td>
                  <td className={`${tdClass} font-mono`}>
                    {formatCurrency(opp.ceiling ? Number(opp.ceiling) : null)}
                  </td>
                  <td className={`${tdClass} font-mono ${pwinColor(opp.pwin)}`}>
                    {opp.pwin ?? 50}%
                  </td>
                  <td className={tdClass}>
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${phaseColor(opp.phase)}`}
                    >
                      {opp.phase ?? 'Gate 1'}
                    </span>
                  </td>
                  <td className={`${tdClass} text-slate`}>
                    {formatDate(opp.due_date)}
                  </td>
                  {canEdit && (
                    <td className={`${tdClass} text-right`}>
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/pipeline/${opp.id}/edit`}
                          className="text-xs text-slate hover:text-cyan transition-colors"
                        >
                          Edit
                        </a>
                        <button
                          onClick={() => setDeleteTarget(opp.id)}
                          className="text-xs text-slate hover:text-red-400 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Result count */}
      <p className="text-xs text-slate">
        Showing {filtered.length} of {opportunities.length} opportunities
      </p>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-lg border border-border bg-surface p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Delete Opportunity
            </h3>
            <p className="text-sm text-slate mb-6">
              This action cannot be undone. The opportunity and all associated
              data will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isPending}
                className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                disabled={isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
