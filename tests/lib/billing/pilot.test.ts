import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFrom, mockGetUser, mockSupabase } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockGetUser = vi.fn()
  const mockSupabase = { from: mockFrom, auth: { getUser: mockGetUser } }
  return { mockFrom, mockGetUser, mockSupabase }
})

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn().mockResolvedValue(mockSupabase) }))
vi.mock('@/lib/rbac/config', () => ({ resolveRole: vi.fn((r: string) => r ?? 'viewer') }))
vi.mock('@/lib/billing/plans', () => ({
  getPlans: vi.fn().mockResolvedValue([{ id: 'p1', slug: 'growth', name: 'Growth', annual_price: 1000, monthly_token_limit: 100000 }]),
  getCompanySubscription: vi.fn().mockResolvedValue(null),
}))

/**
 * Thenable chain mock: all methods return `this`, and awaiting the chain resolves to `resolveWith`.
 */
function makeChain(resolveWith: Record<string, unknown> = { data: null, error: null }) {
  const c: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'in', 'single', 'upsert', 'insert', 'update', 'order', 'limit', 'lt']
  for (const m of methods) {
    c[m] = vi.fn().mockReturnValue(c)
  }
  c.then = (resolve: (v: unknown) => void, reject: (e: unknown) => void) => {
    try { resolve(resolveWith) } catch (e) { reject(e) }
  }
  return c
}

import { startPilot, expirePilot, convertPilot, extendPilot, getActivePilots, expireOverduePilots } from '@/lib/billing/pilot'

describe('startPilot', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    expect(await startPilot('c1', 'growth')).toEqual({ success: false, error: 'Not authenticated' })
  })
  it('returns error for non-executive', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFrom.mockReturnValue(makeChain({ data: { role: 'viewer' }, error: null }))
    const { resolveRole } = await import('@/lib/rbac/config')
    vi.mocked(resolveRole).mockReturnValue('viewer')
    expect(await startPilot('c1', 'growth')).toEqual({ success: false, error: 'Only executives can start pilots' })
  })
  it('returns error when already active', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFrom.mockReturnValue(makeChain({ data: { role: 'executive' }, error: null }))
    const { resolveRole } = await import('@/lib/rbac/config')
    vi.mocked(resolveRole).mockReturnValue('executive')
    const { getCompanySubscription } = await import('@/lib/billing/plans')
    vi.mocked(getCompanySubscription).mockResolvedValue({ status: 'active' } as never)
    expect(await startPilot('c1', 'growth')).toEqual({ success: false, error: 'Company already has an active subscription or pilot' })
  })
  it('returns error when plan not found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFrom.mockReturnValue(makeChain({ data: { role: 'executive' }, error: null }))
    const { resolveRole } = await import('@/lib/rbac/config')
    vi.mocked(resolveRole).mockReturnValue('executive')
    const { getCompanySubscription } = await import('@/lib/billing/plans')
    vi.mocked(getCompanySubscription).mockResolvedValue(null)
    expect(await startPilot('c1', 'nonexistent')).toEqual({ success: false, error: 'Plan not found' })
  })
  it('creates pilot successfully', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFrom.mockReturnValue(makeChain({ data: { role: 'executive' }, error: null }))
    const { resolveRole } = await import('@/lib/rbac/config')
    vi.mocked(resolveRole).mockReturnValue('executive')
    const { getCompanySubscription } = await import('@/lib/billing/plans')
    vi.mocked(getCompanySubscription).mockResolvedValue(null)
    expect(await startPilot('c1', 'growth')).toEqual({ success: true })
  })
})

describe('expirePilot', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns success', async () => {
    mockFrom.mockReturnValue(makeChain({ error: null }))
    expect(await expirePilot('c1')).toEqual({ success: true })
  })
  it('returns error on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ error: { message: 'db error' } }))
    expect(await expirePilot('c1')).toEqual({ success: false, error: 'db error' })
  })
})

describe('convertPilot', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns error when no subscription', async () => {
    const { getCompanySubscription } = await import('@/lib/billing/plans')
    vi.mocked(getCompanySubscription).mockResolvedValue(null)
    expect(await convertPilot('c1')).toEqual({ success: false, creditCents: 0, error: 'No subscription found' })
  })
  it('converts with credit', async () => {
    const { getCompanySubscription } = await import('@/lib/billing/plans')
    vi.mocked(getCompanySubscription).mockResolvedValue({ status: 'pilot' } as never)
    let n = 0
    mockFrom.mockImplementation(() => {
      n++
      if (n === 1) return makeChain({ data: { pilot_amount_cents: 50000 }, error: null })
      return makeChain({ error: null })
    })
    const result = await convertPilot('c1')
    expect(result.success).toBe(true)
    expect(result.creditCents).toBe(50000)
  })
})

describe('extendPilot', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns error when no active pilot', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    expect(await extendPilot('c1')).toEqual({ success: false, error: 'No active pilot found' })
  })
  it('returns error when already extended', async () => {
    mockFrom.mockReturnValue(makeChain({ data: { pilot_end_date: '2025-02-01', metadata: { extended: true } }, error: null }))
    expect(await extendPilot('c1')).toEqual({ success: false, error: 'Pilot already extended (one-time only)' })
  })
  it('extends by 7 days', async () => {
    let n = 0
    mockFrom.mockImplementation(() => {
      n++
      if (n === 1) return makeChain({ data: { pilot_end_date: '2025-02-01T00:00:00Z', metadata: {} }, error: null })
      return makeChain({ error: null })
    })
    const result = await extendPilot('c1')
    expect(result.success).toBe(true)
    expect(result.newEndDate).toBeDefined()
  })
})

describe('getActivePilots', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns empty when no pilots', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [] }))
    expect(await getActivePilots()).toEqual([])
  })
})

describe('expireOverduePilots', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns count of expired', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [{ id: '1' }, { id: '2' }] }))
    expect(await expireOverduePilots()).toBe(2)
  })
  it('returns 0 when none', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null }))
    expect(await expireOverduePilots()).toBe(0)
  })
})
