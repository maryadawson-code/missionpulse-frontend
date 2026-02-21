/**
 * USAspending.gov API Client
 *
 * Pulls award history, prime/sub relationships, and spending trends.
 * Used to enrich opportunity records with historical award data.
 *
 * API docs: https://api.usaspending.gov
 * No API key required — public endpoints.
 */
'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Config ──────────────────────────────────────────────────

const API_BASE = 'https://api.usaspending.gov/api/v2'

// ─── Types ───────────────────────────────────────────────────

export interface AwardSummary {
  awardId: string
  piid: string | null
  recipientName: string
  awardingAgency: string
  awardingSubAgency: string | null
  totalObligation: number
  startDate: string | null
  endDate: string | null
  naicsCode: string | null
  naicsDescription: string | null
  awardType: string
  description: string | null
}

export interface SubAwardSummary {
  subAwardId: string
  subRecipientName: string
  amount: number
  description: string | null
  primeRecipientName: string
}

export interface SpendingTrend {
  fiscalYear: number
  totalObligation: number
  transactionCount: number
}

export interface PrimeSub {
  primeName: string
  subNames: string[]
  totalAmount: number
  contractCount: number
}

export interface AgencySpendingProfile {
  agencyName: string
  totalFY: number
  naicsBreakdown: Array<{
    naics: string
    description: string
    amount: number
  }>
  topRecipients: Array<{
    name: string
    amount: number
  }>
  yearOverYear: SpendingTrend[]
}

// ─── Award Search ───────────────────────────────────────────

/**
 * Search for awards by agency, NAICS, recipient, or keyword.
 */
export async function searchAwards(params: {
  agency?: string
  naicsCode?: string
  recipient?: string
  keyword?: string
  limit?: number
}): Promise<{ awards: AwardSummary[]; error?: string }> {
  try {
    const filters: Record<string, unknown>[] = []

    if (params.agency) {
      filters.push({
        field: 'awarding_agency__awarding_agency_name',
        operation: 'search',
        value: params.agency,
      })
    }

    if (params.naicsCode) {
      filters.push({
        field: 'naics_code__naics_code',
        operation: 'equals',
        value: params.naicsCode,
      })
    }

    if (params.recipient) {
      filters.push({
        field: 'recipient_name',
        operation: 'search',
        value: params.recipient,
      })
    }

    if (params.keyword) {
      filters.push({
        field: 'description',
        operation: 'search',
        value: params.keyword,
      })
    }

    const body = {
      filters,
      fields: [
        'Award ID',
        'Recipient Name',
        'Awarding Agency',
        'Awarding Sub Agency',
        'Award Amount',
        'Start Date',
        'End Date',
        'NAICS Code',
        'Award Type',
        'Description',
      ],
      limit: params.limit ?? 25,
      order: 'desc',
      sort: 'Award Amount',
      subawards: false,
    }

    const res = await fetch(`${API_BASE}/search/spending_by_award/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      return { awards: [], error: `USAspending API returned ${res.status}` }
    }

    const data = (await res.json()) as {
      results: Array<{
        'Award ID': string
        'internal_id': string
        'Recipient Name': string
        'Awarding Agency': string
        'Awarding Sub Agency': string
        'Award Amount': number
        'Start Date': string
        'End Date': string
        'NAICS Code': { code: string; description: string } | null
        'Award Type': string
        'Description': string
      }>
    }

    const awards: AwardSummary[] = (data.results ?? []).map((r) => ({
      awardId: r['Award ID'] ?? r.internal_id,
      piid: r['Award ID'],
      recipientName: r['Recipient Name'],
      awardingAgency: r['Awarding Agency'],
      awardingSubAgency: r['Awarding Sub Agency'] ?? null,
      totalObligation: r['Award Amount'] ?? 0,
      startDate: r['Start Date'] ?? null,
      endDate: r['End Date'] ?? null,
      naicsCode: r['NAICS Code']?.code ?? null,
      naicsDescription: r['NAICS Code']?.description ?? null,
      awardType: r['Award Type'] ?? 'Unknown',
      description: r['Description'] ?? null,
    }))

    return { awards }
  } catch (err) {
    return {
      awards: [],
      error: err instanceof Error ? err.message : 'Search failed',
    }
  }
}

/**
 * Get spending trends by agency + NAICS over the past 5 years.
 */
export async function getSpendingTrends(
  agency: string,
  naicsCode?: string
): Promise<{ trends: SpendingTrend[]; error?: string }> {
  try {
    const filters: Record<string, unknown>[] = [
      {
        field: 'awarding_agency__awarding_agency_name',
        operation: 'search',
        value: agency,
      },
    ]

    if (naicsCode) {
      filters.push({
        field: 'naics_code__naics_code',
        operation: 'equals',
        value: naicsCode,
      })
    }

    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

    const trends: SpendingTrend[] = []

    for (const year of years) {
      const body = {
        group: 'fiscal_year',
        filters: [
          ...filters,
          {
            field: 'time_period',
            operation: 'fy',
            value: year,
          },
        ],
      }

      const res = await fetch(`${API_BASE}/search/spending_by_award_count/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      })

      if (res.ok) {
        const data = (await res.json()) as {
          results: { aggregated_amount: number; count: number }
        }
        trends.push({
          fiscalYear: year,
          totalObligation: data.results?.aggregated_amount ?? 0,
          transactionCount: data.results?.count ?? 0,
        })
      }
    }

    return { trends }
  } catch (err) {
    return {
      trends: [],
      error: err instanceof Error ? err.message : 'Trends query failed',
    }
  }
}

/**
 * Get prime/sub relationships for an agency + NAICS.
 */
export async function getPrimeSubRelationships(
  agency: string,
  naicsCode?: string
): Promise<{ relationships: PrimeSub[]; error?: string }> {
  try {
    const filters: Record<string, unknown>[] = [
      {
        field: 'awarding_agency__awarding_agency_name',
        operation: 'search',
        value: agency,
      },
    ]

    if (naicsCode) {
      filters.push({
        field: 'naics_code__naics_code',
        operation: 'equals',
        value: naicsCode,
      })
    }

    const body = {
      filters,
      limit: 20,
      order: 'desc',
      sort: 'Award Amount',
      subawards: true,
    }

    const res = await fetch(`${API_BASE}/search/spending_by_award/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) return { relationships: [], error: `API returned ${res.status}` }

    const data = (await res.json()) as {
      results: Array<{
        'Recipient Name': string
        'Award Amount': number
        'Sub-Award Recipients': string[]
      }>
    }

    // Aggregate prime/sub relationships
    const primeMap = new Map<string, PrimeSub>()

    for (const r of data.results ?? []) {
      const prime = r['Recipient Name']
      const existing = primeMap.get(prime) ?? {
        primeName: prime,
        subNames: [],
        totalAmount: 0,
        contractCount: 0,
      }

      existing.totalAmount += r['Award Amount'] ?? 0
      existing.contractCount++
      if (r['Sub-Award Recipients']) {
        for (const sub of r['Sub-Award Recipients']) {
          if (!existing.subNames.includes(sub)) {
            existing.subNames.push(sub)
          }
        }
      }

      primeMap.set(prime, existing)
    }

    return { relationships: Array.from(primeMap.values()) }
  } catch (err) {
    return {
      relationships: [],
      error: err instanceof Error ? err.message : 'Failed',
    }
  }
}

/**
 * Auto-enrich an opportunity with USAspending data.
 * Called in the background when an opportunity is created.
 */
export async function enrichOpportunityWithAwardData(
  opportunityId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: opp } = await supabase
    .from('opportunities')
    .select('agency, naics_code, metadata')
    .eq('id', opportunityId)
    .single()

  if (!opp?.agency) return { success: false, error: 'No agency on opportunity' }

  const [awardResult, trendResult] = await Promise.all([
    searchAwards({ agency: opp.agency, naicsCode: opp.naics_code ?? undefined, limit: 10 }),
    getSpendingTrends(opp.agency, opp.naics_code ?? undefined),
  ])

  const existingMeta = (opp.metadata as Record<string, unknown>) ?? {}

  await supabase
    .from('opportunities')
    .update({
      metadata: JSON.parse(JSON.stringify({
        ...existingMeta,
        usaspending: {
          recent_awards: awardResult.awards.slice(0, 5),
          spending_trends: trendResult.trends,
          enriched_at: new Date().toISOString(),
        },
      })),
    })
    .eq('id', opportunityId)

  return { success: true }
}
