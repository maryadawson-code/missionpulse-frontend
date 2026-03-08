import { describe, it, expect, vi } from 'vitest'

// Mock Stripe
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      customers: {
        create: vi.fn().mockResolvedValue({ id: 'cus_test123' }),
      },
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' }),
        },
      },
      subscriptions: {
        update: vi.fn().mockResolvedValue({ id: 'sub_test' }),
      },
      webhooks: {
        constructEvent: vi.fn().mockReturnValue({ type: 'test', data: {} }),
      },
    })),
  }
})

describe('Stripe Module', () => {
  it('module can be imported', async () => {
    const mod = await import('@/lib/billing/stripe')
    expect(mod.getOrCreateCustomer).toBeDefined()
    expect(mod.createSubscriptionCheckout).toBeDefined()
    expect(mod.createTokenPackCheckout).toBeDefined()
    expect(mod.verifyWebhookEvent).toBeDefined()
    expect(mod.cancelSubscription).toBeDefined()
    expect(mod.resumeSubscription).toBeDefined()
  })

  it('getOrCreateCustomer returns existing customer ID if provided', async () => {
    const { getOrCreateCustomer } = await import('@/lib/billing/stripe')
    const result = await getOrCreateCustomer({
      company_id: 'c1',
      company_name: 'Test Co',
      email: 'test@test.com',
      existing_customer_id: 'cus_existing',
    })
    expect(result).toBe('cus_existing')
  })

  it('getOrCreateCustomer creates new customer when none exists', async () => {
    const { getOrCreateCustomer } = await import('@/lib/billing/stripe')
    const result = await getOrCreateCustomer({
      company_id: 'c1',
      company_name: 'Test Co',
      email: 'test@test.com',
    })
    expect(result).toBe('cus_test123')
  })
})
