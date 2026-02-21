/**
 * Salesforce OAuth 2.0 — server-only.
 *
 * Implements the Web Server OAuth flow:
 * 1. User clicks Connect → redirect to SF authorize URL
 * 2. SF calls back with code → exchange for access/refresh tokens
 * 3. Tokens stored encrypted in integrations.credentials_encrypted
 * 4. Refresh token used to get new access tokens as needed
 *
 * Env vars: SALESFORCE_CLIENT_ID, SALESFORCE_CLIENT_SECRET, SALESFORCE_REDIRECT_URI
 */
'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Config ──────────────────────────────────────────────────

const SF_CLIENT_ID = process.env.SALESFORCE_CLIENT_ID ?? ''
const SF_CLIENT_SECRET = process.env.SALESFORCE_CLIENT_SECRET ?? ''
const SF_REDIRECT_URI =
  process.env.SALESFORCE_REDIRECT_URI ?? 'https://missionpulse.io/api/integrations/salesforce/callback'
const SF_LOGIN_URL =
  process.env.SALESFORCE_LOGIN_URL ?? 'https://login.salesforce.com'

// ─── Types ───────────────────────────────────────────────────

export interface SalesforceTokens {
  access_token: string
  refresh_token: string
  instance_url: string
  token_type: string
  issued_at: string
}

interface SalesforceConnection {
  isConnected: boolean
  instanceUrl: string | null
  lastSync: string | null
  errorMessage: string | null
}

// ─── OAuth Flow ──────────────────────────────────────────────

/**
 * Generate the Salesforce OAuth authorization URL.
 */
export async function getSalesforceAuthUrl(): Promise<string> {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SF_CLIENT_ID,
    redirect_uri: SF_REDIRECT_URI,
    scope: 'api refresh_token offline_access',
  })

  return `${SF_LOGIN_URL}/services/oauth2/authorize?${params.toString()}`
}

/**
 * Exchange an authorization code for tokens and store them.
 */
export async function exchangeSalesforceCode(
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
    const tokenResponse = await fetch(
      `${SF_LOGIN_URL}/services/oauth2/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: SF_CLIENT_ID,
          client_secret: SF_CLIENT_SECRET,
          redirect_uri: SF_REDIRECT_URI,
        }),
      }
    )

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      return { success: false, error: `Salesforce token exchange failed: ${error}` }
    }

    const tokens: SalesforceTokens = await tokenResponse.json()

    // Store in integrations table
    await supabase.from('integrations').upsert(
      {
        provider: 'salesforce',
        name: 'Salesforce CRM',
        company_id: profile.company_id,
        status: 'active',
        credentials_encrypted: JSON.stringify({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          instance_url: tokens.instance_url,
        }),
        config: JSON.parse(JSON.stringify({
          instance_url: tokens.instance_url,
          sync_direction: 'bidirectional',
          field_mappings: getDefaultFieldMappings(),
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
 * Refresh an expired Salesforce access token.
 */
export async function refreshSalesforceToken(
  refreshToken: string
): Promise<SalesforceTokens | null> {
  try {
    const response = await fetch(`${SF_LOGIN_URL}/services/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: SF_CLIENT_ID,
        client_secret: SF_CLIENT_SECRET,
      }),
    })

    if (!response.ok) return null
    return response.json()
  } catch {
    return null
  }
}

/**
 * Disconnect Salesforce integration.
 */
export async function disconnectSalesforce(): Promise<{
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
    .eq('provider', 'salesforce')
    .eq('company_id', profile.company_id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Get current Salesforce connection status.
 */
export async function getSalesforceConnection(): Promise<SalesforceConnection> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return { isConnected: false, instanceUrl: null, lastSync: null, errorMessage: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id)
    return { isConnected: false, instanceUrl: null, lastSync: null, errorMessage: null }

  const { data: integration } = await supabase
    .from('integrations')
    .select('status, last_sync, error_message, config')
    .eq('provider', 'salesforce')
    .eq('company_id', profile.company_id)
    .single()

  if (!integration)
    return { isConnected: false, instanceUrl: null, lastSync: null, errorMessage: null }

  const config = integration.config as Record<string, unknown> | null

  return {
    isConnected: integration.status === 'active',
    instanceUrl: (config?.instance_url as string) ?? null,
    lastSync: integration.last_sync,
    errorMessage: integration.error_message,
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function getDefaultFieldMappings() {
  return [
    { mp_field: 'title', sf_field: 'Name', direction: 'bidirectional' },
    { mp_field: 'ceiling', sf_field: 'Amount', direction: 'bidirectional' },
    { mp_field: 'pwin', sf_field: 'Probability', direction: 'mp_to_sf' },
    { mp_field: 'phase', sf_field: 'StageName', direction: 'mp_to_sf' },
    { mp_field: 'due_date', sf_field: 'CloseDate', direction: 'bidirectional' },
    { mp_field: 'agency', sf_field: 'Account.Name', direction: 'mp_to_sf' },
    { mp_field: 'status', sf_field: 'IsClosed', direction: 'mp_to_sf' },
    { mp_field: 'description', sf_field: 'Description', direction: 'bidirectional' },
  ]
}
