import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFrom, mockGetUser, mockSupabase } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockGetUser = vi.fn()
  const mockSupabase = { from: mockFrom, auth: { getUser: mockGetUser } }
  return { mockFrom, mockGetUser, mockSupabase }
})

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn().mockResolvedValue(mockSupabase) }))
vi.mock('@/lib/rbac/config', () => ({ resolveRole: vi.fn((r: string) => r ?? 'viewer') }))
vi.mock('@/lib/billing/stripe', () => ({
  getOrCreateCustomer: vi.fn().mockResolvedValue('cus_test'),
  createSubscriptionCheckout: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/sub' }),
  createTokenPackCheckout: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/tok' }),
}))
vi.mock('@/lib/billing/plans', () => ({
  getCompanySubscription: vi.fn().mockResolvedValue(null),
  getPlanBySlug: vi.fn().mockResolvedValue({ stripe_annual_price_id: 'price_a', stripe_monthly_price_id: 'price_m' }),
}))

function makeChain(overrides: Record<string, unknown> = {}) {
  const c: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(),
  }
  for (const k of Object.keys(c)) { if (!overrides[k]) c[k] = vi.fn().mockReturnValue(c) }
  Object.assign(c, overrides)
  return c
}

import { TOKEN_PACKS, initiatePlanUpgrade, purchaseTokenPack, toggleAutoOverage } from '@/lib/billing/checkout'

describe('TOKEN_PACKS', () => {
  it('has 3 packs', () => { expect(TOKEN_PACKS).toHaveLength(3) })
  it('500K pack price', () => { expect(TOKEN_PACKS[0].price_cents).toBe(5000) })
})

describe('initiatePlanUpgrade', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    expect(await initiatePlanUpgrade('growth', 'annual')).toEqual({ url: null, error: 'Not authenticated' })
  })
  it('returns error for non-executive', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFrom.mockReturnValue(makeChain({ single: vi.fn().mockResolvedValue({ data: { role: 'viewer', company_id: 'c1' }, error: null }) }))
    const { resolveRole } = await import('@/lib/rbac/config')
    vi.mocked(resolveRole).mockReturnValue('viewer')
    expect(await initiatePlanUpgrade('growth', 'annual')).toEqual({ url: null, error: 'Only executives can upgrade plans' })
  })
  it('returns error when no company', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFrom.mockReturnValue(makeChain({ single: vi.fn().mockResolvedValue({ data: { role: 'executive', company_id: null }, error: null }) }))
    const { resolveRole } = await import('@/lib/rbac/config')
    vi.mocked(resolveRole).mockReturnValue('executive')
    expect(await initiatePlanUpgrade('growth', 'annual')).toEqual({ url: null, error: 'No company associated' })
  })
  it('creates checkout for annual plan', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.com' } }, error: null })
    const { resolveRole } = await import('@/lib/rbac/config')
    vi.mocked(resolveRole).mockReturnValue('executive')
    mockFrom.mockReturnValue(makeChain({ single: vi.fn().mockResolvedValue({ data: { role: 'executive', company_id: 'c1', name: 'Acme' }, error: null }) }))
    const result = await initiatePlanUpgrade('growth', 'annual')
    expect(result.url).toBe('https://checkout.stripe.com/sub')
  })
})

describe('purchaseTokenPack', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    expect(await purchaseTokenPack('pack-500k')).toEqual({ url: null, error: 'Not authenticated' })
  })
  it('returns error for invalid pack', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    const { resolveRole } = await import('@/lib/rbac/config')
    vi.mocked(resolveRole).mockReturnValue('executive')
    mockFrom.mockReturnValue(makeChain({ single: vi.fn().mockResolvedValue({ data: { role: 'executive', company_id: 'c1' }, error: null }) }))
    expect(await purchaseTokenPack('invalid')).toEqual({ url: null, error: 'Invalid token pack' })
  })
  it('creates checkout for valid pack', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.com' } }, error: null })
    const { resolveRole } = await import('@/lib/rbac/config')
    vi.mocked(resolveRole).mockReturnValue('executive')
    mockFrom.mockReturnValue(makeChain({ single: vi.fn().mockResolvedValue({ data: { role: 'executive', company_id: 'c1', name: 'Acme' }, error: null }) }))
    const result = await purchaseTokenPack('pack-500k')
    expect(result.url).toBe('https://checkout.stripe.com/tok')
  })
})

describe('toggleAutoOverage', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    expect(await toggleAutoOverage(true)).toEqual({ success: false, error: 'Not authenticated' })
  })
  it('updates auto_overage', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    const { resolveRole } = await import('@/lib/rbac/config')
    vi.mocked(resolveRole).mockReturnValue('executive')
    let n = 0
    mockFrom.mockImplementation(() => {
      n++
      if (n === 1) return makeChain({ single: vi.fn().mockResolvedValue({ data: { role: 'exec', company_id: 'c1' }, error: null }) })
      const c = makeChain(); c.eq = vi.fn().mockResolvedValue({ error: null }); return c
    })
    expect(await toggleAutoOverage(true)).toEqual({ success: true })
  })
})
