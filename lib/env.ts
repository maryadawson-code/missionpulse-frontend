/**
 * Environment Variable Validation — runs at import time.
 *
 * Import this module early (e.g., in middleware.ts or layout.tsx) to surface
 * missing env vars as clear startup errors instead of cryptic runtime failures.
 */
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('env')

// ─── Required Variables ──────────────────────────────────────

const REQUIRED_VARS = [
  { key: 'NEXT_PUBLIC_SUPABASE_URL', purpose: 'Supabase project URL' },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', purpose: 'Supabase anonymous key' },
  { key: 'NEXT_PUBLIC_SITE_URL', purpose: 'Application base URL' },
] as const

// ─── Optional Variables (logged when absent) ─────────────────

const OPTIONAL_VARS = [
  { key: 'SUPABASE_SERVICE_ROLE_KEY', purpose: 'Admin Supabase operations' },
  { key: 'SENTRY_DSN', purpose: 'Sentry error tracking' },
  { key: 'UPSTASH_REDIS_REST_URL', purpose: 'Redis rate limiting and caching' },
  { key: 'UPSTASH_REDIS_REST_TOKEN', purpose: 'Redis authentication' },
  { key: 'STRIPE_SECRET_KEY', purpose: 'Stripe billing' },
  { key: 'STRIPE_WEBHOOK_SECRET', purpose: 'Stripe webhook verification' },
  { key: 'ASKSAGE_API_KEY', purpose: 'AskSage AI provider' },
  { key: 'ANTHROPIC_API_KEY', purpose: 'Anthropic AI provider' },
  { key: 'OPENAI_API_KEY', purpose: 'OpenAI AI provider' },
] as const

// ─── Validation ──────────────────────────────────────────────

const missing: string[] = []

for (const { key, purpose } of REQUIRED_VARS) {
  if (!process.env[key]) {
    missing.push(`  ${key} — ${purpose}`)
  }
}

if (missing.length > 0) {
  const msg = `Missing required environment variables:\n${missing.join('\n')}`
  log.error(msg)
  if (process.env.NODE_ENV === 'production') {
    throw new Error(msg)
  }
}

const absent: string[] = []
for (const { key, purpose } of OPTIONAL_VARS) {
  if (!process.env[key]) {
    absent.push(`${key} (${purpose})`)
  }
}

if (absent.length > 0) {
  log.info(`Optional env vars not set: ${absent.join(', ')}`)
}

export const env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
} as const
