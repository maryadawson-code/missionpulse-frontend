import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabaseFrom = vi.fn()
const mockGetUser = vi.fn()
const mockGetOrCreateCustomer = vi.fn()
const mockCreateSubscriptionCheckout = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
  }),
}))

vi.mock('@/lib/billing/stripe', () => ({
  getOrCreateCustomer: (...args: unknown[]) => mockGetOrCreateCustomer(...args),
  createSubscriptionCheckout: (...args: unknown[]) => mockCreateSubscriptionCheckout(...args),
}))

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/billing/checkout/route'

function makeRequest(body?: unknown) {
  const init: RequestInit = {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
  }
  if (body !== undefined) {
    init.body = JSON.stringify(body)
  }
  return new NextRequest(new URL('https://test.local/api/billing/checkout'), init)
}

describe('POST /api/billing/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.test.com'
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
      error: null,
    })
    // profile query
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { company_id: 'co-1', role: 'executive' },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'companies') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { name: 'Test Corp' },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'company_subscriptions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { stripe_customer_id: null },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }
      }
      if (table === 'audit_logs') {
        return {
          insert: vi.fn().mockResolvedValue({ data: [{ id: '1' }], error: null }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockResolvedValue({ data: [], error: null }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }),
      }
    })
    mockGetOrCreateCustomer.mockResolvedValue('cus_test')
    mockCreateSubscriptionCheckout.mockResolvedValue({ url: 'https://checkout.stripe.com/test' })
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const res = await POST(makeRequest({ priceId: 'price_1', tier: 'starter' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid JSON', async () => {
    const req = new NextRequest(new URL('https://test.local/api/billing/checkout'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'bad-json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid JSON body')
  })

  it('returns 400 when priceId is missing', async () => {
    const res = await POST(makeRequest({ tier: 'starter' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('priceId is required')
  })

  it('returns 400 when tier is invalid', async () => {
    const res = await POST(makeRequest({ priceId: 'price_1', tier: 'invalid' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('tier must be one of')
  })

  it('returns 400 when no company associated', async () => {
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { company_id: null, role: 'executive' },
                error: null,
              }),
            }),
          }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    })
    const res = await POST(makeRequest({ priceId: 'price_1', tier: 'starter' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('No company associated')
  })

  it('returns checkout URL on success', async () => {
    const res = await POST(makeRequest({ priceId: 'price_1', tier: 'professional' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe('https://checkout.stripe.com/test')
  })

  it('returns 500 when checkout URL is null', async () => {
    mockCreateSubscriptionCheckout.mockResolvedValue({ url: null })
    const res = await POST(makeRequest({ priceId: 'price_1', tier: 'starter' }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Failed to create checkout session')
  })

  it('returns 500 when stripe throws', async () => {
    mockGetOrCreateCustomer.mockRejectedValue(new Error('Stripe down'))
    const res = await POST(makeRequest({ priceId: 'price_1', tier: 'starter' }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Stripe down')
  })
})
