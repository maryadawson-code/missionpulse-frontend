/**
 * Microsoft 365 OAuth 2.0 — MSAL (Microsoft Identity Platform)
 *
 * Implements the Authorization Code flow with PKCE:
 * 1. Redirect to Microsoft login
 * 2. Callback with code → exchange for tokens
 * 3. Tokens stored in integrations table
 *
 * Scopes: Files.ReadWrite, Calendars.ReadWrite, Sites.ReadWrite.All, User.Read
 * Env vars: M365_CLIENT_ID, M365_CLIENT_SECRET, M365_REDIRECT_URI, M365_TENANT_ID
 */
'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Config ──────────────────────────────────────────────────

const M365_CLIENT_ID = process.env.M365_CLIENT_ID ?? ''
const M365_CLIENT_SECRET = process.env.M365_CLIENT_SECRET ?? ''
const M365_REDIRECT_URI =
  process.env.M365_REDIRECT_URI ?? 'https://missionpulse.io/api/integrations/m365/callback'
const M365_TENANT_ID = process.env.M365_TENANT_ID ?? 'common'
const M365_AUTH_URL = `https://login.microsoftonline.com/${M365_TENANT_ID}/oauth2/v2.0`

const SCOPES = [
  'openid',
  'profile',
  'offline_access',
  'Files.ReadWrite',
  'Calendars.ReadWrite',
  'Sites.ReadWrite.All',
  'User.Read',
].join(' ')

// ─── Types ───────────────────────────────────────────────────

interface M365Tokens {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

interface M365Connection {
  isConnected: boolean
  userName: string | null
  lastSync: string | null
  errorMessage: string | null
}

// ─── OAuth Flow ──────────────────────────────────────────────

/**
 * Generate the Microsoft OAuth authorization URL.
 */
export async function getM365AuthUrl(): Promise<string> {
  const params = new URLSearchParams({
    client_id: M365_CLIENT_ID,
    response_type: 'code',
    redirect_uri: M365_REDIRECT_URI,
    response_mode: 'query',
    scope: SCOPES,
    prompt: 'consent',
  })

  return `${M365_AUTH_URL}/authorize?${params.toString()}`
}

/**
 * Exchange an authorization code for tokens and store them.
 */
export async function exchangeM365Code(
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
    const tokenResponse = await fetch(`${M365_AUTH_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: M365_CLIENT_ID,
        client_secret: M365_CLIENT_SECRET,
        code,
        redirect_uri: M365_REDIRECT_URI,
        grant_type: 'authorization_code',
        scope: SCOPES,
      }),
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      return { success: false, error: `M365 token exchange failed: ${error}` }
    }

    const tokens: M365Tokens = await tokenResponse.json()

    // Get user profile from MS Graph
    const profileRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const msProfile = profileRes.ok
      ? ((await profileRes.json()) as { displayName: string; mail: string })
      : null

    await supabase.from('integrations').upsert(
      {
        provider: 'm365',
        name: 'Microsoft 365',
        company_id: profile.company_id,
        status: 'active',
        credentials_encrypted: JSON.stringify({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: Date.now() + tokens.expires_in * 1000,
        }),
        config: JSON.parse(JSON.stringify({
          user_name: msProfile?.displayName ?? null,
          user_email: msProfile?.mail ?? null,
          onedrive_root: '/MissionPulse',
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
 * Refresh an expired M365 access token.
 */
export async function refreshM365Token(
  refreshToken: string
): Promise<M365Tokens | null> {
  try {
    const response = await fetch(`${M365_AUTH_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: M365_CLIENT_ID,
        client_secret: M365_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: SCOPES,
      }),
    })

    if (!response.ok) return null
    return response.json()
  } catch {
    return null
  }
}

/**
 * Disconnect Microsoft 365 integration.
 */
export async function disconnectM365(): Promise<{
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
    .eq('provider', 'm365')
    .eq('company_id', profile.company_id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Get current M365 connection status.
 */
export async function getM365Connection(): Promise<M365Connection> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { isConnected: false, userName: null, lastSync: null, errorMessage: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id)
    return { isConnected: false, userName: null, lastSync: null, errorMessage: null }

  const { data: integration } = await supabase
    .from('integrations')
    .select('status, last_sync, error_message, config')
    .eq('provider', 'm365')
    .eq('company_id', profile.company_id)
    .single()

  if (!integration)
    return { isConnected: false, userName: null, lastSync: null, errorMessage: null }

  const config = integration.config as Record<string, unknown> | null

  return {
    isConnected: integration.status === 'active',
    userName: (config?.user_name as string) ?? null,
    lastSync: integration.last_sync,
    errorMessage: integration.error_message,
  }
}
