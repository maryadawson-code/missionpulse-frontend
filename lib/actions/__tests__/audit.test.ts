/**
 * Unit tests for lib/actions/audit.ts
 *
 * Covers: logActivity, logAudit, getRecentActivity
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
// audit.ts uses: import { createClient as createServerClient } from '@/lib/supabase/server'
// and calls it synchronously (no await): const supabase = createServerClient()
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
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
import { logActivity, logAudit, getRecentActivity } from '../audit'

// ---------------------------------------------------------------------------
const TEST_USER = { id: 'user-abc', email: 'auditor@example.com' }

const TEST_PROFILE = {
  full_name: 'Jane Auditor',
  role: 'executive',
}

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
// logActivity
// ═══════════════════════════════════════════════════════════════════════════
describe('logActivity', () => {
  it('returns error when no user is authenticated', async () => {
    const result = await logActivity({
      action: 'test_action',
      resource_type: 'opportunity',
    })

    expect(result).toEqual({ success: false, error: 'No authenticated user' })
  })

  it('inserts into activity_log with user_name and user_role on valid call', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: TEST_USER },
      error: null,
    })

    // Profile fetch: from('profiles').select(...).eq(...).single()
    mockQueryBuilder.single.mockResolvedValue({
      data: TEST_PROFILE,
      error: null,
    })

    // activity_log insert: from('activity_log').insert(...)
    // insert() returns this (mockReturnThis), and the chain is awaited.
    // Since insert is the last method called (no .single()), the awaited
    // value comes from insert(). We need it to resolve to { error: null }.
    mockQueryBuilder.insert.mockResolvedValue({ data: null, error: null })

    const result = await logActivity({
      action: 'created_opportunity',
      resource_type: 'opportunity',
      resource_id: 'opp-1',
      details: { title: 'Test' },
    })

    expect(result).toEqual({ success: true })

    // Verify from() was called with 'activity_log'
    const fromCalls = mockSupabase.from.mock.calls.map(
      (call: [string]) => call[0]
    )
    expect(fromCalls).toContain('activity_log')

    // Verify insert was called with user_name and user_role
    const insertCalls = mockQueryBuilder.insert.mock.calls
    const activityInsert = insertCalls.find(
      (call: unknown[]) =>
        call[0] &&
        typeof call[0] === 'object' &&
        'user_name' in (call[0] as Record<string, unknown>)
    )
    expect(activityInsert).toBeDefined()
    expect((activityInsert![0] as Record<string, unknown>).user_name).toBe(
      'Jane Auditor'
    )
    expect((activityInsert![0] as Record<string, unknown>).user_role).toBe(
      'executive'
    )
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// logAudit
// ═══════════════════════════════════════════════════════════════════════════
describe('logAudit', () => {
  it('inserts into audit_logs with action, user_id, metadata on valid call', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: TEST_USER },
      error: null,
    })
    mockQueryBuilder.single.mockResolvedValue({
      data: TEST_PROFILE,
      error: null,
    })
    mockQueryBuilder.insert.mockResolvedValue({ data: null, error: null })

    const result = await logAudit({
      event_type: 'CUI_ACCESS',
      resource_type: 'document',
      resource_id: 'doc-1',
      details: { section: 'pricing' },
    })

    expect(result).toEqual({ success: true })

    const fromCalls = mockSupabase.from.mock.calls.map(
      (call: [string]) => call[0]
    )
    expect(fromCalls).toContain('audit_logs')

    // Verify the insert payload contains action and user_id
    const insertCalls = mockQueryBuilder.insert.mock.calls
    const auditInsert = insertCalls.find(
      (call: unknown[]) =>
        call[0] &&
        typeof call[0] === 'object' &&
        'user_id' in (call[0] as Record<string, unknown>)
    )
    expect(auditInsert).toBeDefined()
    expect((auditInsert![0] as Record<string, unknown>).action).toBe(
      'CUI_ACCESS'
    )
    expect((auditInsert![0] as Record<string, unknown>).user_id).toBe(
      'user-abc'
    )
  })

  it('returns error when DB insert fails', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: TEST_USER },
      error: null,
    })
    mockQueryBuilder.single.mockResolvedValue({
      data: TEST_PROFILE,
      error: null,
    })

    // Simulate DB error on insert
    mockQueryBuilder.insert.mockResolvedValue({
      data: null,
      error: { message: 'relation "audit_logs" does not exist' },
    })

    const result = await logAudit({
      event_type: 'CUI_ACCESS',
      resource_type: 'document',
    })

    expect(result).toEqual({
      success: false,
      error: 'relation "audit_logs" does not exist',
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// getRecentActivity
// ═══════════════════════════════════════════════════════════════════════════
describe('getRecentActivity', () => {
  it('returns shaped ActivityItem[] from activity_log', async () => {
    const mockRows = [
      {
        id: 'act-1',
        action: 'created_opportunity',
        user_name: 'Jane Doe',
        user_role: 'executive',
        details: { resource_type: 'opportunity' },
        timestamp: '2026-02-28T10:00:00Z',
      },
      {
        id: 'act-2',
        action: 'updated_opportunity',
        user_name: 'John Smith',
        user_role: 'capture_manager',
        details: null,
        timestamp: '2026-02-28T09:00:00Z',
      },
    ]

    // Chain: from('activity_log').select(...).order(...).limit(...)
    // limit() is the terminal — its return value is what gets awaited
    mockQueryBuilder.limit.mockResolvedValue({
      data: mockRows,
      error: null,
    })

    const result = await getRecentActivity(10)

    expect(result.error).toBeUndefined()
    expect(result.data).toHaveLength(2)
    expect(result.data[0]).toEqual({
      id: 'act-1',
      action: 'created_opportunity',
      user_name: 'Jane Doe',
      user_role: 'executive',
      details: { resource_type: 'opportunity' },
      timestamp: '2026-02-28T10:00:00Z',
    })
    expect(result.data[1]).toMatchObject({
      id: 'act-2',
      action: 'updated_opportunity',
    })
  })
})
