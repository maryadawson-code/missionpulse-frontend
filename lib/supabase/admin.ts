/**
 * Supabase Admin Client — SERVICE ROLE
 * SERVER-ONLY. Never import in client components.
 * Bypasses RLS. Use only for admin ops, webhooks, background jobs.
 * © 2026 Mission Meets Tech
 */
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. This client is server-only.'
    )
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
