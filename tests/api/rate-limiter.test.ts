import { describe, it, expect, beforeEach } from 'vitest'
import { checkRateLimit, getRateLimitHeaders, TIER_LIMITS } from '@/lib/api/rate-limiter'

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Each test uses a unique key to avoid cross-test state
  })

  describe('TIER_LIMITS', () => {
    it('defines correct tier limits', () => {
      expect(TIER_LIMITS.starter).toBe(0)
      expect(TIER_LIMITS.professional).toBe(100)
      expect(TIER_LIMITS.enterprise).toBe(1000)
    })
  })

  describe('checkRateLimit', () => {
    it('allows first request within limit', () => {
      const result = checkRateLimit('test-key-1', 100)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(99)
      expect(result.resetAt).toBeGreaterThan(Date.now() - 1000)
    })

    it('decrements remaining on subsequent requests', () => {
      const key = 'test-key-2'
      checkRateLimit(key, 100)
      const result = checkRateLimit(key, 100)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(98)
    })

    it('blocks when limit exceeded', () => {
      const key = 'test-key-3'
      for (let i = 0; i < 5; i++) {
        checkRateLimit(key, 5)
      }
      const result = checkRateLimit(key, 5)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('allows request with limit of 1', () => {
      const result = checkRateLimit('test-key-4', 1)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(0)
    })

    it('blocks second request with limit of 1', () => {
      const key = 'test-key-5'
      checkRateLimit(key, 1)
      const result = checkRateLimit(key, 1)
      expect(result.allowed).toBe(false)
    })

    it('returns valid resetAt timestamp', () => {
      const before = Date.now()
      const result = checkRateLimit('test-key-6', 100)
      expect(result.resetAt).toBeGreaterThanOrEqual(before)
      expect(result.resetAt).toBeLessThanOrEqual(before + 61000)
    })

    it('tracks different keys independently', () => {
      for (let i = 0; i < 3; i++) checkRateLimit('key-a', 3)
      const resultA = checkRateLimit('key-a', 3)
      const resultB = checkRateLimit('key-b', 3)
      expect(resultA.allowed).toBe(false)
      expect(resultB.allowed).toBe(true)
    })
  })

  describe('getRateLimitHeaders', () => {
    it('returns correct headers', () => {
      const result = { allowed: true, remaining: 95, resetAt: 1700000000000 }
      const headers = getRateLimitHeaders(result, 100)
      expect(headers['X-RateLimit-Limit']).toBe('100')
      expect(headers['X-RateLimit-Remaining']).toBe('95')
      expect(headers['X-RateLimit-Reset']).toBe('1700000000')
    })

    it('clamps remaining to 0 minimum', () => {
      const result = { allowed: false, remaining: -5, resetAt: 1700000000000 }
      const headers = getRateLimitHeaders(result, 100)
      expect(headers['X-RateLimit-Remaining']).toBe('0')
    })

    it('formats all values as strings', () => {
      const result = { allowed: true, remaining: 50, resetAt: 1700000060000 }
      const headers = getRateLimitHeaders(result, 200)
      expect(typeof headers['X-RateLimit-Limit']).toBe('string')
      expect(typeof headers['X-RateLimit-Remaining']).toBe('string')
      expect(typeof headers['X-RateLimit-Reset']).toBe('string')
    })
  })
})
