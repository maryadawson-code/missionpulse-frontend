import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFrom, mockGetUser, mockSupabase, mockCouponsCreate, mockSessionsCreate } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockGetUser = vi.fn()
  const mockSupabase = {
    from: mockFrom,
    auth: { getUser: mockGetUser },
    storage: { from: vi.fn() },
  }
  const mockCouponsCreate = vi.fn().mockResolvedValue({ id: 'coupon_test' })
  const mockSessionsCreate = vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' })
  return { mockFrom, mockGetUser, mockSupabase, mockCouponsCreate, mockSessionsCreate }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

vi.mock('@/lib/billing/ledger', () => ({
  getTokenBalance: vi.fn().mockResolvedValue({ consumed: 5000, allocated: 10000 }),
}))

vi.mock('@/lib/billing/engagement', () => ({
  calculateEngagement: vi.fn().mockResolvedValue({ score: 75 }),
}))

vi.mock('@/lib/billing/stripe', () => ({
  getOrCreateCustomer: vi.fn().mockResolvedValue('cus_test123'),
}))

vi.mock('stripe', () => {
  function MockStripe() {
    return {
      coupons: { create: mockCouponsCreate },
      checkout: { sessions: { create: mockSessionsCreate } },
    }
  }
  MockStripe.prototype = {}
  return { default: MockStripe, __esModule: true }
})

function makeChain(overrides: Record<string, unknown> = {}) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    in: vi.fn().mockReturnThis(),
  }
  for (const key of Object.keys(chain)) {
    if (!overrides[key]) chain[key] = vi.fn().mockReturnValue(chain)
  }
  Object.assign(chain, overrides)
  return chain
}

import {
  getPilotStatus,
  generateROIReport,
  createConversionCheckout,
  handleConversionSuccess,
  getPilotBannerData,
} from '@/lib/billing/pilot-conversion'

describe('getPilotStatus', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns not pilot when no subscription found', async () => {
    mockFrom.mockReturnValue(makeChain({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }))
    const result = await getPilotStatus('comp-1')
    expect(result.isPilot).toBe(false)
    expect(result.daysRemaining).toBe(0)
    expect(result.showBanner).toBe(false)
  })

  it('returns pilot status with banner when <= 5 days remaining', async () => {
    const endDate = new Date(Date.now() + 3 * 86400000).toISOString()
    mockFrom.mockReturnValue(makeChain({
      single: vi.fn().mockResolvedValue({
        data: { status: 'pilot', pilot_end_date: endDate, pilot_amount_cents: 50000 },
        error: null,
      }),
    }))
    const result = await getPilotStatus('comp-1')
    expect(result.isPilot).toBe(true)
    expect(result.showBanner).toBe(true)
    expect(result.pilotCreditCents).toBe(50000)
  })

  it('returns expired status', async () => {
    mockFrom.mockReturnValue(makeChain({
      single: vi.fn().mockResolvedValue({
        data: { status: 'expired', pilot_end_date: '2025-01-01', pilot_amount_cents: 50000 },
        error: null,
      }),
    }))
    const result = await getPilotStatus('comp-1')
    expect(result.isPilot).toBe(false)
    expect(result.showExpiredMessage).toBe(true)
  })
})

describe('generateROIReport', () => {
  beforeEach(() => vi.clearAllMocks())

  it('generates an ROI report', async () => {
    mockFrom.mockReturnValue(makeChain({
      single: vi.fn().mockResolvedValue({ data: { pilot_start_date: '2025-01-01' }, error: null }),
    }))
    const result = await generateROIReport('comp-1')
    expect(result).toHaveProperty('proposalsDrafted')
    expect(result).toHaveProperty('engagementScore', 75)
    expect(result).toHaveProperty('tokensConsumed', 5000)
    expect(result).toHaveProperty('tokensAllocated', 10000)
    expect(result.daysActive).toBeGreaterThan(0)
  })
})

describe('createConversionCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
  })

  it('returns error when no subscription found', async () => {
    mockFrom.mockReturnValue(makeChain({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }))
    const result = await createConversionCheckout({
      companyId: 'comp-1', companyName: 'Test', email: 'a@b.com',
      successUrl: 'https://ok', cancelUrl: 'https://cancel',
    })
    expect(result.error).toBe('No subscription found')
  })

  it('returns error when status is not pilot or expired', async () => {
    mockFrom.mockReturnValue(makeChain({
      single: vi.fn().mockResolvedValue({
        data: { plan_id: 'p1', pilot_amount_cents: 50000, stripe_customer_id: null, status: 'active' },
        error: null,
      }),
    }))
    const result = await createConversionCheckout({
      companyId: 'comp-1', companyName: 'Test', email: 'a@b.com',
      successUrl: 'https://ok', cancelUrl: 'https://cancel',
    })
    expect(result.error).toBe('Company is not in pilot or expired status')
  })

  it('returns error when no annual price', async () => {
    let n = 0
    mockFrom.mockImplementation(() => {
      n++
      if (n === 1) return makeChain({ single: vi.fn().mockResolvedValue({ data: { plan_id: 'p1', pilot_amount_cents: 0, stripe_customer_id: null, status: 'pilot' }, error: null }) })
      return makeChain({ single: vi.fn().mockResolvedValue({ data: { slug: 'pro', stripe_annual_price_id: null, annual_price: 100 }, error: null }) })
    })
    const result = await createConversionCheckout({
      companyId: 'comp-1', companyName: 'Test', email: 'a@b.com',
      successUrl: 'https://ok', cancelUrl: 'https://cancel',
    })
    expect(result.error).toBe('No annual price configured for plan')
  })

  it('creates checkout session with coupon', async () => {
    let n = 0
    mockFrom.mockImplementation(() => {
      n++
      if (n === 1) return makeChain({ single: vi.fn().mockResolvedValue({ data: { plan_id: 'p1', pilot_amount_cents: 50000, stripe_customer_id: 'cus_x', status: 'pilot' }, error: null }) })
      return makeChain({ single: vi.fn().mockResolvedValue({ data: { slug: 'pro', stripe_annual_price_id: 'price_123', annual_price: 10000 }, error: null }) })
    })
    const result = await createConversionCheckout({
      companyId: 'comp-1', companyName: 'Test', email: 'a@b.com',
      successUrl: 'https://ok', cancelUrl: 'https://cancel',
    })
    expect(result.url).toBe('https://checkout.stripe.com/test')
  })
})

describe('handleConversionSuccess', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates subscription and company records', async () => {
    mockFrom.mockReturnValue(makeChain())
    await handleConversionSuccess({
      companyId: 'comp-1', stripeSubscriptionId: 'sub_1',
      stripeCustomerId: 'cus_1', pilotCreditCents: 50000,
    })
    expect(mockFrom).toHaveBeenCalledWith('company_subscriptions')
    expect(mockFrom).toHaveBeenCalledWith('companies')
    expect(mockFrom).toHaveBeenCalledWith('audit_logs')
  })
})

describe('getPilotBannerData', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns hidden banner when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await getPilotBannerData()
    expect(result.show).toBe(false)
  })

  it('returns banner data when pilot has <= 5 days', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    const endDate = new Date(Date.now() + 3 * 86400000).toISOString()
    let n = 0
    mockFrom.mockImplementation(() => {
      n++
      if (n === 1) return makeChain({ single: vi.fn().mockResolvedValue({ data: { company_id: 'c1' }, error: null }) })
      if (n === 2) return makeChain({ single: vi.fn().mockResolvedValue({ data: { status: 'pilot', pilot_end_date: endDate, pilot_amount_cents: 25000, plan_id: 'p1' }, error: null }) })
      return makeChain({ single: vi.fn().mockResolvedValue({ data: { name: 'Pro' }, error: null }) })
    })
    const result = await getPilotBannerData()
    expect(result.show).toBe(true)
    expect(result.planName).toBe('Pro')
  })
})
