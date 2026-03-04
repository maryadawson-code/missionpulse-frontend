/**
 * Federal Opportunity Aggregator — Multi-Source Search
 * Sprint 34 (T-34.2) — Phase L v2.0
 *
 * Unified search across SAM.gov, GovWin, and Bloomberg Government.
 * Normalizes results into a common format for the pipeline.
 *
 * © 2026 Mission Meets Tech
 */

import { createClient } from '@/lib/supabase/server'

// ─── Types ──────────────────────────────────────────────────────

export interface FederalSearchResult {
  source: 'sam_gov' | 'govwin' | 'bloomberg_gov'
  externalId: string
  title: string
  agency: string
  postedDate: string | null
  dueDate: string | null
  value: number | null
  naicsCode: string | null
  setAside: string | null
  url: string | null
  status: string
}

export interface AggregatorSearchQuery {
  keyword?: string
  agency?: string
  naicsCode?: string
  setAside?: string
  minValue?: number
  maxValue?: number
  sources?: ('sam_gov' | 'govwin' | 'bloomberg_gov')[]
  limit?: number
}

export interface AggregatorSearchResponse {
  results: FederalSearchResult[]
  totalBySource: Record<string, number>
  searchedAt: string
}

// ─── Source Adapters ────────────────────────────────────────────

async function searchSamGov(
  query: AggregatorSearchQuery
): Promise<FederalSearchResult[]> {
  // SAM.gov public API
  const params = new URLSearchParams()
  if (query.keyword) params.set('q', query.keyword)
  if (query.agency) params.set('agency', query.agency)
  if (query.naicsCode) params.set('naics', query.naicsCode)
  params.set('limit', String(query.limit ?? 25))
  params.set('api_key', process.env.SAM_GOV_API_KEY ?? '')

  const url = `https://api.sam.gov/opportunities/v2/search?${params.toString()}`
  const res = await fetch(url, { next: { revalidate: 300 } })

  if (!res.ok) return []

  const data = await res.json() as {
    opportunitiesData?: Array<{
      noticeId: string
      title: string
      department: string
      postedDate: string
      responseDeadLine: string | null
      naicsCode: string | null
      typeOfSetAside: string | null
      uiLink: string
    }>
  }

  return (data.opportunitiesData ?? []).map(opp => ({
    source: 'sam_gov' as const,
    externalId: opp.noticeId,
    title: opp.title,
    agency: opp.department,
    postedDate: opp.postedDate,
    dueDate: opp.responseDeadLine,
    value: null,
    naicsCode: opp.naicsCode,
    setAside: opp.typeOfSetAside,
    url: opp.uiLink,
    status: 'active',
  }))
}

async function searchGovWin(
  companyId: string,
  query: AggregatorSearchQuery
): Promise<FederalSearchResult[]> {
  const supabase = await createClient()

  const { data: integration } = await supabase
    .from('integrations')
    .select('credentials_encrypted')
    .eq('company_id', companyId)
    .eq('provider', 'govwin')
    .eq('status', 'active')
    .single()

  if (!integration?.credentials_encrypted) return []

  const creds = JSON.parse(integration.credentials_encrypted) as {
    api_key: string
    base_url: string
  }

  const params = new URLSearchParams()
  if (query.keyword) params.set('q', query.keyword)
  if (query.agency) params.set('agency', query.agency)
  params.set('limit', String(query.limit ?? 25))

  const res = await fetch(`${creds.base_url}/opportunities?${params.toString()}`, {
    headers: { 'Authorization': `Bearer ${creds.api_key}` },
  })

  if (!res.ok) return []

  const data = await res.json() as {
    results?: Array<{
      id: string
      title: string
      agency: string
      posted_date: string | null
      due_date: string | null
      value: number | null
      naics: string | null
      set_aside: string | null
      url: string | null
    }>
  }

  return (data.results ?? []).map(opp => ({
    source: 'govwin' as const,
    externalId: opp.id,
    title: opp.title,
    agency: opp.agency,
    postedDate: opp.posted_date,
    dueDate: opp.due_date,
    value: opp.value,
    naicsCode: opp.naics,
    setAside: opp.set_aside,
    url: opp.url,
    status: 'active',
  }))
}

async function searchBloomberg(
  companyId: string,
  query: AggregatorSearchQuery
): Promise<FederalSearchResult[]> {
  const supabase = await createClient()

  const { data: integration } = await supabase
    .from('integrations')
    .select('credentials_encrypted')
    .eq('company_id', companyId)
    .eq('provider', 'bloomberg_gov')
    .eq('status', 'active')
    .single()

  if (!integration?.credentials_encrypted) return []

  const creds = JSON.parse(integration.credentials_encrypted) as {
    api_key: string
    base_url: string
  }

  const params = new URLSearchParams()
  if (query.keyword) params.set('q', query.keyword)
  if (query.agency) params.set('agency', query.agency)
  params.set('limit', String(query.limit ?? 25))

  const res = await fetch(`${creds.base_url}/opportunities/search?${params.toString()}`, {
    headers: { 'Authorization': `Bearer ${creds.api_key}` },
  })

  if (!res.ok) return []

  const data = await res.json() as {
    results?: Array<{
      id: string
      title: string
      agency: string
      postedDate: string
      dueDate: string | null
      value: number | null
      naicsCode: string | null
      setAside: string | null
      url: string
      status: string
    }>
  }

  return (data.results ?? []).map(opp => ({
    source: 'bloomberg_gov' as const,
    externalId: opp.id,
    title: opp.title,
    agency: opp.agency,
    postedDate: opp.postedDate,
    dueDate: opp.dueDate,
    value: opp.value,
    naicsCode: opp.naicsCode,
    setAside: opp.setAside,
    url: opp.url,
    status: opp.status,
  }))
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Search all configured federal opportunity sources in parallel.
 */
export async function federalSearch(
  companyId: string,
  query: AggregatorSearchQuery
): Promise<AggregatorSearchResponse> {
  const sources = query.sources ?? ['sam_gov', 'govwin', 'bloomberg_gov']
  const allResults: FederalSearchResult[] = []

  const searches = sources.map(async (source) => {
    switch (source) {
      case 'sam_gov':
        return searchSamGov(query)
      case 'govwin':
        return searchGovWin(companyId, query)
      case 'bloomberg_gov':
        return searchBloomberg(companyId, query)
    }
  })

  const settled = await Promise.allSettled(searches)
  settled.forEach(result => {
    if (result.status === 'fulfilled') {
      allResults.push(...result.value)
    }
  })

  // Deduplicate by title similarity
  const seen = new Set<string>()
  const deduped = allResults.filter(r => {
    const key = `${r.title.toLowerCase().trim()}::${r.agency.toLowerCase().trim()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const totalBySource: Record<string, number> = {}
  deduped.forEach(r => {
    totalBySource[r.source] = (totalBySource[r.source] ?? 0) + 1
  })

  return {
    results: deduped,
    totalBySource,
    searchedAt: new Date().toISOString(),
  }
}

/**
 * Import a federal search result into the MissionPulse pipeline.
 */
export async function importTooPipeline(
  companyId: string,
  result: FederalSearchResult
): Promise<{ success: boolean; opportunityId?: string; error?: string }> {
  const supabase = await createClient()

  // Check for duplicate
  const { data: existing } = await supabase
    .from('opportunities')
    .select('id')
    .eq('company_id', companyId)
    .eq('title', result.title)
    .eq('agency', result.agency)
    .single()

  if (existing) {
    return { success: false, error: 'Opportunity already exists in pipeline' }
  }

  const { data, error } = await supabase
    .from('opportunities')
    .insert({
      company_id: companyId,
      title: result.title,
      agency: result.agency,
      due_date: result.dueDate,
      ceiling: result.value,
      naics_code: result.naicsCode,
      set_aside: result.setAside,
      status: 'identified',
      deal_source: result.source,
      metadata: JSON.parse(JSON.stringify({
        external_id: result.externalId,
        external_url: result.url,
        imported_at: new Date().toISOString(),
      })),
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, opportunityId: data?.id }
}
