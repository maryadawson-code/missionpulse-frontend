import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'plan-1',
          name: 'Starter',
          slug: 'starter',
          monthly_price: 149,
          annual_price: 1484,
          monthly_token_limit: 500000,
          overage_rate_per_mtok: 0.80,
          max_users: 1,
          max_opportunities: 5,
          features: { ai_chat: true, playbook: true },
          stripe_monthly_price_id: 'price_test',
          stripe_annual_price_id: 'price_test_annual',
          display_order: 1,
          is_active: true,
        },
        error: null,
      }),
    })),
  }),
}))

describe('Billing Plans', () => {
  it('module can be imported', async () => {
    const mod = await import('@/lib/billing/plans')
    expect(mod.getPlans).toBeDefined()
    expect(mod.getPlanBySlug).toBeDefined()
    expect(mod.getCompanySubscription).toBeDefined()
    expect(mod.hasFeatureAccess).toBeDefined()
    expect(mod.upsertCompanySubscription).toBeDefined()
  })

  it('getPlanBySlug returns a plan', async () => {
    const { getPlanBySlug } = await import('@/lib/billing/plans')
    const plan = await getPlanBySlug('starter')
    expect(plan).not.toBeNull()
    expect(plan?.slug).toBe('starter')
    expect(plan?.monthly_price).toBe(149)
  })
})
