/**
 * GovWin IQ Authentication — dedicated auth module.
 *
 * GovWin uses OAuth2 (client_id + client_secret).
 * Token exchange and credential storage are handled in client.ts.
 * This module provides auth utilities: header generation, validation, error handling.
 */
'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Config ──────────────────────────────────────────────────

const GOVWIN_BASE_URL =
  process.env.GOVWIN_BASE_URL ?? 'https://api.govwin.com/v2'

// ─── Types ───────────────────────────────────────────────────

export class GovWinAuthError extends Error {
  readonly statusCode: number

  constructor(message: string, statusCode: number = 401) {
    super(message)
    this.name = 'GovWinAuthError'
    this.statusCode = statusCode
  }
}

interface StoredCredentials {
  access_token: string
  refresh_token: string
  expires_at: number
}

// ─── Functions ──────────────────────────────────────────────

/**
 * Get authorization headers for GovWin API requests.
 * Reads stored credentials from the integrations table.
 */
export async function getAuthHeaders(
  companyId: string
): Promise<Record<string, string>> {
  const creds = await getStoredCredentials(companyId)
  if (!creds) {
    throw new GovWinAuthError('GovWin not connected — no credentials found')
  }

  if (Date.now() > creds.expires_at) {
    throw new GovWinAuthError('GovWin token expired — reconnection required')
  }

  return {
    Authorization: `Bearer ${creds.access_token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

/**
 * Validate the GovWin connection by testing the API.
 */
export async function validateConnection(
  companyId: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const headers = await getAuthHeaders(companyId)

    const res = await fetch(`${GOVWIN_BASE_URL}/health`, {
      headers,
      signal: AbortSignal.timeout(10000),
    })

    if (res.ok) return { valid: true }

    if (res.status === 401 || res.status === 403) {
      return { valid: false, error: 'Authentication failed — reconnect GovWin' }
    }

    return { valid: false, error: `GovWin API returned ${res.status}` }
  } catch (err) {
    if (err instanceof GovWinAuthError) {
      return { valid: false, error: err.message }
    }
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Connection check failed',
    }
  }
}

/**
 * Check if GovWin is configured and connected for a company.
 */
export async function isGovWinConnected(
  companyId: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('integrations')
    .select('status')
    .eq('provider', 'govwin')
    .eq('company_id', companyId)
    .single()

  return data?.status === 'active'
}

// ─── Helpers ────────────────────────────────────────────────

async function getStoredCredentials(
  companyId: string
): Promise<StoredCredentials | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('integrations')
    .select('credentials_encrypted, status')
    .eq('provider', 'govwin')
    .eq('company_id', companyId)
    .single()

  if (!data?.credentials_encrypted || data.status !== 'active') return null

  return JSON.parse(data.credentials_encrypted as string) as StoredCredentials
}
