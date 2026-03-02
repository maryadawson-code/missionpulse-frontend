/**
 * HubSpot OAuth 2.0
 *
 * Implements the Authorization Code flow:
 * 1. Redirect to HubSpot login
 * 2. Callback with code → exchange for tokens
 * 3. Tokens stored in integrations table
 *
 * Scopes: crm.objects.contacts.read, crm.objects.deals.read, crm.objects.deals.write
 * Env vars: HUBSPOT_CLIENT_ID, HUBSPOT_CLIENT_SECRET, HUBSPOT_REDIRECT_URI
 */
'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Config ──────────────────────────────────────────────────

const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID ?? ''
const HUBSPOT_CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET ?? ''
const HUBSPOT_REDIRECT_URI =
  process.env.HUBSPOT_REDIRECT_URI ?? 'https://missionpulse.ai/api/integrations/hubspot/callback'

const SCOPES = [
  'crm.objects.contacts.read',
  'crm.objects.deals.read',
  'crm.objects.deals.write',
  'crm.schemas.deals.read',
  'oauth',
].join(' ')

// ─── Types ───────────────────────────────────────────────────

interface HubSpotTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

interface HubSpotConnection {
  isConnected: boolean
  portalId: string | null
  lastSync: string | null
  errorMessage: string | null
}

// ─── OAuth Flow ──────────────────────────────────────────────

/**
 * Generate the HubSpot OAuth authorization URL.
 */
export async function getHubSpotAuthUrl(): Promise<string> {
  const params = new URLSearchParams({
    client_id: HUBSPOT_CLIENT_ID,
    redirect_uri: HUBSPOT_REDIRECT_URI,
    scope: SCOPES,
  })

  return `https://app.hubspot.com/oauth/authorize?${params.toString()}`
}

/**
 * Exchange an authorization code for tokens and store them.
 */
export async function exchangeHubSpotCode(
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
    const tokenResponse = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: HUBSPOT_CLIENT_ID,
        client_secret: HUBSPOT_CLIENT_SECRET,
        redirect_uri: HUBSPOT_REDIRECT_URI,
        code,
      }),
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      return { success: false, error: `HubSpot token exchange failed: ${error}` }
    }

    const tokens: HubSpotTokens = await tokenResponse.json()

    // Get portal info from access token info endpoint
    const infoRes = await fetch(
      `https://api.hubapi.com/oauth/v1/access-tokens/${tokens.access_token}`
    )
    const info = infoRes.ok
      ? ((await infoRes.json()) as { hub_id: number; user: string })
      : null

    await supabase.from('integrations').upsert(
      {
        provider: 'hubspot',
        name: 'HubSpot CRM',
        company_id: profile.company_id,
        status: 'active',
        credentials_encrypted: JSON.stringify({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: Date.now() + tokens.expires_in * 1000,
        }),
        config: JSON.parse(JSON.stringify({
          portal_id: info?.hub_id?.toString() ?? null,
          user_email: info?.user ?? null,
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
 * Refresh an expired HubSpot access token.
 */
export async function refreshHubSpotToken(
  refreshToken: string
): Promise<HubSpotTokens | null> {
  try {
    const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: HUBSPOT_CLIENT_ID,
        client_secret: HUBSPOT_CLIENT_SECRET,
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) return null
    return response.json()
  } catch {
    return null
  }
}

/**
 * Disconnect HubSpot integration.
 */
export async function disconnectHubSpot(): Promise<{
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
    .eq('provider', 'hubspot')
    .eq('company_id', profile.company_id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Get current HubSpot connection status.
 */
export async function getHubSpotConnection(): Promise<HubSpotConnection> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { isConnected: false, portalId: null, lastSync: null, errorMessage: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id)
    return { isConnected: false, portalId: null, lastSync: null, errorMessage: null }

  const { data: integration } = await supabase
    .from('integrations')
    .select('status, last_sync, error_message, config')
    .eq('provider', 'hubspot')
    .eq('company_id', profile.company_id)
    .single()

  if (!integration)
    return { isConnected: false, portalId: null, lastSync: null, errorMessage: null }

  const config = integration.config as Record<string, unknown> | null

  return {
    isConnected: integration.status === 'active',
    portalId: (config?.portal_id as string) ?? null,
    lastSync: integration.last_sync,
    errorMessage: integration.error_message,
  }
}
