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
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search LCATs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-[200px] rounded-md border border-border bg-card pl-7 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={filterFamily}
          onChange={(e) => setFilterFamily(e.target.value)}
          className="h-8 rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="All">All Families</option>
          {families.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {categories.length} categories
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {categories.length === 0
              ? 'No labor categories configured. Add LCATs in Admin settings or import from a GSA schedule.'
              : 'No categories match your search.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-card/80">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Family
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Level / Title
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    GSA LCAT
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                    Level
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                    Yrs Exp
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
                    Rate Low
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
                    Rate High
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
                    Midpoint
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((cat) => {
                  const midpoint =
                    cat.bill_rate_low !== null && cat.bill_rate_high !== null
                      ? (cat.bill_rate_low + cat.bill_rate_high) / 2
                      : null
                  return (
                    <tr
                      key={cat.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-primary">
                        {cat.family}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-medium text-foreground">
                        {cat.level_name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                        {cat.gsa_lcat ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-center text-xs text-muted-foreground">
                        {cat.level ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-center text-xs text-muted-foreground">
                        {cat.years_experience !== null
                          ? `${cat.years_experience}+`
                          : '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">
                        {formatRate(cat.bill_rate_low)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">
                        {formatRate(cat.bill_rate_high)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-sm font-medium text-foreground">
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
