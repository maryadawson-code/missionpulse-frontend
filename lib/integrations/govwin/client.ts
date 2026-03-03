/**
 * GovWin IQ API Client
 *
 * OAuth connection to GovWin IQ for:
 * - Opportunity alerts (by NAICS, agency, set-aside, dollar threshold)
 * - Competitor tracking (known bidders per opportunity)
 * - Agency intel (budget forecasts, acquisition timelines, incumbents)
 *
 * Env vars: GOVWIN_CLIENT_ID, GOVWIN_CLIENT_SECRET, GOVWIN_REDIRECT_URI
 */
'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Config ──────────────────────────────────────────────────

const GOVWIN_CLIENT_ID = process.env.GOVWIN_CLIENT_ID ?? ''
const GOVWIN_CLIENT_SECRET = process.env.GOVWIN_CLIENT_SECRET ?? ''
const GOVWIN_REDIRECT_URI =
  process.env.GOVWIN_REDIRECT_URI ?? 'https://missionpulse.ai/api/integrations/govwin/callback'
const GOVWIN_BASE_URL =
  process.env.GOVWIN_BASE_URL ?? 'https://api.govwin.com/v2'
const GOVWIN_AUTH_URL =
  process.env.GOVWIN_AUTH_URL ?? 'https://auth.govwin.com/oauth2'

// ─── Types ───────────────────────────────────────────────────

export interface GovWinOpportunity {
  id: string
  title: string
  agency: string
  subAgency: string | null
  naicsCode: string | null
  setAside: string | null
  estimatedValue: number | null
  solicitationNumber: string | null
  dueDate: string | null
  description: string | null
  status: string
  competitors: GovWinCompetitor[]
  agencyIntel: GovWinAgencyIntel | null
}

export interface GovWinCompetitor {
  name: string
  isIncumbent: boolean
  winProbability: number | null
  source: string
}

export interface GovWinAgencyIntel {
  agencyName: string
  budgetForecast: number | null
  fiscalYear: string | null
  acquisitionTimeline: string | null
  incumbentContractor: string | null
  recompeteDate: string | null
}

export interface GovWinAlertFilters {
  naicsCodes?: string[]
  agencies?: string[]
  setAsides?: string[]
  minValue?: number
  maxValue?: number
  keywords?: string[]
}

interface GovWinTokens {
  access_token: string
  refresh_token: string
  expires_in: number
}

interface GovWinConnection {
  isConnected: boolean
  lastSync: string | null
  errorMessage: string | null
  alertCount: number
}

// ─── OAuth Flow ──────────────────────────────────────────────

/**
 * Generate the GovWin OAuth authorization URL.
 */
export async function getGovWinAuthUrl(): Promise<string> {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: GOVWIN_CLIENT_ID,
    redirect_uri: GOVWIN_REDIRECT_URI,
    scope: 'opportunities competitors agencies',
  })

  return `${GOVWIN_AUTH_URL}/authorize?${params.toString()}`
}

/**
 * Exchange an authorization code for tokens and store them.
 */
export async function exchangeGovWinCode(
  code: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) return { success: false, error: 'No company' }

  try {
    const tokenResponse = await fetch(`${GOVWIN_AUTH_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: GOVWIN_CLIENT_ID,
        client_secret: GOVWIN_CLIENT_SECRET,
        redirect_uri: GOVWIN_REDIRECT_URI,
      }),
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      return { success: false, error: `GovWin token exchange failed: ${error}` }
    }

    const tokens: GovWinTokens = await tokenResponse.json()

    await supabase.from('integrations').upsert(
      {
        provider: 'govwin',
        name: 'GovWin IQ',
        company_id: profile.company_id,
        status: 'active',
        credentials_encrypted: JSON.stringify({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: Date.now() + tokens.expires_in * 1000,
        }),
        config: JSON.parse(JSON.stringify({
          alert_filters: {},
          sync_enabled: true,
        })),
        error_message: null,
      },
      { onConflict: 'provider,company_id' }
    )

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Disconnect GovWin integration.
 */
export async function disconnectGovWin(): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) return { success: false, error: 'No company' }

  const { error } = await supabase
    .from('integrations')
    .update({
      status: 'inactive',
      credentials_encrypted: null,
      error_message: null,
    })
    .eq('provider', 'govwin')
    .eq('company_id', profile.company_id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Get current GovWin connection status.
 */
export async function getGovWinConnection(): Promise<GovWinConnection> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { isConnected: false, lastSync: null, errorMessage: null, alertCount: 0 }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id)
    return { isConnected: false, lastSync: null, errorMessage: null, alertCount: 0 }

  const { data: integration } = await supabase
    .from('integrations')
    .select('status, last_sync, error_message, config')
    .eq('provider', 'govwin')
    .eq('company_id', profile.company_id)
    .single()

  if (!integration)
    return { isConnected: false, lastSync: null, errorMessage: null, alertCount: 0 }

  const config = integration.config as Record<string, unknown> | null
  const alertCount = (config?.alert_count as number) ?? 0

  return {
    isConnected: integration.status === 'active',
    lastSync: integration.last_sync,
    errorMessage: integration.error_message,
    alertCount,
  }
}

// ─── API Methods ────────────────────────────────────────────

/**
 * Search GovWin IQ opportunities with filters.
 */
export async function searchGovWinOpportunities(
  filters: GovWinAlertFilters
): Promise<{ results: GovWinOpportunity[]; error?: string }> {
  const { token, instanceUrl, error } = await getCredentials()
  if (error || !token) return { results: [], error: error ?? 'Not connected' }

  try {
    const params = new URLSearchParams()
    if (filters.naicsCodes?.length) params.set('naics', filters.naicsCodes.join(','))
    if (filters.agencies?.length) params.set('agencies', filters.agencies.join(','))
    if (filters.setAsides?.length) params.set('setAsides', filters.setAsides.join(','))
    if (filters.minValue) params.set('minValue', String(filters.minValue))
    if (filters.maxValue) params.set('maxValue', String(filters.maxValue))
    if (filters.keywords?.length) params.set('q', filters.keywords.join(' '))
    params.set('limit', '50')

    const res = await fetch(
      `${instanceUrl}/opportunities?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      }
    )

    if (!res.ok) {
      return { results: [], error: `GovWin API returned ${res.status}` }
    }

    const data = (await res.json()) as { opportunities: GovWinOpportunity[] }
    return { results: data.opportunities ?? [] }
  } catch (err) {
    return {
      results: [],
      error: err instanceof Error ? err.message : 'Search failed',
    }
  }
}

/**
 * Get competitor tracking data for a specific opportunity.
 */
export async function getCompetitors(
  govwinId: string
): Promise<{ competitors: GovWinCompetitor[]; error?: string }> {
  const { token, instanceUrl, error } = await getCredentials()
  if (error || !token) return { competitors: [], error: error ?? 'Not connected' }

  try {
    const res = await fetch(
      `${instanceUrl}/opportunities/${govwinId}/competitors`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!res.ok) return { competitors: [], error: `API returned ${res.status}` }

    const data = (await res.json()) as { competitors: GovWinCompetitor[] }
    return { competitors: data.competitors ?? [] }
  } catch (err) {
    return {
      competitors: [],
      error: err instanceof Error ? err.message : 'Failed',
    }
  }
}

/**
 * Get agency intelligence for a specific agency.
 */
export async function getAgencyIntel(
  agencyName: string
): Promise<{ intel: GovWinAgencyIntel | null; error?: string }> {
  const { token, instanceUrl, error } = await getCredentials()
  if (error || !token) return { intel: null, error: error ?? 'Not connected' }

  try {
    const res = await fetch(
      `${instanceUrl}/agencies?name=${encodeURIComponent(agencyName)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!res.ok) return { intel: null, error: `API returned ${res.status}` }

    const data = (await res.json()) as { agency: GovWinAgencyIntel }
    return { intel: data.agency ?? null }
  } catch (err) {
    return {
      intel: null,
      error: err instanceof Error ? err.message : 'Failed',
    }
  }
}

/**
 * Import a GovWin opportunity into the MissionPulse pipeline.
 */
export async function importGovWinOpportunity(
  govwinOpp: GovWinOpportunity
): Promise<{ success: boolean; opportunityId?: string; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) return { success: false, error: 'No company' }

  // Check for duplicate
  const { data: existing } = await supabase
    .from('opportunities')
    .select('id')
    .eq('govwin_id', govwinOpp.id)
    .eq('company_id', profile.company_id)
    .maybeSingle()

  if (existing) {
    return { success: false, error: 'Already imported', opportunityId: existing.id }
  }

  const { data: created, error } = await supabase
    .from('opportunities')
    .insert({
      title: govwinOpp.title,
      company_id: profile.company_id,
      owner_id: user.id,
      agency: govwinOpp.agency,
      naics_code: govwinOpp.naicsCode,
      set_aside: govwinOpp.setAside,
      ceiling: govwinOpp.estimatedValue,
      solicitation_number: govwinOpp.solicitationNumber,
      due_date: govwinOpp.dueDate,
      description: govwinOpp.description,
      govwin_id: govwinOpp.id,
      status: 'active',
      phase: 'Long Range',
      deal_source: 'govwin',
      metadata: JSON.parse(JSON.stringify({
        govwin_competitors: govwinOpp.competitors,
        govwin_agency_intel: govwinOpp.agencyIntel,
        imported_at: new Date().toISOString(),
      })),
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  // Log to audit
  await supabase.from('audit_logs').insert({
    action: 'govwin_import',
    table_name: 'opportunities',
    record_id: created?.id ?? '',
    user_id: user.id,
    metadata: JSON.parse(JSON.stringify({
      govwin_id: govwinOpp.id,
      title: govwinOpp.title,
    })),
  })

  return { success: true, opportunityId: created?.id }
}

/**
 * Update alert filter configuration.
 */
export async function updateAlertFilters(
  filters: GovWinAlertFilters
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) return { success: false, error: 'No company' }

  const { data: integration } = await supabase
    .from('integrations')
    .select('config')
    .eq('provider', 'govwin')
    .eq('company_id', profile.company_id)
    .single()

  const existingConfig = (integration?.config as Record<string, unknown>) ?? {}

  const { error } = await supabase
    .from('integrations')
    .update({
      config: JSON.parse(JSON.stringify({
        ...existingConfig,
        alert_filters: filters,
      })),
    })
    .eq('provider', 'govwin')
    .eq('company_id', profile.company_id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ─── Helpers ────────────────────────────────────────────────

async function getCredentials(): Promise<{
  token: string | null
  instanceUrl: string
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { token: null, instanceUrl: '', error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) return { token: null, instanceUrl: '', error: 'No company' }

  const { data: integration } = await supabase
    .from('integrations')
    .select('credentials_encrypted')
    .eq('provider', 'govwin')
    .eq('company_id', profile.company_id)
    .single()

  if (!integration?.credentials_encrypted) {
    return { token: null, instanceUrl: '', error: 'GovWin not connected' }
  }

  const creds = JSON.parse(integration.credentials_encrypted) as {
    access_token: string
    expires_at: number
  }

  // Check token expiry (refresh would be handled by the cron sync)
  if (Date.now() > creds.expires_at) {
    return { token: null, instanceUrl: '', error: 'Token expired — sync will refresh' }
  }

  return { token: creds.access_token, instanceUrl: GOVWIN_BASE_URL }
}
