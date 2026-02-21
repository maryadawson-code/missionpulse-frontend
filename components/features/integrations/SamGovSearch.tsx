'use client'

import { useState, useTransition } from 'react'
import { Loader2, Search, Download, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { addToast } from '@/components/ui/Toast'
import {
  searchSamGov,
  importSamOpportunity,
  type SamOpportunity,
} from '@/lib/integrations/sam-gov'

export function SamGovSearch() {
  const [isPending, startTransition] = useTransition()
  const [results, setResults] = useState<SamOpportunity[]>([])
  const [fromApi, setFromApi] = useState(false)
  const [searched, setSearched] = useState(false)
  const [importing, setImporting] = useState<string | null>(null)

  function handleSearch(formData: FormData) {
    const keyword = formData.get('keyword') as string
    const naicsCode = formData.get('naicsCode') as string

    startTransition(async () => {
      const response = await searchSamGov({
        keyword: keyword || undefined,
        naicsCode: naicsCode || undefined,
        limit: 25,
      })
      setResults(response.results)
      setFromApi(response.fromApi)
      setSearched(true)
    })
  }

  function handleImport(opp: SamOpportunity) {
    setImporting(opp.noticeId)
    startTransition(async () => {
      const result = await importSamOpportunity(opp)
      if (result.success) {
        addToast('success', `Imported: ${opp.title}`)
      } else {
        addToast('error', result.error ?? 'Import failed')
      }
      setImporting(null)
    })
  }

  return (
    <div className="space-y-4">
      {/* Search Form */}
      <form
        action={handleSearch}
        className="rounded-xl border border-border bg-card p-5 space-y-3"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Keyword Search
            </label>
            <input
              name="keyword"
              placeholder="e.g., IT support, healthcare"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              NAICS Code
            </label>
            <input
              name="naicsCode"
              placeholder="e.g., 541512"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search SAM.gov
            </Button>
          </div>
        </div>
      </form>

      {/* Source Indicator */}
      {searched && (
        <p className="text-xs text-muted-foreground">
          {fromApi
            ? `Showing ${results.length} results from SAM.gov API`
            : `Showing ${results.length} results from local database (SAM.gov API key not configured)`}
        </p>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {results.map((opp) => (
            <div key={opp.noticeId} className="px-5 py-4 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {opp.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {opp.department ?? opp.subtier ?? 'Unknown Agency'}
                    </span>
                    {opp.naicsCode && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        NAICS: {opp.naicsCode}
                      </span>
                    )}
                    {opp.setAside && (
                      <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300">
                        {opp.setAside}
                      </span>
                    )}
                    {opp.responseDeadLine && (
                      <span className="text-xs text-amber-400">
                        Due: {new Date(opp.responseDeadLine).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {opp.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {opp.description.slice(0, 200)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {opp.noticeId && (
                    <a
                      href={`https://sam.gov/opp/${opp.noticeId}/view`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-[#00E5FA]"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleImport(opp)}
                    disabled={isPending || importing === opp.noticeId}
                  >
                    {importing === opp.noticeId ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Download className="h-3 w-3" />
                    )}
                    Import
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {searched && results.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No opportunities found. Try broadening your search criteria.
        </div>
      )}
    </div>
  )
}
