import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock chain builder ──────────────────────────────────────────
function chainable(overrides: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {}
  const self = () => chain
  const methods = ['select', 'eq', 'gte', 'lte', 'lt', 'order', 'limit', 'in', 'single']
  for (const m of methods) chain[m] = vi.fn(self)
  chain.update = vi.fn(self)
  chain.insert = vi.fn().mockResolvedValue({ data: [{ id: '1' }], error: null })
  chain.delete = vi.fn(self)
  Object.assign(chain, overrides)
  return chain
}

const mockFrom = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

vi.mock('@/lib/logging/logger', () => ({
  createLogger: vi.fn().mockReturnValue({
    info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn(),
  }),
}))

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/cron/daily/route'

function makeRequest(headers: Record<string, string> = {}) {
  return new NextRequest(new URL('https://test.local/api/cron/daily'), {
    method: 'GET',
    headers,
  })
}

describe('GET /api/cron/daily', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = 'test-secret'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'

    // Default: all queries return empty data with chainable methods
    mockFrom.mockImplementation(() => {
      const c = chainable()
      // Make terminal methods resolve with data
      c.single = vi.fn().mockResolvedValue({ data: null, error: null })
      // select/update/delete at the end of a chain should resolve
      const resolveData = vi.fn().mockResolvedValue({ data: [], error: null, count: 0 })
      // Override: the last call in a chain returns the resolved value
      // We need the chain to resolve at the right point
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lt: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            ...Object.fromEntries(['select', 'eq', 'gte', 'lte', 'lt', 'order', 'limit', 'in', 'single'].map(m => [m, vi.fn().mockReturnThis()])),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            // For the pilots query
            data: [],
            error: null,
            then: (fn: (v: { data: unknown[], error: null }) => void) => Promise.resolve({ data: [], error: null }).then(fn),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          lt: vi.fn().mockResolvedValue({ count: 0, error: null }),
        }),
        insert: vi.fn().mockResolvedValue({ data: [{ id: '1' }], error: null }),
      }
    })
  })

  it('returns 401 when CRON_SECRET is missing', async () => {
    delete process.env.CRON_SECRET
    const res = await GET(makeRequest({ authorization: 'Bearer anything' }))
    expect(res.status).toBe(401)
  })

  it('returns 401 when authorization header is missing', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })

  it('returns 401 when bearer token does not match', async () => {
    const res = await GET(makeRequest({ authorization: 'Bearer wrong-secret' }))
    expect(res.status).toBe(401)
  })

  it('returns 200 with success payload on valid auth', async () => {
    const res = await GET(makeRequest({ authorization: 'Bearer test-secret' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body).toHaveProperty('expired_pilots')
    expect(body).toHaveProperty('engagement_updated')
    expect(body).toHaveProperty('retention_cleaned')
    expect(body).toHaveProperty('ran_at')
  })

  it('returns 500 when supabase throws', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('DB down')
    })

    // The first supabase call will throw
    const res = await GET(makeRequest({ authorization: 'Bearer test-secret' }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('DB down')
  })
})
