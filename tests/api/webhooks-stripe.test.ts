import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Supabase mock ─────────────────────────────────────────────
const mockFrom = vi.fn()
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: (...args: unknown[]) => mockFrom(...args),
  })),
}))

vi.mock('@/lib/billing/stripe', () => ({
  verifyWebhookEvent: vi.fn(),
}))

vi.mock('@/lib/billing/pilot-conversion', () => ({
  handleConversionSuccess: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/logging/logger', () => ({
  createLogger: vi.fn().mockReturnValue({
    info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn(),
  }),
}))

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/webhooks/stripe/route'
import { verifyWebhookEvent } from '@/lib/billing/stripe'
import { handleConversionSuccess } from '@/lib/billing/pilot-conversion'

const mockVerify = vi.mocked(verifyWebhookEvent)
const mockConversion = vi.mocked(handleConversionSuccess)

function makeRequest(body: string, headers: Record<string, string> = {}) {
  return new NextRequest(new URL('https://test.local/api/webhooks/stripe'), {
    method: 'POST',
    body,
    headers: { 'content-type': 'text/plain', ...headers },
  })
}

function setupChainMock() {
  mockFrom.mockImplementation(() => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        lte: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'led-1', tokens_purchased: 100000 }, error: null }),
              }),
            }),
          }),
        }),
        single: vi.fn().mockResolvedValue({ data: { company_id: 'co-1' }, error: null }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: [{ id: 'updated' }], error: null }),
    }),
    insert: vi.fn().mockResolvedValue({ data: [{ id: 'new-1' }], error: null }),
  }))
}

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
    setupChainMock()
  })

  it('returns 400 when stripe-signature header is missing', async () => {
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Missing signature')
  })

  it('returns 400 when signature verification fails', async () => {
    mockVerify.mockRejectedValue(new Error('Invalid signature'))
    const res = await POST(makeRequest('{}', { 'stripe-signature': 'bad-sig' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid signature')
  })

  it('handles checkout.session.completed — token_pack type', async () => {
    mockVerify.mockResolvedValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_test',
          payment_status: 'paid',
          metadata: { company_id: 'co-1', type: 'token_pack', token_amount: '50000' },
        },
      },
    } as never)

    const res = await POST(makeRequest('{}', { 'stripe-signature': 'valid-sig' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)
  })

  it('handles checkout.session.completed — pilot_conversion type', async () => {
    mockVerify.mockResolvedValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_test',
          subscription: 'sub_123',
          payment_status: 'paid',
          metadata: { company_id: 'co-1', type: 'pilot_conversion', pilot_credit_cents: '500' },
        },
      },
    } as never)

    const res = await POST(makeRequest('{}', { 'stripe-signature': 'valid-sig' }))
    expect(res.status).toBe(200)
    expect(mockConversion).toHaveBeenCalledWith({
      companyId: 'co-1',
      stripeSubscriptionId: 'sub_123',
      stripeCustomerId: 'cus_test',
      pilotCreditCents: 500,
    })
  })

  it('handles checkout.session.completed — subscription type', async () => {
    mockVerify.mockResolvedValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_test',
          subscription: 'sub_456',
          payment_status: 'paid',
          metadata: { company_id: 'co-1', type: 'subscription' },
        },
      },
    } as never)

    const res = await POST(makeRequest('{}', { 'stripe-signature': 'valid-sig' }))
    expect(res.status).toBe(200)
    expect(mockFrom).toHaveBeenCalledWith('company_subscriptions')
    expect(mockFrom).toHaveBeenCalledWith('companies')
    expect(mockFrom).toHaveBeenCalledWith('audit_logs')
  })

  it('skips processing when payment_status is not paid', async () => {
    mockVerify.mockResolvedValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_test',
          payment_status: 'unpaid',
          metadata: { company_id: 'co-1', type: 'subscription' },
        },
      },
    } as never)

    const res = await POST(makeRequest('{}', { 'stripe-signature': 'valid-sig' }))
    expect(res.status).toBe(200)
  })

  it('skips processing when company_id is missing', async () => {
    mockVerify.mockResolvedValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_test',
          payment_status: 'paid',
          metadata: {},
        },
      },
    } as never)

    const res = await POST(makeRequest('{}', { 'stripe-signature': 'valid-sig' }))
    expect(res.status).toBe(200)
  })

  it('handles invoice.paid event with subscription', async () => {
    mockVerify.mockResolvedValue({
      type: 'invoice.paid',
      data: {
        object: {
          customer: 'cus_test',
          subscription: 'sub_789',
          status: 'paid',
        },
      },
    } as never)

    const res = await POST(makeRequest('{}', { 'stripe-signature': 'valid-sig' }))
    expect(res.status).toBe(200)
    expect(mockFrom).toHaveBeenCalledWith('company_subscriptions')
  })

  it('handles invoice.paid when no subscription found', async () => {
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
    }))

    mockVerify.mockResolvedValue({
      type: 'invoice.paid',
      data: {
        object: {
          customer: 'cus_unknown',
          subscription: 'sub_999',
          status: 'paid',
        },
      },
    } as never)

    const res = await POST(makeRequest('{}', { 'stripe-signature': 'valid-sig' }))
    expect(res.status).toBe(200)
  })

  it('returns 500 on processing error', async () => {
    mockVerify.mockResolvedValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_test',
          payment_status: 'paid',
          metadata: { company_id: 'co-1', type: 'token_pack', token_amount: '50000' },
        },
      },
    } as never)
    mockFrom.mockImplementation(() => { throw new Error('DB error') })

    const res = await POST(makeRequest('{}', { 'stripe-signature': 'valid-sig' }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('DB error')
  })
})
