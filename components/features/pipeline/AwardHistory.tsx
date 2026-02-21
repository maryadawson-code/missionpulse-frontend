'use client'

import { useState, useEffect, useTransition } from 'react'
import { Trophy, Building2, Calendar, DollarSign, Search, ChevronDown, ChevronUp, Users } from 'lucide-react'
import { type AwardSummary, type PrimeSub } from '@/lib/integrations/usaspending/client'

// ─── Types ───────────────────────────────────────────────────

interface AwardHistoryProps {
  agency: string | null
  naicsCode: string | null
  initialAwards?: AwardSummary[]
  initialRelationships?: PrimeSub[]
}

// ─── Component ───────────────────────────────────────────────

export function AwardHistory({
  agency,
  naicsCode,
  initialAwards = [],
  initialRelationships = [],
}: AwardHistoryProps) {
  const [awards, setAwards] = useState<AwardSummary[]>(initialAwards)
  const [relationships, setRelationships] = useState<PrimeSub[]>(initialRelationships)
  const [expandedAward, setExpandedAward] = useState<string | null>(null)
  const [showRelationships, setShowRelationships] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Load data on mount if not provided
  useEffect(() => {
    if (!agency || (initialAwards.length > 0 && initialRelationships.length > 0)) return

    startTransition(async () => {
      try {
        const { searchAwards, getPrimeSubRelationships } = await import(
          '@/lib/integrations/usaspending/client'
        )
        const [awardResult, relResult] = await Promise.all([
          searchAwards({ agency, naicsCode: naicsCode ?? undefined, limit: 10 }),
          getPrimeSubRelationships(agency, naicsCode ?? undefined),
        ])
        if (awardResult.error) setError(awardResult.error)
        setAwards(awardResult.awards)
        setRelationships(relResult.relationships)
      } catch {
        setError('Failed to load award history')
      }
    })
  }, [agency, naicsCode, initialAwards.length, initialRelationships.length])

  if (!agency) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 text-center">
        <Trophy className="mx-auto mb-2 h-8 w-8 text-gray-600" />
        <p className="text-sm text-gray-500">No agency specified — award history unavailable</p>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`
    return `$${amount.toLocaleString()}`
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-cyan-400" />
          <h3 className="font-semibold text-white">Award History</h3>
          <span className="text-xs text-gray-500">via USAspending.gov</span>
        </div>
        {relationships.length > 0 && (
          <button
            onClick={() => setShowRelationships(!showRelationships)}
            className="flex items-center gap-1 rounded-lg border border-gray-700 px-3 py-1 text-xs text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
          >
            <Users className="h-3 w-3" />
            {showRelationships ? 'Awards' : 'Prime/Sub Map'}
          </button>
        )}
      </div>

      {/* Loading */}
      {isPending && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-800/50" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-900/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Awards List */}
      {!isPending && !showRelationships && (
        <div className="space-y-2">
          {awards.length === 0 && !error && (
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 text-center">
              <Search className="mx-auto mb-2 h-6 w-6 text-gray-600" />
              <p className="text-sm text-gray-500">No awards found for this agency/NAICS</p>
            </div>
          )}

          {awards.map((award) => {
            const isExpanded = expandedAward === award.awardId
            return (
              <div
                key={award.awardId}
                className="rounded-lg border border-gray-800 bg-gray-900/50 transition-colors hover:border-gray-700"
              >
                <button
                  onClick={() => setExpandedAward(isExpanded ? null : award.awardId)}
                  className="flex w-full items-start justify-between p-3 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white truncate">
                        {award.recipientName}
                      </span>
                      <span className="shrink-0 rounded bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-400">
                        {formatCurrency(award.totalObligation)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {award.piid && <span>PIID: {award.piid}</span>}
                      <span>{award.awardType}</span>
                      {award.naicsCode && <span>NAICS: {award.naicsCode}</span>}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-500 shrink-0 mt-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500 shrink-0 mt-1" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-800 px-3 py-3 space-y-2">
                    {award.description && (
                      <p className="text-xs text-gray-400 line-clamp-3">{award.description}</p>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Building2 className="h-3 w-3" />
                        <span>{award.awardingAgency}</span>
                      </div>
                      {award.awardingSubAgency && (
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Building2 className="h-3 w-3" />
                          <span>{award.awardingSubAgency}</span>
                        </div>
                      )}
                      {award.startDate && (
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>Start: {award.startDate}</span>
                        </div>
                      )}
                      {award.endDate && (
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>End: {award.endDate}</span>
                        </div>
                      )}
                      {award.naicsDescription && (
                        <div className="col-span-2 flex items-center gap-1.5 text-gray-500">
                          <DollarSign className="h-3 w-3" />
                          <span>{award.naicsDescription}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Prime/Sub Relationships */}
      {!isPending && showRelationships && (
        <div className="space-y-2">
          {relationships.length === 0 && (
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 text-center">
              <Users className="mx-auto mb-2 h-6 w-6 text-gray-600" />
              <p className="text-sm text-gray-500">No prime/sub data available</p>
            </div>
          )}

          {relationships.map((rel) => (
            <div
              key={rel.primeName}
              className="rounded-lg border border-gray-800 bg-gray-900/50 p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">{rel.primeName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{rel.contractCount} contracts</span>
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                    {formatCurrency(rel.totalAmount)}
                  </span>
                </div>
              </div>
              {rel.subNames.length > 0 && (
                <div className="mt-2 border-t border-gray-800 pt-2">
                  <p className="text-xs text-gray-500 mb-1">Subcontractors:</p>
                  <div className="flex flex-wrap gap-1">
                    {rel.subNames.map((sub) => (
                      <span
                        key={sub}
                        className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
