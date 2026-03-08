import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFrom, mockGetSession, mockListBuckets, mockSupabase } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockGetSession = vi.fn()
  const mockListBuckets = vi.fn()
  const mockSupabase = { from: mockFrom, auth: { getSession: mockGetSession }, storage: { listBuckets: mockListBuckets } }
  return { mockFrom, mockGetSession, mockListBuckets, mockSupabase }
})

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn().mockResolvedValue(mockSupabase) }))
vi.mock('@/lib/cache/redis', () => ({ getRedis: vi.fn().mockReturnValue(null) }))
vi.mock('stripe', () => {
  function M() { return { balance: { retrieve: vi.fn().mockResolvedValue({}) } } }
  M.prototype = {}
  return { default: M, __esModule: true }
})

function makeChain(overrides: Record<string, unknown> = {}) {
  const c: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [{ id: '1' }], error: null }),
  }
  Object.assign(c, overrides)
  return c
}

import { checkDatabase, checkAuth, checkRedis, checkStorage, checkStripe, checkSamGov, checkAiGateway, runAllChecks } from '@/lib/monitoring/health-checks'

describe('checkDatabase', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns healthy', async () => {
    mockFrom.mockReturnValue(makeChain())
    expect((await checkDatabase()).status).toBe('healthy')
  })
  it('returns degraded on error', async () => {
    mockFrom.mockReturnValue(makeChain({ limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'err' } }) }))
    expect((await checkDatabase()).status).toBe('degraded')
  })
})

describe('checkAuth', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns healthy', async () => {
    mockGetSession.mockResolvedValue({ data: {}, error: null })
    expect((await checkAuth()).status).toBe('healthy')
  })
})

describe('checkRedis', () => {
  it('returns healthy when null', async () => {
    expect((await checkRedis()).status).toBe('healthy')
  })
  it('returns unhealthy on error', async () => {
    const { getRedis } = await import('@/lib/cache/redis')
    vi.mocked(getRedis).mockReturnValue({ ping: vi.fn().mockRejectedValue(new Error('down')) } as never)
    expect((await checkRedis()).status).toBe('unhealthy')
  })
})

describe('checkStorage', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns healthy', async () => {
    mockListBuckets.mockResolvedValue({ error: null })
    expect((await checkStorage()).status).toBe('healthy')
  })
})

describe('checkStripe', () => {
  it('returns degraded when not configured', async () => {
    delete process.env.STRIPE_SECRET_KEY
    expect((await checkStripe()).status).toBe('degraded')
  })
  it('returns healthy when configured', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test'
    expect((await checkStripe()).status).toBe('healthy')
  })
})

describe('checkSamGov', () => {
  it('returns degraded when not configured', async () => {
    delete process.env.SAM_GOV_API_KEY
    expect((await checkSamGov()).status).toBe('degraded')
  })
  it('returns healthy when fetch ok', async () => {
    process.env.SAM_GOV_API_KEY = 'key'
    global.fetch = vi.fn().mockResolvedValue({ ok: true })
    expect((await checkSamGov()).status).toBe('healthy')
  })
})

describe('checkAiGateway', () => {
  it('returns degraded when no provider', async () => {
    delete process.env.ASKSAGE_API_KEY; delete process.env.ANTHROPIC_API_KEY; delete process.env.OPENAI_API_KEY
    expect((await checkAiGateway()).status).toBe('degraded')
  })
  it('returns healthy when provider set', async () => {
    process.env.ANTHROPIC_API_KEY = 'key'
    expect((await checkAiGateway()).status).toBe('healthy')
  })
})

describe('runAllChecks', () => {
  beforeEach(() => { vi.clearAllMocks(); process.env.STRIPE_SECRET_KEY = 'sk'; process.env.ANTHROPIC_API_KEY = 'key'; delete process.env.SAM_GOV_API_KEY })
  it('returns health report', async () => {
    mockFrom.mockReturnValue(makeChain())
    mockGetSession.mockResolvedValue({ data: {}, error: null })
    mockListBuckets.mockResolvedValue({ error: null })
    const { getRedis } = await import('@/lib/cache/redis')
    vi.mocked(getRedis).mockReturnValue(null)
    const report = await runAllChecks()
    expect(report).toHaveProperty('status')
    expect(report).toHaveProperty('checks')
    expect(Object.keys(report.checks)).toEqual(expect.arrayContaining(['database', 'auth', 'redis']))
  })
})
