/**
 * Unit tests for lib/actions/dashboard.ts
 *
 * Covers: getDashboardKPIs
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Chainable mock Supabase client
// ---------------------------------------------------------------------------
const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
}

const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
  from: vi.fn(() => mockQueryBuilder),
}

// ---------------------------------------------------------------------------
// Module mocks (hoisted)
// ---------------------------------------------------------------------------
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}))

vi.mock('@/lib/logging/logger', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------
import { getDashboardKPIs } from '../dashboard'

// ---------------------------------------------------------------------------
// Reset all mocks between tests
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks()

  mockQueryBuilder.select.mockReturnThis()
  mockQueryBuilder.insert.mockReturnThis()
  mockQueryBuilder.update.mockReturnThis()
  mockQueryBuilder.delete.mockReturnThis()
  mockQueryBuilder.eq.mockReturnThis()
  mockQueryBuilder.order.mockReturnThis()
  mockQueryBuilder.limit.mockReturnThis()
  mockQueryBuilder.single.mockResolvedValue({ data: null, error: null })

  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: null,
  })
  mockSupabase.from.mockReturnValue(mockQueryBuilder)
})

// ═══════════════════════════════════════════════════════════════════════════
// getDashboardKPIs
// ═══════════════════════════════════════════════════════════════════════════
describe('getDashboardKPIs', () => {
  it('returns error when user is not authenticated', async () => {
    const result = await getDashboardKPIs()

    expect(result).toEqual({ data: null, error: 'Not authenticated' })
  })

  it('returns error when fetch fails', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'u1' } },
      error: null,
    })

    // The query chain: from('opportunities').select(...).eq('status', 'Active')
    // eq() is the terminal method whose resolved value matters
    mockQueryBuilder.eq.mockResolvedValue({
      data: null,
      error: { message: 'RLS policy violation' },
    })

    const result = await getDashboardKPIs()

    expect(result).toEqual({ data: null, error: 'RLS policy violation' })
  })

  it('returns zeroed KPIs when there are no opportunities', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'u1' } },
      error: null,
    })

    mockQueryBuilder.eq.mockResolvedValue({
      data: [],
      error: null,
    })

    const result = await getDashboardKPIs()

    expect(result).toEqual({
      data: {
        pipelineCount: 0,
        totalCeiling: 0,
        avgPwin: 0,
        upcomingDeadlines: 0,
      },
      error: null,
    })
  })

  it('correctly calculates pipelineCount, totalCeiling, and avgPwin', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'u1' } },
      error: null,
    })

    const mockOpps = [
      {
        id: 'opp-1',
        ceiling: 500000,
        pwin: 80,
        due_date: '2027-12-01',
        status: 'Active',
      },
      {
        id: 'opp-2',
        ceiling: 300000,
        pwin: 60,
        due_date: '2027-12-01',
        status: 'Active',
      },
      {
        id: 'opp-3',
        ceiling: null,
        pwin: null,
        due_date: null,
        status: 'Active',
      },
    ]

    mockQueryBuilder.eq.mockResolvedValue({
      data: mockOpps,
      error: null,
    })

    const result = await getDashboardKPIs()

    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
    expect(result.data!.pipelineCount).toBe(3)
    // totalCeiling = 500000 + 300000 + 0 = 800000
    expect(result.data!.totalCeiling).toBe(800000)
    // avgPwin = Math.round((80 + 60 + 50) / 3) = Math.round(63.33) = 63
    // (null pwin defaults to 50 in the reducer)
    expect(result.data!.avgPwin).toBe(63)
  })

  it('correctly filters upcoming deadlines to next 30 days', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'u1' } },
      error: null,
    })

    const now = new Date()
    const in10Days = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
    const in20Days = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
    const pastDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    const mockOpps = [
      {
        id: 'opp-1',
        ceiling: 100000,
        pwin: 50,
        due_date: in10Days,
        status: 'Active',
      },
      {
        id: 'opp-2',
        ceiling: 200000,
        pwin: 50,
        due_date: in20Days,
        status: 'Active',
      },
      {
        id: 'opp-3',
        ceiling: 300000,
        pwin: 50,
        due_date: in60Days,
        status: 'Active',
      },
      {
        id: 'opp-4',
        ceiling: 400000,
        pwin: 50,
        due_date: pastDate,
        status: 'Active',
      },
      {
        id: 'opp-5',
        ceiling: 500000,
        pwin: 50,
        due_date: null,
        status: 'Active',
      },
    ]

    mockQueryBuilder.eq.mockResolvedValue({
      data: mockOpps,
      error: null,
    })

    const result = await getDashboardKPIs()

    expect(result.data).not.toBeNull()
    // Only opp-1 (in 10 days) and opp-2 (in 20 days) fall within 30-day window
    expect(result.data!.upcomingDeadlines).toBe(2)
    expect(result.data!.pipelineCount).toBe(5)
  })
})
