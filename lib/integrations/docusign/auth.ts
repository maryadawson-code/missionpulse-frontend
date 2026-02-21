/**
 * DocuSign OAuth 2.0 — Authorization Code Grant
 *
 * Implements the OAuth flow for DocuSign eSignature API:
 * 1. Redirect to DocuSign consent screen
 * 2. Callback with code → exchange for tokens
 * 3. Tokens stored in integrations table
 *
 * Use cases: Gate approval signatures, NDA routing, certification attestations
 * Env vars: DOCUSIGN_CLIENT_ID, DOCUSIGN_CLIENT_SECRET, DOCUSIGN_REDIRECT_URI, DOCUSIGN_ACCOUNT_ID
 */
'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Config ──────────────────────────────────────────────────

const DOCUSIGN_CLIENT_ID = process.env.DOCUSIGN_CLIENT_ID ?? ''
const DOCUSIGN_CLIENT_SECRET = process.env.DOCUSIGN_CLIENT_SECRET ?? ''
const DOCUSIGN_REDIRECT_URI =
  process.env.DOCUSIGN_REDIRECT_URI ?? 'https://missionpulse.io/api/integrations/docusign/callback'
const DOCUSIGN_ACCOUNT_ID = process.env.DOCUSIGN_ACCOUNT_ID ?? ''

// DocuSign environments
const IS_PRODUCTION = process.env.DOCUSIGN_ENV === 'production'
const AUTH_BASE = IS_PRODUCTION
  ? 'https://account.docusign.com'
  : 'https://account-d.docusign.com'
const API_BASE = IS_PRODUCTION
  ? 'https://na4.docusign.net/restapi'
  : 'https://demo.docusign.net/restapi'

const SCOPES = 'signature impersonation'

// ─── Types ───────────────────────────────────────────────────

interface DocuSignTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

interface DocuSignUserInfo {
  sub: string
  name: string
  email: string
  accounts: Array<{
    account_id: string
    account_name: string
    is_default: boolean
    base_uri: string
  }>
}

// ─── OAuth Flow ──────────────────────────────────────────────

/**
 * Generate the DocuSign OAuth authorization URL.
 */
export async function getDocuSignAuthUrl(): Promise<string> {
  const params = new URLSearchParams({
    response_type: 'code',
    scope: SCOPES,
    client_id: DOCUSIGN_CLIENT_ID,
    redirect_uri: DOCUSIGN_REDIRECT_URI,
  })

  return `${AUTH_BASE}/oauth/auth?${params.toString()}`
}

/**
 * Exchange authorization code for tokens and save to integrations table.
 */
export async function exchangeDocuSignCode(
  code: string,
  userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const basicAuth = Buffer.from(`${DOCUSIGN_CLIENT_ID}:${DOCUSIGN_CLIENT_SECRET}`).toString('base64')

    const tokenRes = await fetch(`${AUTH_BASE}/oauth/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!tokenRes.ok) {
      return { success: false, error: `Token exchange failed: ${tokenRes.status}` }
    }

    const tokens = (await tokenRes.json()) as DocuSignTokens

    // Get user info + account details
    const userRes = await fetch(`${AUTH_BASE}/oauth/userinfo`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      signal: AbortSignal.timeout(10000),
    })

    let userName = 'DocuSign User'
    let userEmail = ''
    let accountId = DOCUSIGN_ACCOUNT_ID
    let baseUri = API_BASE

    if (userRes.ok) {
      const user = (await userRes.json()) as DocuSignUserInfo
      userName = user.name
      userEmail = user.email
      const defaultAccount = user.accounts.find((a) => a.is_default) ?? user.accounts[0]
      if (defaultAccount) {
        accountId = defaultAccount.account_id
        baseUri = defaultAccount.base_uri + '/restapi'
      }
    }

    const supabase = await createClient()
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    await supabase.from('integrations').upsert(
      {
        company_id: companyId,
        name: 'DocuSign',
        provider: 'docusign',
        status: 'active',
        credentials_encrypted: JSON.stringify({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt,
          account_id: accountId,
          base_uri: baseUri,
        }),
        config: JSON.parse(JSON.stringify({
          user_name: userName,
          user_email: userEmail,
          account_id: accountId,
          environment: IS_PRODUCTION ? 'production' : 'demo',
          connected_at: new Date().toISOString(),
          connected_by: userId,
        })),
        last_sync: new Date().toISOString(),
      },
      { onConflict: 'company_id,provider' }
    )

    await supabase.from('audit_logs').insert({
      action: 'integration_connect',
      table_name: 'integrations',
      record_id: `docusign:${companyId}`,
      user_id: userId,
      new_values: JSON.parse(JSON.stringify({ provider: 'docusign', user_email: userEmail })),
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed' }
  }
}

/**
 * Refresh an expired DocuSign access token.
 */
export async function refreshDocuSignToken(companyId: string): Promise<{
  token: string
  accountId: string
  baseUri: string
} | null> {
  const supabase = await createClient()

  const { data: integration } = await supabase
    .from('integrations')
    .select('credentials_encrypted')
    .eq('company_id', companyId)
    .eq('provider', 'docusign')
    .single()

  if (!integration?.credentials_encrypted) return null

  const creds = JSON.parse(integration.credentials_encrypted) as {
    access_token: string
    refresh_token: string
    expires_at: string
    account_id: string
    base_uri: string
  }

  // Check if token is still valid
  if (new Date(creds.expires_at) > new Date()) {
    return { token: creds.access_token, accountId: creds.account_id, baseUri: creds.base_uri }
  }

  // Refresh
  const basicAuth = Buffer.from(`${DOCUSIGN_CLIENT_ID}:${DOCUSIGN_CLIENT_SECRET}`).toString('base64')

  const res = await fetch(`${AUTH_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: creds.refresh_token,
    }),
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) return null

  const tokens = (await res.json()) as DocuSignTokens
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  await supabase
    .from('integrations')
    .update({
      credentials_encrypted: JSON.stringify({
        ...creds,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
      }),
      last_sync: new Date().toISOString(),
    })
    .eq('company_id', companyId)
    .eq('provider', 'docusign')

  return { token: tokens.access_token, accountId: creds.account_id, baseUri: creds.base_uri }
}

/**
 * Disconnect DocuSign integration.
 */
export async function disconnectDocuSign(
  companyId: string,
  userId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient()

  await supabase
    .from('integrations')
    .update({ status: 'inactive', credentials_encrypted: null })
    .eq('company_id', companyId)
    .eq('provider', 'docusign')

  await supabase.from('audit_logs').insert({
    action: 'integration_disconnect',
    table_name: 'integrations',
    record_id: `docusign:${companyId}`,
    user_id: userId,
  })

  return { success: true }
}
