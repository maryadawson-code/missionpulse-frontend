/**
 * Unit tests for GET /api/section-versions
 *
 * Verifies query-parameter handling, auth gating, and graceful
 * fallback to { versions: [] } on errors.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Chainable mock builder for Supabase
// ---------------------------------------------------------------------------
const mockLimit = vi.fn()
const mockOrder = vi.fn(() => ({ limit: mockLimit }))
const mockEq = vi.fn(() => ({ order: mockOrder }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockGetUser = vi.fn()

const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: vi.fn(() => ({
    select: mockSelect,
  })),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}))

import { GET } from '../section-versions/route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(params?: Record<string, string>) {
  const url = new URL('http://localhost/api/section-versions')
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }
  return new NextRequest(url)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('GET /api/section-versions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
    })
    // Default: successful DB response
    mockLimit.mockResolvedValue({ data: [], error: null })
  })

  it('returns { versions: [] } when sectionId param is missing', async () => {
    const res = await GET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ versions: [] })
    // Should not even call supabase when param is missing
    expect(mockSupabase.from).not.toHaveBeenCalled()
  })

  it('returns 401 with { versions: [] } when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const res = await GET(makeRequest({ sectionId: 'sec-1' }))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body).toEqual({ versions: [] })
  })

  it('returns filtered versions for a valid authenticated request', async () => {
    const sectionId = 'sec-abc'
    const dbRows = [
      {
        id: 'v1',
        action: 'save_section_version',
        user_name: 'Alice',
        timestamp: '2026-02-28T10:00:00Z',
        details: { entity_id: sectionId, content: 'draft 1' },
      },
      {
        id: 'v2',
        action: 'save_section_version',
        user_name: 'Bob',
        timestamp: '2026-02-28T11:00:00Z',
        details: { entity_id: 'other-section' },
      },
    ]
    mockLimit.mockResolvedValue({ data: dbRows, error: null })

    const res = await GET(makeRequest({ sectionId }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.versions).toHaveLength(1)
    expect(body.versions[0]).toEqual({
      id: 'v1',
      action: 'save_section_version',
      user_name: 'Alice',
      created_at: '2026-02-28T10:00:00Z',
      details: { entity_id: sectionId, content: 'draft 1' },
    })
  })

  it('returns { versions: [] } on a database error', async () => {
    mockLimit.mockResolvedValue({ data: null, error: { message: 'DB down' } })

    const res = await GET(makeRequest({ sectionId: 'sec-1' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ versions: [] })
  })
})
