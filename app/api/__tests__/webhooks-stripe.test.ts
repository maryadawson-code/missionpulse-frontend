/**
 * Unit tests for POST /api/webhooks/stripe
 *
 * Verifies signature validation, event dispatching, and error handling
 * for the Stripe webhook endpoint.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Mock: @/lib/billing/stripe
// ---------------------------------------------------------------------------
vi.mock('@/lib/billing/stripe', () => ({
  verifyWebhookEvent: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Mock: @supabase/supabase-js
// ---------------------------------------------------------------------------
const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null })
const mockEq = vi.fn(() => ({ single: mockSingle, eq: mockEq }))
const mockLimit = vi.fn(() => ({ single: mockSingle }))
const mockOrder = vi.fn(() => ({ limit: mockLimit }))
const mockGte = vi.fn(() => ({ order: mockOrder }))
const _mockLte = vi.fn(() => ({ gte: mockGte }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockUpdate = vi.fn(() => ({ eq: mockEq }))

const mockSupabase = {
  from: vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    upsert: vi.fn().mockResolvedValue({ error: null }),
  })),
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

import { POST } from '../webhooks/stripe/route'
import { verifyWebhookEvent } from '@/lib/billing/stripe'

const mockVerify = verifyWebhookEvent as ReturnType<typeof vi.fn>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeWebhookRequest(body: string, signature?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (signature) {
    headers['stripe-signature'] = signature
  }
  return new NextRequest('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers,
    body,
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when stripe-signature header is missing', async () => {
    const res = await POST(makeWebhookRequest('{}'))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Missing signature')
    expect(mockVerify).not.toHaveBeenCalled()
  })

  it('returns 400 when verifyWebhookEvent throws (invalid signature)', async () => {
    mockVerify.mockRejectedValue(new Error('Signature verification failed'))

    const res = await POST(makeWebhookRequest('{}', 'bad-sig'))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Signature verification failed')
  })

  it('returns 200 { received: true } for a valid checkout.session.completed event', async () => {
    mockVerify.mockResolvedValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_123',
          subscription: 'sub_456',
          payment_status: 'paid',
          metadata: { company_id: 'comp-1', type: 'subscription' },
        },
      },
    })

    // Mock the supabase update chain
    mockEq.mockResolvedValue({ error: null })

    const res = await POST(makeWebhookRequest('{}', 'valid-sig'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ received: true })
  })

  it('returns 200 { received: true } for an unknown event type (acknowledged)', async () => {
    mockVerify.mockResolvedValue({
      type: 'customer.updated',
      data: { object: {} },
    })

    const res = await POST(makeWebhookRequest('{}', 'valid-sig'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ received: true })
  })
})
