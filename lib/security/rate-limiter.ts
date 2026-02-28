/**
 * Redis-Backed Rate Limiting
 *
 * Distributed rate limiting via Upstash Redis. Replaces all in-memory
 * Map-based rate limiters (ineffective in serverless — per-instance memory).
 *
 * Three tiers:
 *   strict   — 5 req/60s (auth, password reset)
 *   standard — 30 req/60s (API routes, form submissions)
 *   relaxed  — 100 req/60s (health, read-heavy endpoints)
 *
 * Fail-open: if Redis is unavailable, requests pass with structured log warning.
 */
import { Ratelimit } from '@upstash/ratelimit'
import { getRedis } from '@/lib/cache/redis'
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('rate-limiter')

export type RateLimitTier = 'strict' | 'standard' | 'relaxed'

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // Unix timestamp (seconds)
}

// ─── Route → Tier Mapping ───────────────────────────────────

export const ROUTE_TIER_MAP: Record<string, RateLimitTier> = {
  '/api/auth/callback': 'strict',
  '/api/newsletter': 'strict',
  '/api/cron/daily': 'strict',
  '/api/webhooks/stripe': 'standard',
  '/api/health': 'relaxed',
  '/api/health/detailed': 'relaxed',
  '/api/metrics': 'standard',
  '/api/section-versions': 'standard',
  '/api/integrations/docusign/callback': 'standard',
  '/api/integrations/google/callback': 'standard',
  '/api/integrations/govwin/callback': 'standard',
  '/api/integrations/m365/callback': 'standard',
  '/api/integrations/salesforce/callback': 'standard',
  '/api/integrations/slack/callback': 'standard',
  // Auth pages (POST)
  '/login': 'strict',
  '/signup': 'strict',
}

// ─── Rate Limiter Instances ─────────────────────────────────

const limiters = new Map<RateLimitTier, Ratelimit>()

function getLimiter(tier: RateLimitTier): Ratelimit | null {
  if (limiters.has(tier)) return limiters.get(tier)!

  const redis = getRedis()
  if (!redis) return null

  let limiter: Ratelimit
  switch (tier) {
    case 'strict':
      limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '60 s'),
        prefix: 'ratelimit:strict',
      })
      break
    case 'standard':
      limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, '60 s'),
        prefix: 'ratelimit:standard',
      })
      break
    case 'relaxed':
      limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '60 s'),
        prefix: 'ratelimit:relaxed',
      })
      break
  }

  limiters.set(tier, limiter)
  return limiter
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Check rate limit for a given identifier (typically IP:route).
 * Returns result with headers info. Fail-open if Redis is unavailable.
 */
export async function checkRateLimit(
  identifier: string,
  tier: RateLimitTier
): Promise<RateLimitResult> {
  const limiter = getLimiter(tier)

  if (!limiter) {
    log.warn('Redis unavailable — rate limit bypassed (fail-open)', { identifier, tier })
    return { success: true, limit: 0, remaining: 0, reset: 0 }
  }

  try {
    const result = await limiter.limit(identifier)
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    }
  } catch (err) {
    log.warn('Rate limit check failed — bypassed (fail-open)', {
      identifier,
      tier,
      error: err instanceof Error ? err.message : String(err),
    })
    return { success: true, limit: 0, remaining: 0, reset: 0 }
  }
}

/**
 * Get rate limit response headers for inclusion in HTTP response.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  if (result.limit === 0) return {} // Redis unavailable, no headers

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.reset),
  }

  if (!result.success) {
    const retryAfter = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000))
    headers['Retry-After'] = String(retryAfter)
  }

  return headers
}

/**
 * Get the rate limit tier for a given route path.
 * Returns null if the route is not rate-limited.
 */
export function getTierForRoute(pathname: string): RateLimitTier | null {
  // Direct match
  if (ROUTE_TIER_MAP[pathname]) return ROUTE_TIER_MAP[pathname]

  // Prefix match for integration callbacks
  for (const [route, tier] of Object.entries(ROUTE_TIER_MAP)) {
    if (pathname.startsWith(route)) return tier
  }

  return null
}

/**
 * Check if an IP is in the rate limit allowlist.
 */
export function isAllowlisted(ip: string): boolean {
  const allowlist = process.env.RATE_LIMIT_ALLOWLIST
  if (!allowlist) return false
  return allowlist.split(',').map((s) => s.trim()).includes(ip)
}
