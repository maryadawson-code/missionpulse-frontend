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
import { GET, PATCH, DELETE } from '@/app/api/v1/opportunities/[id]/route'

function makeRequest(method: string, body?: unknown, headers: Record<string, string> = {}) {
  const init: RequestInit = {
    method,
    headers: { 'content-type': 'application/json', ...headers },
  }
  if (body !== undefined) {
    init.body = JSON.stringify(body)
  }
  return new NextRequest(new URL('https://test.local/api/v1/opportunities/opp-1'), init)
}

const paramsPromise = Promise.resolve({ id: 'opp-1' })

describe('/api/v1/opportunities/[id]', () => {
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
    it('returns 401 without auth', async () => {
      const res = await GET(makeRequest('GET'), { params: paramsPromise })
      expect(res.status).toBe(401)
    })

    it('returns 403 when read permission missing', async () => {
      mockValidateAPIKey.mockResolvedValue({
        valid: true, companyId: 'co-1', permissions: ['write'], rateLimit: 100,
      })
      const res = await GET(makeRequest('GET', undefined, { authorization: 'Bearer key' }), { params: paramsPromise })
      expect(res.status).toBe(403)
    })

    it('returns 404 when opportunity not found', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
        }),
      })
      const res = await GET(makeRequest('GET', undefined, { authorization: 'Bearer key' }), { params: paramsPromise })
      expect(res.status).toBe(404)
    })

    it('returns opportunity data on success', async () => {
      const opp = { id: 'opp-1', title: 'Test', company_id: 'co-1' }
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: opp, error: null }),
            }),
          }),
        }),
      })
      const res = await GET(makeRequest('GET', undefined, { authorization: 'Bearer key' }), { params: paramsPromise })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toEqual(opp)
    })
  })

  // ── PATCH ────────────────────────────────────────────────
  describe('PATCH', () => {
    it('returns 401 without auth', async () => {
      const res = await PATCH(makeRequest('PATCH', { title: 'Updated' }), { params: paramsPromise })
      expect(res.status).toBe(401)
    })

    it('returns 403 without write permission', async () => {
      mockValidateAPIKey.mockResolvedValue({
        valid: true, companyId: 'co-1', permissions: ['read'], rateLimit: 100,
      })
      const res = await PATCH(makeRequest('PATCH', { title: 'Up' }, { authorization: 'Bearer key' }), { params: paramsPromise })
      expect(res.status).toBe(403)
    })

    it('returns 400 for invalid JSON', async () => {
      const req = new NextRequest(new URL('https://test.local/api/v1/opportunities/opp-1'), {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', authorization: 'Bearer key' },
        body: 'bad-json',
      })
      const res = await PATCH(req, { params: paramsPromise })
      expect(res.status).toBe(400)
    })

    it('returns 400 when validation fails', async () => {
      const res = await PATCH(
        makeRequest('PATCH', { title: '' }, { authorization: 'Bearer key' }),
        { params: paramsPromise }
      )
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('Validation failed')
    })

    it('returns updated data on success', async () => {
      mockSupabaseFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'opp-1', title: 'Updated', status: 'active' },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      })
      const res = await PATCH(
        makeRequest('PATCH', { title: 'Updated' }, { authorization: 'Bearer key' }),
        { params: paramsPromise }
      )
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.title).toBe('Updated')
    })

    it('returns 400 on update error', async () => {
      mockSupabaseFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' },
                }),
              }),
            }),
          }),
        }),
      })
      const res = await PATCH(
        makeRequest('PATCH', { title: 'X' }, { authorization: 'Bearer key' }),
        { params: paramsPromise }
      )
      expect(res.status).toBe(400)
    })
  })

  // ── DELETE ───────────────────────────────────────────────
  describe('DELETE', () => {
    it('returns 401 without auth', async () => {
      const res = await DELETE(makeRequest('DELETE'), { params: paramsPromise })
      expect(res.status).toBe(401)
    })

    it('returns 403 without write permission', async () => {
      mockValidateAPIKey.mockResolvedValue({
        valid: true, companyId: 'co-1', permissions: ['read'], rateLimit: 100,
      })
      const res = await DELETE(makeRequest('DELETE', undefined, { authorization: 'Bearer key' }), { params: paramsPromise })
      expect(res.status).toBe(403)
    })

    it('returns success on delete', async () => {
      mockSupabaseFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      })
      const res = await DELETE(makeRequest('DELETE', undefined, { authorization: 'Bearer key' }), { params: paramsPromise })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
    })

    it('returns 400 on delete error', async () => {
      mockSupabaseFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: { message: 'FK constraint' } }),
          }),
        }),
      })
      const res = await DELETE(makeRequest('DELETE', undefined, { authorization: 'Bearer key' }), { params: paramsPromise })
      expect(res.status).toBe(400)
    })
  })
})
