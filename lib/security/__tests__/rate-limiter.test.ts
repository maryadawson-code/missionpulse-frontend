/**
 * Rate Limiter — Unit Tests
 *
 * Tests pure functions (getTierForRoute, isAllowlisted, rateLimitHeaders)
 * without needing Redis or network mocks.
 */
vi.mock('@/lib/cache/redis', () => ({
  getRedis: vi.fn(() => null),
}))

vi.mock('@/lib/logging/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}))

import {
  getTierForRoute,
  isAllowlisted,
  rateLimitHeaders,
  type RateLimitResult,
} from '../rate-limiter'

// ─── getTierForRoute ────────────────────────────────────────

describe('getTierForRoute', () => {
  it('returns "relaxed" for direct match /api/health', () => {
    expect(getTierForRoute('/api/health')).toBe('relaxed')
  })

  it('returns "strict" for direct match /api/newsletter', () => {
    expect(getTierForRoute('/api/newsletter')).toBe('strict')
  })

  it('returns null for an unknown route', () => {
    expect(getTierForRoute('/api/unknown/endpoint')).toBeNull()
  })
})

// ─── isAllowlisted ──────────────────────────────────────────

describe('isAllowlisted', () => {
  const originalEnv = process.env.RATE_LIMIT_ALLOWLIST

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.RATE_LIMIT_ALLOWLIST
    } else {
      process.env.RATE_LIMIT_ALLOWLIST = originalEnv
    }
  })

  it('returns true when the IP is in the env allowlist', () => {
    process.env.RATE_LIMIT_ALLOWLIST = '10.0.0.1, 192.168.1.100, 172.16.0.5'
    expect(isAllowlisted('192.168.1.100')).toBe(true)
  })

  it('returns false when the IP is not in the allowlist', () => {
    process.env.RATE_LIMIT_ALLOWLIST = '10.0.0.1, 192.168.1.100'
    expect(isAllowlisted('8.8.8.8')).toBe(false)
  })
})

// ─── rateLimitHeaders ───────────────────────────────────────

describe('rateLimitHeaders', () => {
  it('generates correct headers and adds Retry-After when success is false', () => {
    const resetTimestamp = Math.floor(Date.now() / 1000) + 30 // 30s in the future
    const result: RateLimitResult = {
      success: false,
      limit: 5,
      remaining: 0,
      reset: resetTimestamp * 1000, // reset is in ms per upstream Ratelimit
    }

    const headers = rateLimitHeaders(result)

    expect(headers['X-RateLimit-Limit']).toBe('5')
    expect(headers['X-RateLimit-Remaining']).toBe('0')
    expect(headers['X-RateLimit-Reset']).toBe(String(result.reset))
    expect(headers).toHaveProperty('Retry-After')
    // Retry-After should be a non-negative number string
    expect(Number(headers['Retry-After'])).toBeGreaterThanOrEqual(0)
  })

  it('omits Retry-After when success is true', () => {
    const result: RateLimitResult = {
      success: true,
      limit: 30,
      remaining: 25,
      reset: Date.now() + 60_000,
    }

    const headers = rateLimitHeaders(result)

    expect(headers['X-RateLimit-Limit']).toBe('30')
    expect(headers['X-RateLimit-Remaining']).toBe('25')
    expect(headers).not.toHaveProperty('Retry-After')
  })

  it('returns empty object when limit is 0 (Redis unavailable)', () => {
    const result: RateLimitResult = {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
    }

    expect(rateLimitHeaders(result)).toEqual({})
  })
})
