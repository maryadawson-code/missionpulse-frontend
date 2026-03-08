import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockValidateAPIKey = vi.fn()
const mockCheckRateLimit = vi.fn()
const mockGetRateLimitHeaders = vi.fn()
const mockSupabaseFrom = vi.fn()

vi.mock('@/lib/api/keys', () => ({
  validateAPIKey: (...args: unknown[]) => mockValidateAPIKey(...args),
}))

vi.mock('@/lib/api/rate-limiter', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  getRateLimitHeaders: (...args: unknown[]) => mockGetRateLimitHeaders(...args),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
  }),
}))

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/v1/opportunities/route'

function makeRequest(method: string, body?: unknown, headers: Record<string, string> = {}) {
  const init: RequestInit = {
    method,
    headers: { 'content-type': 'application/json', ...headers },
  }
  if (body !== undefined) {
    init.body = JSON.stringify(body)
  }
  return new NextRequest(new URL('https://test.local/api/v1/opportunities'), init)
}

describe('/api/v1/opportunities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockValidateAPIKey.mockResolvedValue({
      valid: true,
      companyId: 'co-1',
      permissions: ['read', 'write', 'ai'],
      rateLimit: 100,
    })
    mockCheckRateLimit.mockReturnValue({ allowed: true, remaining: 99 })
    mockGetRateLimitHeaders.mockReturnValue({ 'X-RateLimit-Remaining': '99' })
  })

  // ── GET ──────────────────────────────────────────────────
  describe('GET', () => {
    it('returns 401 without auth header', async () => {
      const res = await GET(makeRequest('GET'))
      expect(res.status).toBe(401)
    })

    it('returns 401 with invalid key', async () => {
      mockValidateAPIKey.mockResolvedValue(null)
      const res = await GET(makeRequest('GET', undefined, { authorization: 'Bearer bad' }))
      expect(res.status).toBe(401)
    })

    it('returns 429 when rate limited', async () => {
      mockCheckRateLimit.mockReturnValue({ allowed: false, remaining: 0 })
      const res = await GET(makeRequest('GET', undefined, { authorization: 'Bearer key' }))
      expect(res.status).toBe(429)
    })

    it('returns 403 when read permission missing', async () => {
      mockValidateAPIKey.mockResolvedValue({
        valid: true, companyId: 'co-1', permissions: ['write'], rateLimit: 100,
      })
      const res = await GET(makeRequest('GET', undefined, { authorization: 'Bearer key' }))
      expect(res.status).toBe(403)
    })

    it('returns opportunities list on success', async () => {
      const opps = [{ id: 'opp-1', title: 'Test Opp' }]
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: opps, error: null }),
            }),
          }),
        }),
      })
      const res = await GET(makeRequest('GET', undefined, { authorization: 'Bearer key' }))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toEqual(opps)
      expect(body.count).toBe(1)
    })

    it('returns 500 on db error', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
            }),
          }),
        }),
      })
      const res = await GET(makeRequest('GET', undefined, { authorization: 'Bearer key' }))
      expect(res.status).toBe(500)
    })
  })

  // ── POST ─────────────────────────────────────────────────
  describe('POST', () => {
    it('returns 401 without auth header', async () => {
      const res = await POST(makeRequest('POST', { title: 'test' }))
      expect(res.status).toBe(401)
    })

    it('returns 403 when write permission missing', async () => {
      mockValidateAPIKey.mockResolvedValue({
        valid: true, companyId: 'co-1', permissions: ['read'], rateLimit: 100,
      })
      const res = await POST(makeRequest('POST', { title: 'test' }, { authorization: 'Bearer key' }))
      expect(res.status).toBe(403)
    })

    it('returns 400 for invalid JSON', async () => {
      const req = new NextRequest(new URL('https://test.local/api/v1/opportunities'), {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer key' },
        body: 'not-json',
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('returns 400 when validation fails', async () => {
      const res = await POST(makeRequest('POST', { title: '' }, { authorization: 'Bearer key' }))
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('Validation failed')
    })

    it('returns 201 on successful create', async () => {
      mockSupabaseFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'opp-new', title: 'New Opp', agency: null, status: 'draft' },
              error: null,
            }),
          }),
        }),
      })
      const res = await POST(makeRequest('POST', { title: 'New Opp' }, { authorization: 'Bearer key' }))
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.id).toBe('opp-new')
    })

    it('returns 400 on insert error', async () => {
      mockSupabaseFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Duplicate title' },
            }),
          }),
        }),
      })
      const res = await POST(makeRequest('POST', { title: 'Dup' }, { authorization: 'Bearer key' }))
      expect(res.status).toBe(400)
    })
  })
})
