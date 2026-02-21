/**
 * Supabase Server Client
 * Use in Server Components, Route Handlers, Server Actions
 *
 * Supports connection pooling via SUPABASE_POOLER_URL env var.
 * When set, uses pgBouncer transaction mode for better connection reuse.
 *
 * © 2026 Mission Meets Tech
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

/**
 * Create the standard server client (with auth/cookies).
 * Uses pooler URL when available for better connection management.
 */
export function createClient() {
  const cookieStore = cookies()

  // Prefer pooler URL for connection pooling (pgBouncer transaction mode)
  const supabaseUrl =
    process.env.SUPABASE_POOLER_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and anon key must be set in environment variables')
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Server Component — ignore
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Server Component — ignore
          }
        },
      },
    }
  )
}
