// filepath: components/modules/PipelineTable.tsx
'use client'

import { useState, useMemo, useTransition } from 'react'
import { deleteOpportunity } from '@/lib/actions/opportunities'
import { addToast } from '@/components/ui/Toast'
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
  return 'bg-slate-500/20 text-slate-300'
}

const SortIcon = ({ active, direction }: { active: boolean; direction: SortDirection }) => (
  <span className={`ml-1 text-xs ${active ? 'text-cyan' : 'text-slate-600'}`}>
    {active ? (direction === 'asc' ? '▲' : '▼') : '⇅'}
  </span>
)

export function PipelineTable({ opportunities }: PipelineTableProps) {
  const [sortField, setSortField] = useState<SortField>('due_date')
  const [sortDir, setSortDir] = useState<SortDirection>('asc')
  const [filters, setFilters] = useState<PipelineFilters>({
    phase: null,
    status: null,
    setAside: null,
    search: '',
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
    'px-4 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none'
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
          className="rounded-md border border-border bg-navy px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan w-64"
        />
        <select
          value={filters.phase ?? ''}
          onChange={(e) =>
            setFilters((f) => ({ ...f, phase: e.target.value || null }))
          }
          className="rounded-md border border-border bg-navy px-3 py-2 text-sm text-white focus:border-cyan focus:outline-none"
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
          className="rounded-md border border-border bg-navy px-3 py-2 text-sm text-white focus:border-cyan focus:outline-none"
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
          className="rounded-md border border-border bg-navy px-3 py-2 text-sm text-white focus:border-cyan focus:outline-none"
        >
          <option value="">All Set-Asides</option>
          {SET_ASIDES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <a
          href="/pipeline/new"
          className="ml-auto rounded-md bg-cyan px-4 py-2 text-sm font-medium text-navy hover:bg-cyan/80 transition-colors"
        >
          + New Opportunity
        </a>
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
              <th className={`${thClass} text-right`}>Actions</th>
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
                      className="font-medium text-white hover:text-cyan transition-colors"
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
            <h3 className="text-lg font-semibold text-white mb-2">
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
                className="rounded-md border border-border px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors disabled:opacity-50"
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
