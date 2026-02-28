/**
 * Health Check Functions
 *
 * Individual subsystem checks + aggregator. Used by both the public
 * /api/health endpoint (summary only) and /api/health/detailed (admin).
 *
 * Critical checks: database, auth, redis — any failure → unhealthy.
 * Non-critical checks: storage, stripe, sam, ai_gateway — failure → degraded.
 */
import { createClient } from '@/lib/supabase/server'
import { getRedis } from '@/lib/cache/redis'

export type CheckStatus = 'healthy' | 'degraded' | 'unhealthy'

export interface CheckResult {
  status: CheckStatus
  latency_ms: number
  last_checked: string
  error?: string
}

export interface HealthReport {
  status: CheckStatus
  timestamp: string
  version: string
  checks: Record<string, CheckResult>
}

// ─── Individual Checks ──────────────────────────────────────

export async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('profiles').select('id').limit(1)
    return {
      status: error ? 'degraded' : 'healthy',
      latency_ms: Date.now() - start,
      last_checked: new Date().toISOString(),
      ...(error && { error: error.message }),
    }
  } catch (e) {
    return {
      status: 'unhealthy',
      latency_ms: Date.now() - start,
      last_checked: new Date().toISOString(),
      error: e instanceof Error ? e.message : 'Unknown error',
    }
  }
}

export async function checkAuth(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.getSession()
    return {
      status: error ? 'degraded' : 'healthy',
      latency_ms: Date.now() - start,
      last_checked: new Date().toISOString(),
      ...(error && { error: error.message }),
    }
  } catch (e) {
    return {
      status: 'unhealthy',
      latency_ms: Date.now() - start,
      last_checked: new Date().toISOString(),
      error: e instanceof Error ? e.message : 'Unknown error',
    }
  }
}

export async function checkRedis(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const redis = getRedis()
    if (!redis) {
      return {
        status: 'degraded',
        latency_ms: Date.now() - start,
        last_checked: new Date().toISOString(),
        error: 'Redis not configured',
      }
    }
    await redis.ping()
    return {
      status: 'healthy',
      latency_ms: Date.now() - start,
      last_checked: new Date().toISOString(),
    }
  } catch (e) {
    return {
      status: 'unhealthy',
      latency_ms: Date.now() - start,
      last_checked: new Date().toISOString(),
      error: e instanceof Error ? e.message : 'Unknown error',
    }
  }
}

export async function checkStorage(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const supabase = await createClient()
    const { error } = await supabase.storage.listBuckets()
    return {
      status: error ? 'degraded' : 'healthy',
      latency_ms: Date.now() - start,
      last_checked: new Date().toISOString(),
      ...(error && { error: error.message }),
    }
  } catch (e) {
    return {
      status: 'degraded',
      latency_ms: Date.now() - start,
      last_checked: new Date().toISOString(),
      error: e instanceof Error ? e.message : 'Unknown error',
    }
  }
}

export async function checkStripe(): Promise<CheckResult> {
  const start = Date.now()
  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      status: 'degraded',
      latency_ms: Date.now() - start,
      last_checked: new Date().toISOString(),
      error: 'Stripe not configured',
    }
  }
  try {
    // Dynamic import to avoid loading Stripe unless needed
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
    })
    await stripe.balance.retrieve()
    return {
      status: 'healthy',
      latency_ms: Date.now() - start,
      last_checked: new Date().toISOString(),
    }
  } catch (e) {
    return {
      status: 'degraded',
      latency_ms: Date.now() - start,
      last_checked: new Date().toISOString(),
      error: e instanceof Error ? e.message : 'Unknown error',
    }
  }
}

export async function checkSamGov(): Promise<CheckResult> {
  const start = Date.now()
  if (!process.env.SAM_GOV_API_KEY) {
    return {
      status: 'degraded',
      latency_ms: Date.now() - start,
      last_checked: new Date().toISOString(),
      error: 'SAM.gov API key not configured',
    }
  }
  try {
    const res = await fetch('https://api.sam.gov/entity-information/v3/entities?api_key=' + process.env.SAM_GOV_API_KEY + '&registrationStatus=A&samRegistered=Yes&pageSize=1', {
      signal: AbortSignal.timeout(5000),
    })
    return {
      status: res.ok ? 'healthy' : 'degraded',
      latency_ms: Date.now() - start,
      last_checked: new Date().toISOString(),
      ...(!res.ok && { error: `HTTP ${res.status}` }),
    }
  } catch (e) {
    return {
      status: 'degraded',
      latency_ms: Date.now() - start,
      last_checked: new Date().toISOString(),
      error: e instanceof Error ? e.message : 'Unknown error',
    }
  }
}

export async function checkAiGateway(): Promise<CheckResult> {
  const start = Date.now()
  const hasAnyProvider = !!(
    process.env.ASKSAGE_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.OPENAI_API_KEY
  )
  return {
    status: hasAnyProvider ? 'healthy' : 'degraded',
    latency_ms: Date.now() - start,
    last_checked: new Date().toISOString(),
    ...(!hasAnyProvider && { error: 'No AI provider configured' }),
  }
}

// ─── Aggregator ─────────────────────────────────────────────

const CRITICAL_CHECKS = ['database', 'auth', 'redis'] as const

export async function runAllChecks(): Promise<HealthReport> {
  const results = await Promise.allSettled([
    checkDatabase(),
    checkAuth(),
    checkRedis(),
    checkStorage(),
    checkStripe(),
    checkSamGov(),
    checkAiGateway(),
  ])

  const checkNames = ['database', 'auth', 'redis', 'storage', 'stripe', 'sam_gov', 'ai_gateway']

  const checks: Record<string, CheckResult> = {}
  for (let i = 0; i < checkNames.length; i++) {
    const result = results[i]
    checks[checkNames[i]] = result.status === 'fulfilled'
      ? result.value
      : {
          status: 'unhealthy',
          latency_ms: 0,
          last_checked: new Date().toISOString(),
          error: result.reason instanceof Error ? result.reason.message : 'Check failed',
        }
  }

  // Determine overall status
  let status: CheckStatus = 'healthy'

  for (const name of CRITICAL_CHECKS) {
    if (checks[name]?.status === 'unhealthy') {
      status = 'unhealthy'
      break
    }
    if (checks[name]?.status === 'degraded') {
      status = 'degraded'
    }
  }

  // Non-critical failures can only degrade, not make unhealthy
  if (status === 'healthy') {
    for (const [name, check] of Object.entries(checks)) {
      if (!(CRITICAL_CHECKS as readonly string[]).includes(name) && check.status !== 'healthy') {
        status = 'degraded'
        break
      }
    }
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '2.0.0',
    checks,
  }
}
