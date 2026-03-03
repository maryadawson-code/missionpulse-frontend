/**
 * Google Workspace OAuth 2.0
 *
 * Implements Authorization Code flow for Google APIs:
 * 1. Redirect to Google consent screen
 * 2. Callback with code → exchange for tokens
 * 3. Tokens stored in integrations table
 *
 * Scopes: Drive, Calendar, Gmail send
 * Env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
 */
'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Config ──────────────────────────────────────────────────

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? ''
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ?? 'https://missionpulse.ai/api/integrations/google/callback'

const SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.send',
].join(' ')

// ─── Types ───────────────────────────────────────────────────

interface GoogleTokens {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
}

interface GoogleUserInfo {
  sub: string
  name: string
  email: string
  picture?: string
}

interface GoogleConnection {
  isConnected: boolean
  userName: string | null
  userEmail: string | null
  lastSync: string | null
  errorMessage: string | null
}

// ─── OAuth Flow ──────────────────────────────────────────────

/**
 * Generate the Google OAuth authorization URL.
 */
export async function getGoogleAuthUrl(): Promise<string> {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

/**
 * Exchange authorization code for tokens and save to integrations table.
 */
export async function exchangeGoogleCode(
  code: string,
  userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      return { success: false, error: `Token exchange failed: ${err}` }
    }

    const tokens = (await tokenRes.json()) as GoogleTokens

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      signal: AbortSignal.timeout(10000),
    })

    let userName = 'Google User'
    let userEmail = ''
    if (userRes.ok) {
      const user = (await userRes.json()) as GoogleUserInfo
      userName = user.name
      userEmail = user.email
    }

    // Save to integrations table
    const supabase = await createClient()
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    await supabase.from('integrations').upsert(
      {
        company_id: companyId,
        name: 'Google Workspace',
        provider: 'google',
        status: 'active',
        credentials_encrypted: JSON.stringify({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt,
        }),
        config: JSON.parse(JSON.stringify({
          user_name: userName,
          user_email: userEmail,
          scopes: SCOPES,
          connected_at: new Date().toISOString(),
          connected_by: userId,
        })),
        last_sync: new Date().toISOString(),
      },
      { onConflict: 'company_id,provider' }
    )

    // Audit log
    await supabase.from('audit_logs').insert({
      action: 'integration_connect',
      table_name: 'integrations',
      record_id: `google:${companyId}`,
      user_id: userId,
      new_values: JSON.parse(JSON.stringify({ provider: 'google', user_email: userEmail })),
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed' }
  }
}

/**
 * Refresh an expired access token.
 */
export async function refreshGoogleToken(companyId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data: integration } = await supabase
    .from('integrations')
    .select('credentials_encrypted')
    .eq('company_id', companyId)
    .eq('provider', 'google')
    .single()

  if (!integration?.credentials_encrypted) return null

  const creds = JSON.parse(integration.credentials_encrypted) as {
    access_token: string
    refresh_token?: string
    expires_at: string
  }

  // Check if token is still valid
  if (new Date(creds.expires_at) > new Date()) {
    return creds.access_token
  }

  if (!creds.refresh_token) return null

  // Refresh
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: creds.refresh_token,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) return null

  const tokens = (await res.json()) as GoogleTokens
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  await supabase
    .from('integrations')
    .update({
      credentials_encrypted: JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: creds.refresh_token, // Google doesn't always return a new refresh token
        expires_at: expiresAt,
      }),
      last_sync: new Date().toISOString(),
    })
    .eq('company_id', companyId)
    .eq('provider', 'google')

  return tokens.access_token
}

/**
 * Disconnect Google integration.
 */
export async function disconnectGoogle(
  companyId: string,
  userId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient()

  await supabase
    .from('integrations')
    .update({ status: 'inactive', credentials_encrypted: null })
    .eq('company_id', companyId)
    .eq('provider', 'google')

  await supabase.from('audit_logs').insert({
    action: 'integration_disconnect',
    table_name: 'integrations',
    record_id: `google:${companyId}`,
    user_id: userId,
  })

  return { success: true }
}

/**
 * Get Google connection status.
 */
export async function getGoogleConnectionStatus(companyId: string): Promise<GoogleConnection> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('integrations')
    .select('status, config, last_sync')
    .eq('company_id', companyId)
    .eq('provider', 'google')
    .single()

  if (!data || data.status !== 'active') {
    return { isConnected: false, userName: null, userEmail: null, lastSync: null, errorMessage: null }
  }

  const config = data.config as Record<string, unknown> | null

  return {
    isConnected: true,
    userName: (config?.user_name as string) ?? null,
    userEmail: (config?.user_email as string) ?? null,
    lastSync: data.last_sync,
    errorMessage: null,
  }
}
