/**
 * API Key Management — Public REST API Authentication
 * Sprint 33 (T-33.2) — Phase L v2.0
 *
 * Generates, validates, revokes, and rotates API keys for the
 * MissionPulse public REST API. Keys are stored as SHA-256 hashes.
 *
 * © 2026 Mission Meets Tech
 */

import { createClient } from '@/lib/supabase/server'

// ─── Types ──────────────────────────────────────────────────────

export interface APIKeyInfo {
  id: string
  keyPrefix: string
  name: string
  permissions: string[]
  rateLimit: number
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
}

interface ValidatedKey {
  companyId: string
  permissions: string[]
  rateLimit: number
}

// ─── Helpers ────────────────────────────────────────────────────

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateRawKey(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return 'mp_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Generate a new API key for a company.
 * Returns the raw key (shown once) and the stored info.
 */
export async function generateAPIKey(
  companyId: string,
  name: string,
  permissions: string[],
  rateLimit: number,
  userId: string,
  expiresInDays?: number
): Promise<{ rawKey: string; info: APIKeyInfo } | { error: string }> {
  const supabase = await createClient()

  const rawKey = generateRawKey()
  const keyHash = await hashKey(rawKey)
  const keyPrefix = rawKey.slice(0, 11) // mp_XXXXXXXX

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86_400_000).toISOString()
    : null

  const { data, error } = await supabase
    .from('integrations')
    .insert({
      company_id: companyId,
      provider: 'api_key',
      name,
      status: 'active',
      credentials_encrypted: JSON.stringify({
        key_hash: keyHash,
        key_prefix: keyPrefix,
        permissions,
        rate_limit: rateLimit,
        expires_at: expiresAt,
        created_by: userId,
      }),
    })
    .select('id, created_at')
    .single()

  if (error || !data) return { error: error?.message ?? 'Failed to create key' }

  return {
    rawKey,
    info: {
      id: data.id,
      keyPrefix,
      name,
      permissions,
      rateLimit,
      lastUsedAt: null,
      expiresAt,
      createdAt: data.created_at ?? new Date().toISOString(),
    },
  }
}

/**
 * Validate an API key. Returns company info and permissions if valid.
 */
export async function validateAPIKey(key: string): Promise<ValidatedKey | null> {
  const supabase = await createClient()
  const keyHash = await hashKey(key)

  const { data: keys } = await supabase
    .from('integrations')
    .select('id, company_id, credentials_encrypted, status')
    .eq('provider', 'api_key')
    .eq('status', 'active')

  for (const row of keys ?? []) {
    if (!row.credentials_encrypted) continue
    const creds = JSON.parse(row.credentials_encrypted) as {
      key_hash: string
      permissions: string[]
      rate_limit: number
      expires_at: string | null
    }

    if (creds.key_hash !== keyHash) continue

    // Check expiration
    if (creds.expires_at && new Date(creds.expires_at) < new Date()) {
      return null
    }

    // Update last_used_at
    const updatedCreds = { ...creds, last_used_at: new Date().toISOString() }
    await supabase
      .from('integrations')
      .update({ credentials_encrypted: JSON.stringify(updatedCreds) })
      .eq('id', row.id)

    return {
      companyId: row.company_id ?? '',
      permissions: creds.permissions,
      rateLimit: creds.rate_limit,
    }
  }

  return null
}

/**
 * Revoke an API key.
 */
export async function revokeAPIKey(keyId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('integrations')
    .update({ status: 'revoked' })
    .eq('id', keyId)
    .eq('provider', 'api_key')

  return !error
}

/**
 * Rotate an API key — revoke old, generate new.
 */
export async function rotateAPIKey(
  keyId: string,
  companyId: string,
  userId: string
): Promise<{ rawKey: string; info: APIKeyInfo } | { error: string }> {
  const supabase = await createClient()

  // Get current key info
  const { data: current } = await supabase
    .from('integrations')
    .select('name, credentials_encrypted')
    .eq('id', keyId)
    .eq('provider', 'api_key')
    .single()

  if (!current?.credentials_encrypted) return { error: 'Key not found' }

  const creds = JSON.parse(current.credentials_encrypted) as {
    permissions: string[]
    rate_limit: number
  }

  // Revoke old key
  await revokeAPIKey(keyId)

  // Generate new key with same settings
  return generateAPIKey(
    companyId,
    current.name ?? 'Rotated Key',
    creds.permissions,
    creds.rate_limit,
    userId
  )
}

/**
 * List all API keys for a company (showing only prefix, not full key).
 */
export async function listAPIKeys(companyId: string): Promise<APIKeyInfo[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('integrations')
    .select('id, name, credentials_encrypted, status, created_at')
    .eq('company_id', companyId)
    .eq('provider', 'api_key')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  return (data ?? []).map(row => {
    const creds = row.credentials_encrypted
      ? JSON.parse(row.credentials_encrypted) as {
          key_prefix: string
          permissions: string[]
          rate_limit: number
          last_used_at?: string
          expires_at?: string
        }
      : { key_prefix: '???', permissions: [], rate_limit: 100 }

    return {
      id: row.id,
      keyPrefix: creds.key_prefix,
      name: row.name ?? '',
      permissions: creds.permissions,
      rateLimit: creds.rate_limit,
      lastUsedAt: creds.last_used_at ?? null,
      expiresAt: creds.expires_at ?? null,
      createdAt: row.created_at ?? new Date().toISOString(),
    }
  })
}
