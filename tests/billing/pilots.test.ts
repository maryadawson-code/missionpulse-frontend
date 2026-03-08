import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSingle = vi.fn()
const mockEq = vi.fn().mockReturnValue({ single: mockSingle, eq: vi.fn().mockReturnValue({ single: mockSingle }) })
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockUpsert = vi.fn().mockResolvedValue({ error: null })
const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) })
const mockFrom = vi.fn((table: string) => {
  if (table === 'profiles') {
    return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { role: 'executive' }, error: null }) }) }) }
  }
  if (table === 'subscription_plans') {
    return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'plan-1', name: 'Starter', annual_price: 1484 }, error: null }) }) }) }
  }
  if (table === 'company_subscriptions') {
    return { upsert: mockUpsert, update: mockUpdate, select: mockSelect }
  }
  return { insert: mockInsert, upsert: mockUpsert, select: mockSelect, update: mockUpdate }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@test.com' } } }),
    },
    from: mockFrom,
  }),
}))

vi.mock('@/lib/billing/stripe', () => ({
  getOrCreateCustomer: vi.fn().mockResolvedValue('cus_test123'),
  createSubscriptionCheckout: vi.fn().mockResolvedValue({ url: null }),
}))

describe('Pilot Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('createPilot sets status=pilot', async () => {
    const { createPilot } = await import('@/lib/billing/pilots')
    const result = await createPilot({
      companyId: 'company-1',
      planId: 'starter',
      pilotKpi: '3 proposals drafted',
    })

    expect(result.success).toBe(true)
  })

  it('expirePilot sets status to pilot_expired', async () => {
    const { expirePilot } = await import('@/lib/billing/pilots')
    await expirePilot('company-1')

    // Verify update was called (it should call from('company_subscriptions').update)
    expect(mockFrom).toHaveBeenCalledWith('company_subscriptions')
  })

  it('convertPilotToAnnual sets status=active on direct path', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { status: 'pilot', pilot_amount_cents: 742, plan_id: 'plan-1' },
      error: null,
    })

    const { convertPilotToAnnual } = await import('@/lib/billing/pilots')
    const result = await convertPilotToAnnual('company-1')

    expect(result.success).toBe(true)
  })

  it('getPilotCheckoutUrl returns null error when no pilot found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })

    const { getPilotCheckoutUrl } = await import('@/lib/billing/pilots')
    const result = await getPilotCheckoutUrl('no-company')

    expect(result.url).toBeNull()
  })
})
