import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFrom, mockGetUser, mockSupabase } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockGetUser = vi.fn()
  const mockSupabase = { from: mockFrom, auth: { getUser: mockGetUser } }
  return { mockFrom, mockGetUser, mockSupabase }
})

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn().mockResolvedValue(mockSupabase) }))

function makeChain(overrides: Record<string, unknown> = {}) {
  const c: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(), lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(), insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    limit: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
  }
  for (const k of Object.keys(c)) { if (!overrides[k]) c[k] = vi.fn().mockReturnValue(c) }
  Object.assign(c, overrides)
  return c
}

import { calculateEngagement, updateEngagementScore, updateAllPilotEngagement, calculateEngagementScore, generateROISummary } from '@/lib/billing/engagement'

describe('calculateEngagement', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns engagement result with score and factors', async () => {
    mockFrom.mockReturnValue(makeChain())
    const result = await calculateEngagement('c1')
    expect(result).toHaveProperty('score')
    expect(result).toHaveProperty('factors')
    expect(result).toHaveProperty('computedAt')
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })
})

describe('updateEngagementScore', () => {
  beforeEach(() => vi.clearAllMocks())
  it('calculates and persists', async () => {
    mockFrom.mockReturnValue(makeChain())
    const result = await updateEngagementScore('c1')
    expect(result).toHaveProperty('score')
    expect(mockFrom).toHaveBeenCalledWith('company_subscriptions')
  })
})

describe('updateAllPilotEngagement', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns 0 when no pilots', async () => {
    const c = makeChain(); c.eq = vi.fn().mockResolvedValue({ data: null })
    mockFrom.mockReturnValue(c)
    expect(await updateAllPilotEngagement()).toBe(0)
  })
  it('updates all pilots', async () => {
    let n = 0
    mockFrom.mockImplementation(() => {
      n++
      if (n === 1) { const c = makeChain(); c.eq = vi.fn().mockResolvedValue({ data: [{ company_id: 'c1' }] }); return c }
      return makeChain()
    })
    expect(await updateAllPilotEngagement()).toBe(1)
  })
})

describe('calculateEngagementScore', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns result with tier', async () => {
    mockFrom.mockReturnValue(makeChain())
    const result = await calculateEngagementScore('c1')
    expect(result).toHaveProperty('tier')
    expect(['healthy', 'at_risk', 'critical']).toContain(result.tier)
    expect(mockFrom).toHaveBeenCalledWith('pilot_engagement_scores')
  })
})

describe('generateROISummary', () => {
  beforeEach(() => vi.clearAllMocks())
  it('generates summary', async () => {
    mockFrom.mockReturnValue(makeChain())
    const result = await generateROISummary('c1', '2025-01-01')
    expect(result).toHaveProperty('proposalsDrafted')
    expect(result).toHaveProperty('timeSavedHours')
    expect(result).toHaveProperty('daysActive')
    expect(result.daysActive).toBeGreaterThan(0)
  })
  it('uses 30-day default when null', async () => {
    mockFrom.mockReturnValue(makeChain())
    const result = await generateROISummary('c1', null)
    expect(result.daysActive).toBeGreaterThan(0)
  })
})
