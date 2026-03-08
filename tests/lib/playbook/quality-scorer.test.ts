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
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
  }
  for (const k of Object.keys(c)) { if (!overrides[k]) c[k] = vi.fn().mockReturnValue(c) }
  Object.assign(c, overrides)
  return c
}

import { calculateQualityScore, getScoreBadge, recalculateAllScores, pinEntry, boostEntry } from '@/lib/playbook/quality-scorer'

describe('calculateQualityScore', () => {
  it('calculates composite score', () => {
    const s = calculateQualityScore({ relevanceSimilarity: 0.8, daysSinceLastUse: 0, useCount: 5, wasUsedInWin: true, wasUsedInLoss: false, isPinned: false, isBoosted: false })
    expect(s.total).toBeGreaterThan(0)
    expect(s.total).toBeLessThanOrEqual(100)
    expect(s.relevance).toBe(80)
    expect(s.freshness).toBe(100)
  })
  it('freshness decays', () => {
    const r = calculateQualityScore({ relevanceSimilarity: 0.5, daysSinceLastUse: 1, useCount: 1, wasUsedInWin: false, wasUsedInLoss: false, isPinned: false, isBoosted: false })
    const o = calculateQualityScore({ relevanceSimilarity: 0.5, daysSinceLastUse: 180, useCount: 1, wasUsedInWin: false, wasUsedInLoss: false, isPinned: false, isBoosted: false })
    expect(r.freshness).toBeGreaterThan(o.freshness)
  })
  it('loss base 30', () => {
    const s = calculateQualityScore({ relevanceSimilarity: 0.5, daysSinceLastUse: 0, useCount: 0, wasUsedInWin: false, wasUsedInLoss: true, isPinned: false, isBoosted: false })
    expect(s.winCorrelation).toBe(30)
  })
  it('pinned boost', () => {
    const u = calculateQualityScore({ relevanceSimilarity: 0.7, daysSinceLastUse: 10, useCount: 3, wasUsedInWin: false, wasUsedInLoss: false, isPinned: false, isBoosted: false })
    const p = calculateQualityScore({ relevanceSimilarity: 0.7, daysSinceLastUse: 10, useCount: 3, wasUsedInWin: false, wasUsedInLoss: false, isPinned: true, isBoosted: false })
    expect(p.total).toBeGreaterThan(u.total)
  })
  it('boosted +15', () => {
    const u = calculateQualityScore({ relevanceSimilarity: 0.5, daysSinceLastUse: 10, useCount: 1, wasUsedInWin: false, wasUsedInLoss: false, isPinned: false, isBoosted: false })
    const b = calculateQualityScore({ relevanceSimilarity: 0.5, daysSinceLastUse: 10, useCount: 1, wasUsedInWin: false, wasUsedInLoss: false, isPinned: false, isBoosted: true })
    expect(b.total).toBeGreaterThan(u.total)
  })
  it('minimum score is 5', () => {
    const s = calculateQualityScore({ relevanceSimilarity: 0, daysSinceLastUse: 9999, useCount: 0, wasUsedInWin: false, wasUsedInLoss: true, isPinned: false, isBoosted: false })
    expect(s.total).toBeGreaterThanOrEqual(5)
  })
})

describe('getScoreBadge', () => {
  it('Excellent >= 80', () => { expect(getScoreBadge(80).label).toBe('Excellent') })
  it('Good >= 60', () => { expect(getScoreBadge(60).label).toBe('Good') })
  it('Fair >= 40', () => { expect(getScoreBadge(40).label).toBe('Fair') })
  it('Low < 40', () => { expect(getScoreBadge(39).label).toBe('Low') })
})

describe('recalculateAllScores', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    expect(await recalculateAllScores()).toEqual({ scored: 0, errors: ['Not authenticated'] })
  })
  it('returns error when no company', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFrom.mockReturnValue(makeChain({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }))
    expect(await recalculateAllScores()).toEqual({ scored: 0, errors: ['No company'] })
  })
})

describe('pinEntry', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns error when not found', async () => {
    mockFrom.mockReturnValue(makeChain({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }))
    expect(await pinEntry('e1', true)).toEqual({ success: false, error: 'Entry not found' })
  })
  it('updates metadata', async () => {
    let n = 0; mockFrom.mockImplementation(() => { n++; if (n === 1) return makeChain({ single: vi.fn().mockResolvedValue({ data: { metadata: {} }, error: null }) }); const c = makeChain(); c.eq = vi.fn().mockResolvedValue({ error: null }); return c })
    expect(await pinEntry('e1', true)).toEqual({ success: true })
  })
})

describe('boostEntry', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns error when not found', async () => {
    mockFrom.mockReturnValue(makeChain({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }))
    expect(await boostEntry('e1', true)).toEqual({ success: false, error: 'Entry not found' })
  })
  it('updates metadata', async () => {
    let n = 0; mockFrom.mockImplementation(() => { n++; if (n === 1) return makeChain({ single: vi.fn().mockResolvedValue({ data: { metadata: {} }, error: null }) }); const c = makeChain(); c.eq = vi.fn().mockResolvedValue({ error: null }); return c })
    expect(await boostEntry('e1', true)).toEqual({ success: true })
  })
})
