/**
 * Bloomberg Government API Client
 * Sprint 34 (T-34.1) — Phase L v2.0
 *
 * Fetches contract awards, agency budgets, competitive intel,
 * and market analytics from Bloomberg Government.
 *
 * © 2026 Mission Meets Tech
 */

import { createClient } from '@/lib/supabase/server'

// ─── Types ──────────────────────────────────────────────────────

export interface BloombergOpportunity {
  id: string
  title: string
  agency: string
  value: number | null
  postedDate: string
  dueDate: string | null
  naicsCode: string | null
  setAside: string | null
  status: string
  url: string
}

export interface BloombergAward {
  contractId: string
  title: string
  agency: string
  vendor: string
  value: number
  awardDate: string
  naicsCode: string | null
}

export interface BloombergBudgetItem {
  agency: string
  program: string
  fiscalYear: number
  amount: number
  change: number // year-over-year %
}

interface BloombergCredentials {
  api_key: string
  base_url: string
}

// ─── Helpers ────────────────────────────────────────────────────

async function getCredentials(companyId: string): Promise<BloombergCredentials | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('integrations')
    .select('credentials_encrypted')
    .eq('company_id', companyId)
    .eq('provider', 'bloomberg_gov')
    .eq('status', 'active')
    .single()

  if (!data?.credentials_encrypted) return null
  return JSON.parse(data.credentials_encrypted) as BloombergCredentials
}

async function bgRequest<T>(
  creds: BloombergCredentials,
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T | null> {
  const url = new URL(`${creds.base_url}${endpoint}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${creds.api_key}`,
      'Accept': 'application/json',
    },
  })

  if (!res.ok) return null
  return res.json() as Promise<T>
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Search Bloomberg Government for opportunities matching criteria.
 */
export async function searchOpportunities(
  companyId: string,
  query: { keyword?: string; agency?: string; naics?: string; limit?: number }
): Promise<BloombergOpportunity[]> {
  const creds = await getCredentials(companyId)
  if (!creds) return []

  const params: Record<string, string> = {}
  if (query.keyword) params.q = query.keyword
  if (query.agency) params.agency = query.agency
  if (query.naics) params.naics = query.naics
  params.limit = String(query.limit ?? 25)

  const data = await bgRequest<{ results: BloombergOpportunity[] }>(
    creds, '/opportunities/search', params
  )

  return data?.results ?? []
}

/**
 * Get recent contract awards from Bloomberg Government.
 */
export async function getRecentAwards(
  companyId: string,
  agency?: string
): Promise<BloombergAward[]> {
  const creds = await getCredentials(companyId)
  if (!creds) return []

  const params: Record<string, string> = { limit: '50' }
  if (agency) params.agency = agency

  const data = await bgRequest<{ awards: BloombergAward[] }>(
    creds, '/awards/recent', params
  )

  return data?.awards ?? []
}

/**
 * Get agency budget data for competitive analysis.
 */
export async function getAgencyBudgets(
  companyId: string,
  agency: string,
  fiscalYear?: number
): Promise<BloombergBudgetItem[]> {
  const creds = await getCredentials(companyId)
  if (!creds) return []

  const params: Record<string, string> = {
    agency,
    fy: String(fiscalYear ?? new Date().getFullYear()),
  }

  const data = await bgRequest<{ items: BloombergBudgetItem[] }>(
    creds, '/budgets', params
  )

  return data?.items ?? []
}

/**
 * Check if Bloomberg Government integration is configured.
 */
export async function isBloombergConfigured(companyId: string): Promise<boolean> {
  const creds = await getCredentials(companyId)
  return creds !== null
}
