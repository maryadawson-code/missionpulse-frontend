'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

interface BOEEntry {
  id: string
  wbs_number: string | null
  task_description: string | null
  labor_category_id: string | null
  period: string | null
  total_hours: number | null
  rate_used: number | null
  extended_cost: number | null
  assumptions: string | null
}

interface BOETableProps {
  entries: BOEEntry[]
  lcatMap: Record<string, string>
}

function formatCurrency(value: number | null): string {
  if (value === null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatRate(value: number | null): string {
  if (value === null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function BOETable({ entries, lcatMap }: BOETableProps) {
  const [search, setSearch] = useState('')
  const [filterPeriod, setFilterPeriod] = useState<string>('All')

  const periods = Array.from(new Set(entries.map((e) => e.period).filter(Boolean))).sort() as string[]

  const filtered = entries.filter((e) => {
    if (filterPeriod !== 'All' && e.period !== filterPeriod) return false
    if (
      search &&
      !(e.task_description ?? '').toLowerCase().includes(search.toLowerCase()) &&
      !(e.wbs_number ?? '').toLowerCase().includes(search.toLowerCase())
    )
      return false
    return true
  })

  const totalHours = filtered.reduce((s, e) => s + (e.total_hours ?? 0), 0)
  const totalCost = filtered.reduce((s, e) => s + (e.extended_cost ?? 0), 0)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-[200px] rounded-md border border-gray-700 bg-gray-900 pl-7 pr-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#00E5FA]"
          />
        </div>
        <select
          value={filterPeriod}
          onChange={(e) => setFilterPeriod(e.target.value)}
          className="h-8 rounded-md border border-gray-700 bg-gray-900 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00E5FA]"
        >
          <option value="All">All Periods</option>
          {periods.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <span className="ml-auto text-xs text-gray-500">
          {filtered.length} entries · {totalHours.toLocaleString()} hrs · {formatCurrency(totalCost)}
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-800 p-8 text-center">
          <p className="text-sm text-gray-500">
            {entries.length === 0
              ? 'No BOE entries yet. Build your basis of estimate from the opportunity pricing page.'
              : 'No entries match your search.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/80">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">WBS</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Task</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">LCAT</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Period</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Hours</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Rate</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Extended</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Assumptions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filtered.map((entry) => (
                  <tr key={entry.id} className="transition-colors hover:bg-gray-800/30">
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs font-mono text-[#00E5FA]">
                      {entry.wbs_number ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-200 max-w-[200px] truncate">
                      {entry.task_description ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs text-gray-400">
                      {entry.labor_category_id
                        ? lcatMap[entry.labor_category_id] ?? entry.labor_category_id.slice(0, 8)
                        : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs text-gray-400">
                      {entry.period ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-sm text-gray-200">
                      {entry.total_hours?.toLocaleString() ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-xs text-gray-400">
                      {formatRate(entry.rate_used)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-sm font-medium text-gray-200">
                      {formatCurrency(entry.extended_cost)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 max-w-[160px] truncate" title={entry.assumptions ?? ''}>
                      {entry.assumptions ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-700 bg-gray-900/60">
                  <td colSpan={4} className="px-4 py-2.5 text-xs font-semibold uppercase text-gray-400">
                    Total
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-sm font-bold text-white">
                    {totalHours.toLocaleString()}
                  </td>
                  <td />
                  <td className="px-4 py-2.5 text-right font-mono text-sm font-bold text-[#00E5FA]">
                    {formatCurrency(totalCost)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
