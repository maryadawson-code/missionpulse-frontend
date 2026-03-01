/**
 * Token Gate + Ledger tests.
 *
 * Tests the threshold logic (pure function) and the token gate's decision
 * matrix by mocking the ledger and subscription dependencies.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the ledger module to avoid Supabase calls
vi.mock('../ledger', () => ({
  getTokenBalance: vi.fn(),
  debitTokens: vi.fn(),
  getThresholdLevel: vi.fn(),
}))

// Mock plans module
vi.mock('../plans', () => ({
  getCompanySubscription: vi.fn(),
}))

// Mock supabase server
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}))

import { checkTokenGate, type TokenGateResult as _TokenGateResult } from '../token-gate'
import { getTokenBalance, getThresholdLevel } from '../ledger'
import { getCompanySubscription } from '../plans'
import type { TokenBalance } from '../ledger'

const mockedGetTokenBalance = vi.mocked(getTokenBalance)
const mockedGetThresholdLevel = vi.mocked(getThresholdLevel)
const mockedGetCompanySubscription = vi.mocked(getCompanySubscription)

function makeBalance(overrides: Partial<TokenBalance> = {}): TokenBalance {
  return {
    allocated: 100_000,
    consumed: 0,
    purchased: 0,
    overage_used: 0,
    remaining: 100_000,
    total_available: 100_000,
    usage_percent: 0,
    period_start: '2026-02-01T00:00:00Z',
    period_end: '2026-03-01T00:00:00Z',
    ...overrides,
  }
}

describe('checkTokenGate()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('blocks when no balance exists (no subscription)', async () => {
    mockedGetTokenBalance.mockResolvedValue(null)

    const result = await checkTokenGate('company-1')
    expect(result.allowed).toBe(false)
    expect(result.threshold).toBe('hard_block')
    expect(result.balance).toBeNull()
    expect(result.upgrade_cta).toBe(true)
  })

  it('allows with normal threshold at 0% usage', async () => {
    const balance = makeBalance({ usage_percent: 0, consumed: 0, remaining: 100_000 })
    mockedGetTokenBalance.mockResolvedValue(balance)
    mockedGetThresholdLevel.mockResolvedValue('normal')

    const result = await checkTokenGate('company-1')
    expect(result.allowed).toBe(true)
    expect(result.threshold).toBe('normal')
    expect(result.message).toBeNull()
    expect(result.upgrade_cta).toBe(false)
  })

  it('allows with info banner at 50% usage', async () => {
    const balance = makeBalance({ usage_percent: 50, consumed: 50_000, remaining: 50_000 })
    mockedGetTokenBalance.mockResolvedValue(balance)
    mockedGetThresholdLevel.mockResolvedValue('info')

    const result = await checkTokenGate('company-1')
    expect(result.allowed).toBe(true)
    expect(result.threshold).toBe('info')
    expect(result.message).toContain('50%')
  })

  it('allows with warning at 75% usage and shows upgrade CTA', async () => {
    const balance = makeBalance({ usage_percent: 75, consumed: 75_000, remaining: 25_000 })
    mockedGetTokenBalance.mockResolvedValue(balance)
    mockedGetThresholdLevel.mockResolvedValue('warning')

    const result = await checkTokenGate('company-1')
    expect(result.allowed).toBe(true)
    expect(result.threshold).toBe('warning')
    expect(result.upgrade_cta).toBe(true)
  })

  it('allows with urgent warning at 90% usage', async () => {
    const balance = makeBalance({ usage_percent: 90, consumed: 90_000, remaining: 10_000 })
    mockedGetTokenBalance.mockResolvedValue(balance)
    mockedGetThresholdLevel.mockResolvedValue('urgent')

    const result = await checkTokenGate('company-1')
    expect(result.allowed).toBe(true)
    expect(result.threshold).toBe('urgent')
    expect(result.upgrade_cta).toBe(true)
  })

  it('hard-blocks at 120% usage', async () => {
    const balance = makeBalance({ usage_percent: 120, consumed: 120_000, remaining: 0 })
    mockedGetTokenBalance.mockResolvedValue(balance)
    mockedGetThresholdLevel.mockResolvedValue('hard_block')

    const result = await checkTokenGate('company-1')
    expect(result.allowed).toBe(false)
    expect(result.threshold).toBe('hard_block')
    expect(result.upgrade_cta).toBe(true)
    expect(result.grace_period).toBe(false)
  })

  it('soft-blocks at 100% when no grace period and no auto-overage', async () => {
    const balance = makeBalance({
      usage_percent: 100, consumed: 100_000, remaining: 0,
      total_available: 100_000,
    })
    mockedGetTokenBalance.mockResolvedValue(balance)
    mockedGetThresholdLevel.mockResolvedValue('soft_block')
    mockedGetCompanySubscription.mockResolvedValue(null)

    const result = await checkTokenGate('company-1')
    expect(result.allowed).toBe(false)
    expect(result.threshold).toBe('soft_block')
  })

  it('allows at soft-block with auto-overage enabled', async () => {
    const balance = makeBalance({
      usage_percent: 100, consumed: 100_000, remaining: 0,
      total_available: 100_000,
    })
    mockedGetTokenBalance.mockResolvedValue(balance)
    mockedGetThresholdLevel.mockResolvedValue('soft_block')
    mockedGetCompanySubscription.mockResolvedValue({
      auto_overage_enabled: true,
    } as ReturnType<typeof getCompanySubscription> extends Promise<infer T> ? T : never)

    const result = await checkTokenGate('company-1')
    expect(result.allowed).toBe(true)
    expect(result.threshold).toBe('soft_block')
    expect(result.grace_period).toBe(false)
  })
})
