/**
 * Unit tests for POST / DELETE /api/newsletter
 *
 * Verifies subscription and unsubscription logic, input validation,
 * and error handling.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Mock Supabase admin client
// ---------------------------------------------------------------------------
const mockUpsert = vi.fn()
const _mockUpdate = vi.fn()
const mockEq = vi.fn()

const mockSupabase = {
  from: vi.fn(() => ({
    upsert: mockUpsert.mockResolvedValue({ error: null }),
    update: vi.fn(() => ({
      eq: mockEq.mockResolvedValue({ error: null }),
    })),
  })),
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockSupabase),
}))

import { POST, DELETE } from '../newsletter/route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(method: string, body?: unknown) {
  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body !== undefined) {
    init.body = JSON.stringify(body)
  }
  return new NextRequest('http://localhost/api/newsletter', init)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('POST /api/newsletter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Re-wire default happy-path mocks
    mockUpsert.mockResolvedValue({ error: null })
    mockEq.mockResolvedValue({ error: null })
    mockSupabase.from.mockReturnValue({
      upsert: mockUpsert,
      update: vi.fn(() => ({ eq: mockEq })),
    })
  })

  it('subscribes a valid email and returns 200 { success: true }', async () => {
    const res = await POST(makeRequest('POST', { email: 'test@example.com' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ success: true })
    expect(mockSupabase.from).toHaveBeenCalledWith('newsletter_subscribers')
  })

  it('returns 400 when email is missing', async () => {
    const res = await POST(makeRequest('POST', { source: 'footer' }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBeDefined()
  })

  it('returns 400 for an invalid email format', async () => {
    const res = await POST(makeRequest('POST', { email: 'not-an-email' }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBeDefined()
  })

  it('returns 400 for an invalid JSON body', async () => {
    const req = new NextRequest('http://localhost/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ broken json',
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Invalid request body')
  })
})

describe('DELETE /api/newsletter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEq.mockResolvedValue({ error: null })
    mockSupabase.from.mockReturnValue({
      upsert: mockUpsert,
      update: vi.fn(() => ({ eq: mockEq })),
    })
  })

  it('unsubscribes a valid email and returns 200 { success: true }', async () => {
    const res = await DELETE(makeRequest('DELETE', { email: 'test@example.com' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ success: true })
    expect(mockSupabase.from).toHaveBeenCalledWith('newsletter_subscribers')
  })
})
