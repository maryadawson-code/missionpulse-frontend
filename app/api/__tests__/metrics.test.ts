/**
 * Unit tests for GET /api/metrics
 *
 * Verifies the admin-protected metrics endpoint returns correct HTTP status
 * and aggregated performance/query/cache data, or rejects unauthorized access.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn()
const mockSingle = vi.fn()
const mockEq = vi.fn(() => ({ single: mockSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    })
  ),
}))

vi.mock('@/lib/rbac/config', () => ({
  resolveRole: vi.fn((role: string) => role ?? 'viewer'),
  hasPermission: vi.fn(
    (role: string, _mod: string, _action: string) => role === 'admin'
  ),
}))

vi.mock('@/lib/utils/perf-monitor', () => ({
  getAllSummaries: vi.fn(() =>
    Promise.resolve({ 'api.health': { p50: 5, p95: 12, p99: 18 } })
  ),
}))

vi.mock('@/lib/utils/query-logger', () => ({
  getQueryStats: vi.fn(() =>
    Promise.resolve({ totalQueries: 42, avgLatency: 8.3 })
  ),
}))

vi.mock('@/lib/cache/semantic-cache', () => ({
  getCacheMetrics: vi.fn(() =>
    Promise.resolve({ hits: 100, misses: 20, hitRate: 0.83 })
  ),
}))

import { GET } from '../metrics/route'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('GET /api/metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 403 when user is not an admin', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
    })
    mockSingle.mockResolvedValue({ data: { role: 'viewer' } })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe('Forbidden')
  })

  it('returns 200 with performance, queries, and cache for admin', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'admin-1' } },
    })
    mockSingle.mockResolvedValue({ data: { role: 'admin' } })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveProperty('timestamp')
    expect(body.performance).toEqual({
      'api.health': { p50: 5, p95: 12, p99: 18 },
    })
    expect(body.queries).toEqual({ totalQueries: 42, avgLatency: 8.3 })
    expect(body.cache).toEqual({ hits: 100, misses: 20, hitRate: 0.83 })
  })

  it('calls from("profiles") with the authenticated user id', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'admin-1' } },
    })
    mockSingle.mockResolvedValue({ data: { role: 'admin' } })

    await GET()

    expect(mockFrom).toHaveBeenCalledWith('profiles')
    expect(mockSelect).toHaveBeenCalledWith('role')
    expect(mockEq).toHaveBeenCalledWith('id', 'admin-1')
  })
})
