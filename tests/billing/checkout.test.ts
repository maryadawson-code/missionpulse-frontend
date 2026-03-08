import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@test.com' } },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: 'executive', company_id: 'co-1', name: 'Test Co' },
        error: null,
      }),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
  }),
}))

vi.mock('@/lib/rbac/config', () => ({
  resolveRole: vi.fn((role: string) => role ?? 'author'),
}))

vi.mock('@/lib/billing/stripe', () => ({
  getOrCreateCustomer: vi.fn().mockResolvedValue('cus_test'),
  createSubscriptionCheckout: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/sub' }),
  createTokenPackCheckout: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/tokens' }),
}))

vi.mock('@/lib/billing/plans', () => ({
  getCompanySubscription: vi.fn().mockResolvedValue({ stripe_customer_id: 'cus_existing' }),
  getPlanBySlug: vi.fn().mockResolvedValue({
    stripe_monthly_price_id: 'price_monthly',
    stripe_annual_price_id: 'price_annual',
  }),
}))

describe('Checkout Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('TOKEN_PACKS', () => {
    it('exports token pack definitions', async () => {
      const { TOKEN_PACKS } = await import('@/lib/billing/checkout')
      expect(TOKEN_PACKS).toHaveLength(3)
      expect(TOKEN_PACKS[0].id).toBe('pack-500k')
      expect(TOKEN_PACKS[1].id).toBe('pack-1m')
      expect(TOKEN_PACKS[2].id).toBe('pack-5m')
    })

    it('packs have correct token amounts', async () => {
      const { TOKEN_PACKS } = await import('@/lib/billing/checkout')
      expect(TOKEN_PACKS[0].tokens).toBe(500_000)
      expect(TOKEN_PACKS[1].tokens).toBe(1_000_000)
      expect(TOKEN_PACKS[2].tokens).toBe(5_000_000)
    })

    it('packs have correct prices', async () => {
      const { TOKEN_PACKS } = await import('@/lib/billing/checkout')
      expect(TOKEN_PACKS[0].price_cents).toBe(5000)
      expect(TOKEN_PACKS[1].price_cents).toBe(9000)
      expect(TOKEN_PACKS[2].price_cents).toBe(40000)
    })
  })

  describe('initiatePlanUpgrade', () => {
    it('returns checkout URL for valid upgrade', async () => {
      const { initiatePlanUpgrade } = await import('@/lib/billing/checkout')
      const result = await initiatePlanUpgrade('professional', 'monthly')
      expect(result.url).toBe('https://checkout.stripe.com/sub')
      expect(result.error).toBeUndefined()
    })

    it('supports annual billing', async () => {
      const { initiatePlanUpgrade } = await import('@/lib/billing/checkout')
      const result = await initiatePlanUpgrade('professional', 'annual')
      expect(result.url).toBeTruthy()
    })

    it('rejects non-executive roles', async () => {
      const { resolveRole } = await import('@/lib/rbac/config')
      vi.mocked(resolveRole).mockReturnValueOnce('author')
      const { initiatePlanUpgrade } = await import('@/lib/billing/checkout')
      const result = await initiatePlanUpgrade('professional', 'monthly')
      expect(result.url).toBeNull()
      expect(result.error).toContain('executives')
    })

    it('returns error when not authenticated', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
        from: vi.fn(),
      } as never)
      const { initiatePlanUpgrade } = await import('@/lib/billing/checkout')
      const result = await initiatePlanUpgrade('pro', 'monthly')
      expect(result.error).toContain('authenticated')
    })

    it('returns error when plan not found', async () => {
      const { getPlanBySlug } = await import('@/lib/billing/plans')
      vi.mocked(getPlanBySlug).mockResolvedValueOnce(null)
      const { initiatePlanUpgrade } = await import('@/lib/billing/checkout')
      const result = await initiatePlanUpgrade('nonexistent', 'monthly')
      expect(result.error).toContain('Plan not found')
    })
  })

  describe('purchaseTokenPack', () => {
    it('returns checkout URL for valid pack', async () => {
      const { purchaseTokenPack } = await import('@/lib/billing/checkout')
      const result = await purchaseTokenPack('pack-500k')
      expect(result.url).toBe('https://checkout.stripe.com/tokens')
    })

    it('rejects invalid pack ID', async () => {
      const { purchaseTokenPack } = await import('@/lib/billing/checkout')
      const result = await purchaseTokenPack('pack-invalid')
      expect(result.error).toContain('Invalid token pack')
    })

    it('rejects non-executive roles', async () => {
      const { resolveRole } = await import('@/lib/rbac/config')
      vi.mocked(resolveRole).mockReturnValueOnce('consultant')
      const { purchaseTokenPack } = await import('@/lib/billing/checkout')
      const result = await purchaseTokenPack('pack-500k')
      expect(result.error).toContain('executives')
    })
  })

  describe('toggleAutoOverage', () => {
    it('succeeds for executive role', async () => {
      const { toggleAutoOverage } = await import('@/lib/billing/checkout')
      const result = await toggleAutoOverage(true)
      expect(result.success).toBe(true)
    })

    it('rejects non-executive roles', async () => {
      const { resolveRole } = await import('@/lib/rbac/config')
      vi.mocked(resolveRole).mockReturnValueOnce('partner')
      const { toggleAutoOverage } = await import('@/lib/billing/checkout')
      const result = await toggleAutoOverage(false)
      expect(result.success).toBe(false)
      expect(result.error).toContain('executives')
    })
  })
})
