'use client'

import { useState } from 'react'
import { FileText, Search, Tag, ExternalLink } from 'lucide-react'

interface Template {
  id: string
  template_name: string
  template_type: string
  category: string | null
  description: string | null
  file_url: string | null
  version: string | null
  tags: string[] | null
  updated_at: string | null
}

interface TemplateLibraryProps {
  templates: Template[]
}

const TEMPLATE_TYPES = [
  'proposal',
  'past_performance',
  'capability_statement',
  'org_chart',
  'cost_volume',
  'management_volume',
  'technical_volume',
] as const

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function typeColor(type: string): string {
  switch (type) {
    case 'proposal':
      return 'bg-primary/15 text-primary'
    case 'past_performance':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
    case 'cost_volume':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
    case 'technical_volume':
      return 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export function TemplateLibrary({ templates }: TemplateLibraryProps) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('All')

  const filtered = templates.filter((t) => {
    if (filterType !== 'All' && t.template_type !== filterType) return false
    if (
      search &&
      !t.template_name.toLowerCase().includes(search.toLowerCase()) &&
      !(t.description ?? '').toLowerCase().includes(search.toLowerCase())
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
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-[220px] rounded-md border border-border bg-background pl-7 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-8 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="All">All Types</option>
          {TEMPLATE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} template{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            {templates.length === 0
              ? 'No templates configured. Add templates in Admin settings.'
              : 'No templates match your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 flex-shrink-0 text-primary" />
                  <h3 className="text-sm font-medium text-foreground line-clamp-1">
                    {t.template_name}
                  </h3>
                </div>
                {t.file_url && (
                  <a
                    href={t.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                  </a>
                )}
              </div>

              {t.description && (
                <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                  {t.description}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${typeColor(
                    t.template_type
                  )}`}
                >
                  {t.template_type.replace(/_/g, ' ')}
                </span>
                {t.version && (
                  <span className="text-[10px] text-muted-foreground">
                    v{t.version}
                  </span>
                )}
              </div>

              {t.tags && t.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {(t.tags as string[]).slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-2 text-[10px] text-muted-foreground">
                Updated {formatDate(t.updated_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
