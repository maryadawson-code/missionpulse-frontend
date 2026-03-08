import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  }),
}))

vi.mock('@/lib/billing/ledger', () => ({
  getTokenBalance: vi.fn(),
  debitTokens: vi.fn().mockResolvedValue({ allowed: true, balance: null }),
  getThresholdLevel: vi.fn(),
}))

vi.mock('@/lib/billing/plans', () => ({
  getCompanySubscription: vi.fn().mockResolvedValue({ auto_overage_enabled: false }),
}))

describe('Token Gate', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('allows when balance is normal', async () => {
    const { getTokenBalance, getThresholdLevel } = await import('@/lib/billing/ledger')
    vi.mocked(getTokenBalance).mockResolvedValueOnce({
      allocated: 500_000, consumed: 100_000, purchased: 0,
      overage_used: 0, remaining: 400_000, total_available: 500_000,
      usage_percent: 20, period_start: '2026-03-01', period_end: '2026-04-01',
    })
    vi.mocked(getThresholdLevel).mockResolvedValueOnce('normal')

    const { checkTokenGate } = await import('@/lib/billing/token-gate')
    const result = await checkTokenGate('company-1')

    expect(result.allowed).toBe(true)
    expect(result.threshold).toBe('normal')
  })

  it('blocks at hard_block (120%)', async () => {
    const { getTokenBalance, getThresholdLevel } = await import('@/lib/billing/ledger')
    vi.mocked(getTokenBalance).mockResolvedValueOnce({
      allocated: 500_000, consumed: 600_000, purchased: 0,
      overage_used: 100_000, remaining: 0, total_available: 500_000,
      usage_percent: 120, period_start: '2026-03-01', period_end: '2026-04-01',
    })
    vi.mocked(getThresholdLevel).mockResolvedValueOnce('hard_block')

    const { checkTokenGate } = await import('@/lib/billing/token-gate')
    const result = await checkTokenGate('company-1')

    expect(result.allowed).toBe(false)
    expect(result.threshold).toBe('hard_block')
    expect(result.upgrade_cta).toBe(true)
  })

  it('allows with warning when no balance (provisioning gap)', async () => {
    const { getTokenBalance } = await import('@/lib/billing/ledger')
    vi.mocked(getTokenBalance).mockResolvedValueOnce(null)

    const { checkTokenGate } = await import('@/lib/billing/token-gate')
    const result = await checkTokenGate('company-1')

    expect(result.allowed).toBe(true)
    expect(result.threshold).toBe('warning')
  })
})
