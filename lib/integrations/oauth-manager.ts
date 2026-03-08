/**
 * Unified OAuth Manager — Per-user token storage and retrieval.
 *
 * Supports: microsoft365, google, slack, hubspot, salesforce, docusign
 * All tokens stored in user_oauth_tokens with RLS (users own their tokens).
 */
import { createClient } from '@/lib/supabase/server'

// ─── Types ──────────────────────────────────────────────────

export type OAuthProvider =
  | 'microsoft365'
  | 'google'
  | 'slack'
  | 'hubspot'
  | 'salesforce'
  | 'docusign'

export const OAUTH_PROVIDERS: OAuthProvider[] = [
  'microsoft365',
  'google',
  'slack',
  'hubspot',
  'salesforce',
  'docusign',
]

interface OAuthConfig {
  clientId: string
  clientSecret: string
  authUrl: string
  tokenUrl: string
  scopes: string
  scopeSeparator: ' ' | ','
  extraAuthParams?: Record<string, string>
  /** Slack-specific: bot-level scopes sent as `scope` param */
  botScopes?: string
  /** Slack-specific: user-level scopes sent as `user_scope` param */
  userScopes?: string
}

export interface UserConnection {
  provider: OAuthProvider
  provider_email: string | null
  connected_at: string
}

// ─── Provider Configs ───────────────────────────────────────

function getOAuthConfig(provider: OAuthProvider): OAuthConfig {
  switch (provider) {
    case 'microsoft365': {
      const tenantId = process.env.MICROSOFT_TENANT_ID ?? process.env.M365_TENANT_ID ?? 'common'
      return {
        clientId: process.env.MICROSOFT_CLIENT_ID ?? process.env.M365_CLIENT_ID ?? '',
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET ?? process.env.M365_CLIENT_SECRET ?? '',
        authUrl: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
        tokenUrl: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        scopes: 'openid email profile offline_access User.Read Files.ReadWrite Calendars.ReadWrite Mail.ReadWrite Sites.ReadWrite.All Contacts.Read Tasks.ReadWrite',
        scopeSeparator: ' ',
      }
    }
    case 'google':
      return {
        clientId: process.env.GOOGLE_CLIENT_ID ?? '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scopes: 'openid email profile https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar',
        scopeSeparator: ' ',
        extraAuthParams: { access_type: 'offline', prompt: 'consent' },
      }
    case 'slack':
      return {
        clientId: process.env.SLACK_CLIENT_ID ?? '',
        clientSecret: process.env.SLACK_CLIENT_SECRET ?? '',
        authUrl: 'https://slack.com/oauth/v2/authorize',
        tokenUrl: 'https://slack.com/api/oauth.v2.access',
        scopes: 'channels:read,chat:write,users:read,users:read.email,team:read',
        scopeSeparator: ',',
        botScopes: 'channels:read,chat:write,users:read,users:read.email,team:read',
        userScopes: 'identity.basic,identity.email',
      }
    case 'hubspot':
      return {
        clientId: process.env.HUBSPOT_CLIENT_ID ?? '',
        clientSecret: process.env.HUBSPOT_CLIENT_SECRET ?? '',
        authUrl: 'https://app.hubspot.com/oauth/authorize',
        tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
        scopes: 'crm.objects.deals.read crm.objects.deals.write',
        scopeSeparator: ' ',
      }
    case 'salesforce':
      return {
        clientId: process.env.SALESFORCE_CLIENT_ID ?? '',
        clientSecret: process.env.SALESFORCE_CLIENT_SECRET ?? '',
        authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
        tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
        scopes: 'api refresh_token offline_access',
        scopeSeparator: ' ',
      }
    case 'docusign':
      return {
        clientId: process.env.DOCUSIGN_CLIENT_ID ?? '',
        clientSecret: process.env.DOCUSIGN_CLIENT_SECRET ?? '',
        authUrl: 'https://account.docusign.com/oauth/auth',
        tokenUrl: 'https://account.docusign.com/oauth/token',
        scopes: 'signature extended',
        scopeSeparator: ' ',
      }
  }
}

// ─── Authorization URL ──────────────────────────────────────

export async function buildAuthorizationUrl(
  provider: OAuthProvider,
  state: string,
  baseUrl: string
): Promise<string> {
  const config = getOAuthConfig(provider)
  const redirectUri = `${baseUrl}/api/oauth/${provider}/callback`

  const params: Record<string, string> = {
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    state,
  }

  // Slack uses separate `scope` (bot) and `user_scope` (user) params
  if (provider === 'slack') {
    params.scope = config.botScopes ?? config.scopes
    if (config.userScopes) {
      params.user_scope = config.userScopes
    }
  } else {
    params.scope = config.scopes
  }

  if (config.extraAuthParams) {
    Object.assign(params, config.extraAuthParams)
  }

  const searchParams = new URLSearchParams(params)
  return `${config.authUrl}?${searchParams.toString()}`
}

// ─── Token Exchange ─────────────────────────────────────────

export interface TokenExchangeResult {
  accessToken: string
  refreshToken: string | null
  expiresIn: number | null
  scope: string | null
  rawResponse: Record<string, unknown>
}

export async function exchangeCodeForTokens(
  provider: OAuthProvider,
  code: string,
  baseUrl: string
): Promise<TokenExchangeResult> {
  const config = getOAuthConfig(provider)
  const redirectUri = `${baseUrl}/api/oauth/${provider}/callback`

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Token exchange failed (${response.status}): ${text}`)
  }

  const data = (await response.json()) as Record<string, unknown>

  // Slack nests user tokens differently
  if (provider === 'slack') {
    const authedUser = data.authed_user as Record<string, unknown> | undefined
    return {
      accessToken: (authedUser?.access_token as string) ?? '',
      refreshToken: (authedUser?.refresh_token as string) ?? null,
      expiresIn: (authedUser?.expires_in as number) ?? null,
      scope: (authedUser?.scope as string) ?? null,
      rawResponse: data,
    }
  }

  return {
    accessToken: (data.access_token as string) ?? '',
    refreshToken: (data.refresh_token as string) ?? null,
    expiresIn: (data.expires_in as number) ?? null,
    scope: (data.scope as string) ?? null,
    rawResponse: data,
  }
}

// ─── Provider User Info ─────────────────────────────────────

export async function fetchProviderUserInfo(
  provider: OAuthProvider,
  accessToken: string
): Promise<{ email: string | null; userId: string | null }> {
  try {
    switch (provider) {
      case 'microsoft365': {
        const res = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(10000),
        })
        if (!res.ok) return { email: null, userId: null }
        const user = (await res.json()) as { mail?: string; userPrincipalName?: string; id?: string }
        return { email: user.mail ?? user.userPrincipalName ?? null, userId: user.id ?? null }
      }
      case 'google': {
        const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(10000),
        })
        if (!res.ok) return { email: null, userId: null }
        const user = (await res.json()) as { email?: string; id?: string }
        return { email: user.email ?? null, userId: user.id ?? null }
      }
      case 'slack': {
        // Use auth.test with bot token to get user_id and team info
        const res = await fetch('https://slack.com/api/auth.test', {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(10000),
        })
        if (!res.ok) return { email: null, userId: null }
        const data = (await res.json()) as { ok: boolean; user_id?: string; user?: string; team?: string }
        // Email comes from the authed_user in the token response (handled in callback)
        return { email: null, userId: data.user_id ?? null }
      }
      case 'hubspot': {
        const res = await fetch(`https://api.hubapi.com/oauth/v1/access-tokens/${accessToken}`, {
          signal: AbortSignal.timeout(10000),
        })
        if (!res.ok) return { email: null, userId: null }
        const data = (await res.json()) as { user?: string; user_id?: number }
        return { email: data.user ?? null, userId: data.user_id?.toString() ?? null }
      }
      case 'salesforce': {
        // Salesforce returns id_token or we can call the userinfo endpoint
        const res = await fetch('https://login.salesforce.com/services/oauth2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(10000),
        })
        if (!res.ok) return { email: null, userId: null }
        const data = (await res.json()) as { email?: string; sub?: string }
        return { email: data.email ?? null, userId: data.sub ?? null }
      }
      case 'docusign': {
        const res = await fetch('https://account.docusign.com/oauth/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(10000),
        })
        if (!res.ok) return { email: null, userId: null }
        const data = (await res.json()) as { email?: string; sub?: string }
        return { email: data.email ?? null, userId: data.sub ?? null }
      }
    }
  } catch {
    return { email: null, userId: null }
  }
}

// ─── Token CRUD ─────────────────────────────────────────────

export async function upsertUserToken(params: {
  userId: string
  provider: OAuthProvider
  accessToken: string
  refreshToken: string | null
  expiresAt: string | null
  scope: string | null
  providerUserId: string | null
  providerEmail: string | null
  metadata?: Record<string, unknown> | null
}): Promise<void> {
  const supabase = await createClient()

  await supabase.from('user_oauth_tokens').upsert(
    {
      user_id: params.userId,
      provider: params.provider,
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
      expires_at: params.expiresAt,
      scope: params.scope,
      provider_user_id: params.providerUserId,
      provider_email: params.providerEmail,
      metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : null,
      connected_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,provider' }
  )
}

export async function deleteUserToken(
  userId: string,
  provider: OAuthProvider
): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('user_oauth_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider)
}

export async function getUserConnections(
  userId: string
): Promise<UserConnection[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('user_oauth_tokens')
    .select('provider, provider_email, connected_at')
    .eq('user_id', userId)

  if (!data) return []

  return data.map((row) => ({
    provider: row.provider as OAuthProvider,
    provider_email: row.provider_email,
    connected_at: row.connected_at,
  }))
}

export async function getValidAccessToken(
  userId: string,
  provider: OAuthProvider
): Promise<string | null> {
  const supabase = await createClient()

  const { data: token } = await supabase
    .from('user_oauth_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single()

  if (!token) return null

  // Check if token is still valid (with 60-second buffer)
  if (token.expires_at) {
    const expiresAt = new Date(token.expires_at).getTime()
    const now = Date.now() + 60_000
    if (expiresAt > now) {
      return token.access_token
    }
  } else {
    // No expiry — assume valid
    return token.access_token
  }

  // Token expired — try to refresh
  if (!token.refresh_token) return null

  const config = getOAuthConfig(provider)

  try {
    const body = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: token.refresh_token,
      grant_type: 'refresh_token',
    })

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) return null

    const data = (await response.json()) as {
      access_token: string
      refresh_token?: string
      expires_in?: number
    }

    const newExpiresAt = data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : null

    await supabase
      .from('user_oauth_tokens')
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token ?? token.refresh_token,
        expires_at: newExpiresAt,
      })
      .eq('user_id', userId)
      .eq('provider', provider)

    return data.access_token
  } catch {
    return null
  }
}
