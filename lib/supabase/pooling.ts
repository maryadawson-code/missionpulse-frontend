/**
 * Supabase Connection Pooling — Supavisor configuration.
 *
 * Uses SUPABASE_POOLER_URL for high-throughput server operations.
 * The actual connection pooling is handled by Supabase's Supavisor
 * infrastructure — this module provides a configured client.
 *
 * When to use pooled vs direct:
 * - Pooled (getPooledClient): batch operations, Edge Functions, high-concurrency server actions
 * - Direct (createClient from server.ts): standard request-scoped queries with RLS
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const POOLER_URL = process.env.SUPABASE_POOLER_URL ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

/**
 * Get a Supabase client configured for connection pooling via Supavisor.
 * Falls back to the standard SUPABASE_URL if SUPABASE_POOLER_URL is not set.
 *
 * NOTE: This client uses the service role key and bypasses RLS.
 * Only use for batch/admin operations where tenant isolation is handled manually.
 */
export function getPooledClient() {
  const url = POOLER_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url || !SERVICE_KEY) {
    throw new Error(
      'Missing SUPABASE_POOLER_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  return createSupabaseClient(url, SERVICE_KEY, {
    auth: { persistSession: false },
    db: { schema: 'public' },
  })
}

/**
 * Check if connection pooling is configured.
 */
export function isPoolingConfigured(): boolean {
  return Boolean(POOLER_URL && SERVICE_KEY)
}
