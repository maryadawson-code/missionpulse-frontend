import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockValidateAPIKey = vi.fn()
const mockCheckRateLimit = vi.fn()
const mockGetRateLimitHeaders = vi.fn()

vi.mock('@/lib/api/keys', () => ({
  validateAPIKey: (...args: unknown[]) => mockValidateAPIKey(...args),
}))

vi.mock('@/lib/api/rate-limiter', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  getRateLimitHeaders: (...args: unknown[]) => mockGetRateLimitHeaders(...args),
}))

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/v1/ai/query/route'

function makeRequest(body?: unknown, headers: Record<string, string> = {}) {
  const init: RequestInit = {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
  }
  if (body !== undefined) {
    init.body = JSON.stringify(body)
  }
  return new NextRequest(new URL('https://test.local/api/v1/ai/query'), init)
}

describe('POST /api/v1/ai/query', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockValidateAPIKey.mockResolvedValue({
      valid: true,
      companyId: 'co-1',
      permissions: ['read', 'write', 'ai'],
      rateLimit: 100,
    })
    mockCheckRateLimit.mockReturnValue({ allowed: true, remaining: 99 })
    mockGetRateLimitHeaders.mockReturnValue({ 'X-RateLimit-Remaining': '99' })
  })

  it('returns 401 when no authorization header', async () => {
    const res = await POST(makeRequest({ query: 'test' }))
    expect(res.status).toBe(401)
  })

  it('returns 401 when API key is invalid', async () => {
    mockValidateAPIKey.mockResolvedValue(null)
    const res = await POST(makeRequest({ query: 'test' }, { authorization: 'Bearer bad-key' }))
    expect(res.status).toBe(401)
  })

  it('returns 429 when rate limited', async () => {
    mockCheckRateLimit.mockReturnValue({ allowed: false, remaining: 0 })
    const res = await POST(makeRequest({ query: 'test' }, { authorization: 'Bearer good-key' }))
    expect(res.status).toBe(429)
  })

  it('returns 403 when AI permission missing', async () => {
    mockValidateAPIKey.mockResolvedValue({
      valid: true,
      companyId: 'co-1',
      permissions: ['read', 'write'],
      rateLimit: 100,
    })
    const res = await POST(makeRequest({ query: 'test' }, { authorization: 'Bearer good-key' }))
    expect(res.status).toBe(403)
  })

  it('returns 400 for invalid JSON body', async () => {
    const req = new NextRequest(new URL('https://test.local/api/v1/ai/query'), {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer good-key' },
      body: 'not-json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid JSON body')
  })

  it('returns 400 when validation fails (empty query)', async () => {
    const res = await POST(makeRequest({ query: '' }, { authorization: 'Bearer good-key' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Validation failed')
  })

  it('returns success for valid query', async () => {
    const res = await POST(makeRequest({ query: 'What opportunities are near deadline?' }, { authorization: 'Bearer good-key' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toBe('AI query accepted')
    expect(body.query).toBe('What opportunities are near deadline?')
    expect(body.agent).toBe('chat')
    expect(body.status).toBe('queued')
  })

  it('passes optional fields through', async () => {
    const res = await POST(makeRequest(
      { query: 'Analyze this', opportunityId: '550e8400-e29b-41d4-a716-446655440000', agent: 'research' },
      { authorization: 'Bearer good-key' }
    ))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.opportunityId).toBe('550e8400-e29b-41d4-a716-446655440000')
    expect(body.agent).toBe('research')
  })
})
