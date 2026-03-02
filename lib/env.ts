/**
 * Environment Variable Validation — runs at import time.
 *
 * Import this module early (e.g., in middleware.ts or layout.tsx) to surface
 * missing env vars as clear startup errors instead of cryptic runtime failures.
 *
 * Tiered approach:
 *   REQUIRED (3) — Starter deployments need only these
 *   RECOMMENDED (3) — Production quality (Sentry, Stripe, Redis)
 *   OPTIONAL (6) — Feature-specific (AI, integrations, SAM.gov)
 */
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('env')

// ─── Required Variables (Starter tier — minimum to run) ─────

const REQUIRED_VARS = [
  { key: 'NEXT_PUBLIC_SUPABASE_URL', purpose: 'Supabase project URL' },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', purpose: 'Supabase anonymous key' },
  { key: 'NEXT_PUBLIC_SITE_URL', purpose: 'Application base URL' },
] as const

// ─── Recommended Variables (production quality) ─────────────

const RECOMMENDED_VARS = [
  { key: 'SENTRY_DSN', purpose: 'Sentry error tracking' },
  { key: 'UPSTASH_REDIS_REST_URL', purpose: 'Redis rate limiting and caching' },
  { key: 'UPSTASH_REDIS_REST_TOKEN', purpose: 'Redis authentication' },
] as const

// ─── Optional Variables (feature-specific) ──────────────────

const OPTIONAL_VARS = [
  { key: 'SUPABASE_SERVICE_ROLE_KEY', purpose: 'Admin Supabase operations' },
  { key: 'STRIPE_SECRET_KEY', purpose: 'Stripe billing', feature: 'billing' },
  { key: 'STRIPE_WEBHOOK_SECRET', purpose: 'Stripe webhook verification', feature: 'billing' },
  { key: 'ASKSAGE_API_KEY', purpose: 'AskSage AI provider', feature: 'ai' },
  { key: 'ANTHROPIC_API_KEY', purpose: 'Anthropic AI provider', feature: 'ai' },
  { key: 'OPENAI_API_KEY', purpose: 'OpenAI AI provider', feature: 'ai' },
  { key: 'SAM_GOV_API_KEY', purpose: 'SAM.gov opportunity search', feature: 'sam_gov' },
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
for (const v of [...RECOMMENDED_VARS, ...OPTIONAL_VARS]) {
  if (!process.env[v.key]) {
    absent.push(`${v.key} (${v.purpose})`)
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

/**
 * Check which optional features are active based on configured env vars.
 * Useful for health checks and feature discovery.
 */
export function getFeatureStatus(): Record<string, { active: boolean; reason?: string }> {
  return {
    ai: {
      active: !!(process.env.ASKSAGE_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY),
      reason: !process.env.ASKSAGE_API_KEY && !process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY
        ? 'No AI API key configured'
        : undefined,
    },
    billing: {
      active: !!process.env.STRIPE_SECRET_KEY,
      reason: !process.env.STRIPE_SECRET_KEY ? 'No Stripe key configured' : undefined,
    },
    sam_gov: {
      active: !!process.env.SAM_GOV_API_KEY,
      reason: !process.env.SAM_GOV_API_KEY ? 'No SAM.gov API key — using local data fallback' : undefined,
    },
    rate_limiting: {
      active: !!process.env.UPSTASH_REDIS_REST_URL,
      reason: !process.env.UPSTASH_REDIS_REST_URL ? 'No Redis configured' : undefined,
    },
    error_tracking: {
      active: !!process.env.SENTRY_DSN,
      reason: !process.env.SENTRY_DSN ? 'No Sentry DSN configured' : undefined,
    },
  }
}
