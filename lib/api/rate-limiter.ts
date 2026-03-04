/**
 * API Rate Limiter — Per-key rate limiting
 * Sprint 33 (T-33.2) — Phase L v2.0
 *
 * In-memory rate limiter with sliding window counters.
 * Professional: 100 req/min (read-only)
 * Enterprise: 1000 req/min (full access)
 *
 * © 2026 Mission Meets Tech
 */

// ─── Types ──────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number
  windowStart: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

// ─── Constants ──────────────────────────────────────────────────

const WINDOW_MS = 60_000 // 1 minute window

export const TIER_LIMITS = {
  starter: 0,        // No API access
  professional: 100,  // 100 req/min, read-only
  enterprise: 1000,   // 1000 req/min, full access
} as const

// ─── In-memory store ────────────────────────────────────────────

const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    store.forEach((entry, key) => {
      if (now - entry.windowStart > WINDOW_MS * 2) {
        store.delete(key)
      }
    })
  }, 300_000)
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Check if a request is within rate limits.
 */
export function checkRateLimit(keyId: string, limit: number): RateLimitResult {
  const now = Date.now()
  const entry = store.get(keyId)

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    // New window
    store.set(keyId, { count: 1, windowStart: now })
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + WINDOW_MS,
    }
  }

  entry.count++

  if (entry.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.windowStart + WINDOW_MS,
    }
  }

  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.windowStart + WINDOW_MS,
  }
}

/**
 * Get rate limit headers for API responses.
 */
export function getRateLimitHeaders(
  result: RateLimitResult,
  limit: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  }
}
