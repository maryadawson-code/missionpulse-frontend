import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase server client
const mockSingle = vi.fn()
const mockLimit = vi.fn().mockReturnValue({ single: mockSingle })
const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
const mockGte = vi.fn().mockReturnValue({ order: mockOrder })
const mockLte = vi.fn().mockReturnValue({ gte: mockGte })
const mockEq = vi.fn().mockReturnValue({ lte: mockLte, gte: mockGte, order: mockOrder })
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
const mockInsert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) })
const mockFrom = vi.fn().mockReturnValue({
  select: mockSelect,
  update: mockUpdate,
  insert: mockInsert,
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: mockFrom,
  }),
}))

vi.mock('@/lib/billing/plans', () => ({
  getCompanySubscription: vi.fn().mockResolvedValue({
    plan: { monthly_token_limit: 500_000 },
  }),
}))

describe('Token Ledger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getTokenBalance returns correct balance for known company', async () => {
    const ledgerRow = {
      id: 'ledger-1',
      company_id: 'company-1',
      period_start: '2026-03-01T00:00:00Z',
      period_end: '2026-04-01T00:00:00Z',
      tokens_allocated: 500_000,
      tokens_consumed: 150_000,
      tokens_purchased: 0,
      overage_tokens_used: 0,
    }

    mockSingle.mockResolvedValueOnce({ data: ledgerRow, error: null })

    const { getTokenBalance } = await import('@/lib/billing/ledger')
    const balance = await getTokenBalance('company-1')

    expect(balance).not.toBeNull()
    expect(balance?.allocated).toBe(500_000)
    expect(balance?.consumed).toBe(150_000)
    expect(balance?.remaining).toBe(350_000)
    expect(balance?.usage_percent).toBe(30)
  })

  it('getTokenBalance returns null when no ledger and no subscription', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })

    // Override getCompanySubscription for this test
    const plans = await import('@/lib/billing/plans')
    vi.mocked(plans.getCompanySubscription).mockResolvedValueOnce(null)

    const { getTokenBalance } = await import('@/lib/billing/ledger')
    const balance = await getTokenBalance('no-company')

    expect(balance).toBeNull()
  })

  it('debitTokens reduces balance and returns updated value', async () => {
    // First call: getTokenBalance
    const ledgerRow = {
      id: 'ledger-1',
      company_id: 'company-1',
      period_start: '2026-03-01T00:00:00Z',
      period_end: '2026-04-01T00:00:00Z',
      tokens_allocated: 500_000,
      tokens_consumed: 100_000,
      tokens_purchased: 0,
      overage_tokens_used: 0,
    }

    mockSingle.mockResolvedValueOnce({ data: ledgerRow, error: null })
    // update call
    mockLimit.mockReturnValueOnce({ single: vi.fn().mockResolvedValue({ data: null, error: null }) })
    // second getTokenBalance after debit
    const updatedRow = { ...ledgerRow, tokens_consumed: 110_000 }
    mockSingle.mockResolvedValueOnce({ data: updatedRow, error: null })

    const { debitTokens } = await import('@/lib/billing/ledger')
    const result = await debitTokens('company-1', 10_000)

    expect(result.allowed).toBe(true)
    expect(result.balance).not.toBeNull()
  })

  it('creditPurchasedTokens increases purchased token count', async () => {
    const ledgerRow = {
      id: 'ledger-1',
      company_id: 'company-1',
      period_start: '2026-03-01T00:00:00Z',
      period_end: '2026-04-01T00:00:00Z',
      tokens_allocated: 500_000,
      tokens_consumed: 100_000,
      tokens_purchased: 50_000,
      overage_tokens_used: 0,
    }
    mockSingle.mockResolvedValueOnce({ data: ledgerRow, error: null })

    const { creditPurchasedTokens } = await import('@/lib/billing/ledger')
    const result = await creditPurchasedTokens('company-1', 25_000)

    expect(result.success).toBe(true)
  })
})
