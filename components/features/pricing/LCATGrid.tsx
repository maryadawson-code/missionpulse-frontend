'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

interface LaborCategory {
  id: string
  family: string
  level_name: string
  level: number | null
  gsa_lcat: string | null
  bill_rate_low: number | null
  bill_rate_high: number | null
  years_experience: number | null
}

interface LCATGridProps {
  categories: LaborCategory[]
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

export function LCATGrid({ categories }: LCATGridProps) {
  const [search, setSearch] = useState('')
  const [filterFamily, setFilterFamily] = useState<string>('All')

  const families = Array.from(new Set(categories.map((c) => c.family))).sort()

  const filtered = categories.filter((c) => {
    if (filterFamily !== 'All' && c.family !== filterFamily) return false
    if (
      search &&
      !c.family.toLowerCase().includes(search.toLowerCase()) &&
      !c.level_name.toLowerCase().includes(search.toLowerCase()) &&
      !(c.gsa_lcat ?? '').toLowerCase().includes(search.toLowerCase())
    )
      return false
    return true
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search LCATs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-[200px] rounded-md border border-gray-700 bg-gray-900 pl-7 pr-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#00E5FA]"
          />
        </div>
        <select
          value={filterFamily}
          onChange={(e) => setFilterFamily(e.target.value)}
          className="h-8 rounded-md border border-gray-700 bg-gray-900 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00E5FA]"
        >
          <option value="All">All Families</option>
          {families.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <span className="ml-auto text-xs text-gray-500">
          {filtered.length} of {categories.length} categories
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-800 p-8 text-center">
          <p className="text-sm text-gray-500">
            {categories.length === 0
              ? 'No labor categories configured. Add LCATs in Admin settings or import from a GSA schedule.'
              : 'No categories match your search.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/80">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Family
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Level / Title
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    GSA LCAT
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">
                    Level
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">
                    Yrs Exp
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">
                    Rate Low
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">
                    Rate High
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">
                    Midpoint
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filtered.map((cat) => {
                  const midpoint =
                    cat.bill_rate_low !== null && cat.bill_rate_high !== null
                      ? (cat.bill_rate_low + cat.bill_rate_high) / 2
                      : null
                  return (
                    <tr
                      key={cat.id}
                      className="transition-colors hover:bg-gray-800/30"
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-[#00E5FA]">
                        {cat.family}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-200">
                        {cat.level_name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-gray-400">
                        {cat.gsa_lcat ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-center text-xs text-gray-400">
                        {cat.level ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-center text-xs text-gray-400">
                        {cat.years_experience !== null
                          ? `${cat.years_experience}+`
                          : '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-xs text-gray-300">
                        {formatRate(cat.bill_rate_low)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-xs text-gray-300">
                        {formatRate(cat.bill_rate_high)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-sm font-medium text-gray-200">
                        {formatRate(midpoint)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
