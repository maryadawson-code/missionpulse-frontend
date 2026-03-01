/**
 * Unit tests for lib/actions/opportunities.ts
 *
 * Covers: createOpportunity, updateOpportunity, deleteOpportunity,
 *         getOpportunities, updateOpportunityField
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

vi.mock('@/lib/security/sanitize', () => ({
  sanitizePlainText: vi.fn((input: string) => input),
  sanitizeHtml: vi.fn((input: string) => input),
  sanitizeMarkdown: vi.fn((input: string) => input),
}))

vi.mock('@/lib/utils/notifications', () => ({
  logNotification: vi.fn(),
}))

vi.mock('@/lib/billing/onboarding-hooks', () => ({
  tryCompleteOnboardingStep: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks — Vitest hoists vi.mock automatically)
// ---------------------------------------------------------------------------
import {
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  updateOpportunityField,
} from '../opportunities'
import { sanitizePlainText } from '@/lib/security/sanitize'
import { tryCompleteOnboardingStep } from '@/lib/billing/onboarding-hooks'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    fd.set(key, value)
  }
  return fd
}

const TEST_USER = { id: 'user-123', email: 'test@example.com' }

// ---------------------------------------------------------------------------
// Reset all mocks between tests
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks()

  // Reset chain methods to default behavior
  mockQueryBuilder.select.mockReturnThis()
  mockQueryBuilder.insert.mockReturnThis()
  mockQueryBuilder.update.mockReturnThis()
  mockQueryBuilder.delete.mockReturnThis()
  mockQueryBuilder.eq.mockReturnThis()
  mockQueryBuilder.order.mockReturnThis()
  mockQueryBuilder.limit.mockReturnThis()
  mockQueryBuilder.single.mockResolvedValue({ data: null, error: null })

  // Default: no user
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: null,
  })
  mockSupabase.from.mockReturnValue(mockQueryBuilder)
})

// ═══════════════════════════════════════════════════════════════════════════
// createOpportunity
// ═══════════════════════════════════════════════════════════════════════════
describe('createOpportunity', () => {
  it('returns error when user is not authenticated', async () => {
    const fd = makeFormData({ title: 'Test Opp' })
    const result = await createOpportunity(fd)

    expect(result).toEqual({ success: false, error: 'Not authenticated' })
  })

  it('returns error when title is missing', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: TEST_USER },
      error: null,
    })

    const fd = makeFormData({})
    const result = await createOpportunity(fd)

    expect(result).toEqual({ success: false, error: 'Title is required' })
  })

  it('returns error when ceiling is not a number', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: TEST_USER },
      error: null,
    })

    const fd = makeFormData({ title: 'Test Opp', ceiling: 'not-a-number' })
    const result = await createOpportunity(fd)

    expect(result).toEqual({
      success: false,
      error: 'Contract value must be a number',
    })
  })

  it('returns error when pwin is out of range', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: TEST_USER },
      error: null,
    })

    const fd = makeFormData({ title: 'Test Opp', pwin: '150' })
    const result = await createOpportunity(fd)

    expect(result).toEqual({
      success: false,
      error: 'Win probability must be 0\u2013100',
    })
  })

  it('returns success with id on valid input', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: TEST_USER },
      error: null,
    })

    // The insert chain: from('opportunities').insert(...).select('id').single()
    // We need single() to return the created row
    mockQueryBuilder.single.mockResolvedValue({
      data: { id: 'new-opp-id' },
      error: null,
    })

    const fd = makeFormData({ title: 'Test Opportunity', agency: 'DoD' })
    const result = await createOpportunity(fd)

    expect(result).toEqual({ success: true, id: 'new-opp-id' })
  })

  it('sanitizes the title via sanitizePlainText', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: TEST_USER },
      error: null,
    })
    mockQueryBuilder.single.mockResolvedValue({
      data: { id: 'new-opp-id' },
      error: null,
    })

    const fd = makeFormData({ title: '<script>alert("xss")</script>Legit Title' })
    await createOpportunity(fd)

    expect(sanitizePlainText).toHaveBeenCalledWith(
      '<script>alert("xss")</script>Legit Title'
    )
  })

  it('writes to audit_logs and activity_log after successful create', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: TEST_USER },
      error: null,
    })
    mockQueryBuilder.single.mockResolvedValue({
      data: { id: 'new-opp-id' },
      error: null,
    })

    const fd = makeFormData({ title: 'Audit Test' })
    await createOpportunity(fd)

    // from() is called for: opportunities (insert), audit_logs, activity_log
    const fromCalls = mockSupabase.from.mock.calls.map(
      (call: [string]) => call[0]
    )
    expect(fromCalls).toContain('audit_logs')
    expect(fromCalls).toContain('activity_log')

    // Verify tryCompleteOnboardingStep was called
    expect(tryCompleteOnboardingStep).toHaveBeenCalledWith('create_opportunity')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// updateOpportunity
// ═══════════════════════════════════════════════════════════════════════════
describe('updateOpportunity', () => {
  it('returns error when user is not authenticated', async () => {
    const fd = makeFormData({ title: 'Updated' })
    const result = await updateOpportunity('opp-1', fd)

    expect(result).toEqual({ success: false, error: 'Not authenticated' })
  })

  it('returns success and writes audit trail on valid update', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: TEST_USER },
      error: null,
    })

    // update().eq() chain — the terminal method is eq() which returns this,
    // but opportunities.ts awaits the chain directly (no .single()).
    // The final awaited value comes from eq(). We need to make the last
    // chain call resolve to { error: null }.
    mockQueryBuilder.eq.mockResolvedValue({ data: null, error: null })

    const fd = makeFormData({ title: 'Updated Opp', pwin: '75' })
    const result = await updateOpportunity('opp-1', fd)

    expect(result).toEqual({ success: true, id: 'opp-1' })

    // Verify audit trail writes
    const fromCalls = mockSupabase.from.mock.calls.map(
      (call: [string]) => call[0]
    )
    expect(fromCalls).toContain('audit_logs')
    expect(fromCalls).toContain('activity_log')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// deleteOpportunity
// ═══════════════════════════════════════════════════════════════════════════
describe('deleteOpportunity', () => {
  it('returns error when user is not authenticated', async () => {
    const result = await deleteOpportunity('opp-1')

    expect(result).toEqual({ success: false, error: 'Not authenticated' })
  })

  it('returns success and writes audit trail on valid delete', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: TEST_USER },
      error: null,
    })

    // deleteOpportunity does two queries on 'opportunities':
    //   1. .select('title').eq('id', id).single() — fetch title for audit
    //   2. .delete().eq('id', id) — perform the delete
    //
    // We use separate query builders for each from() call so chaining
    // doesn't conflict.
    const selectBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { title: 'Doomed Opp' },
        error: null,
      }),
    }

    const deleteBuilder = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    }

    const auditBuilder = {
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    }

    let callIndex = 0
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'opportunities') {
        callIndex++
        // First call: select title; Second call: delete
        return callIndex === 1 ? selectBuilder : deleteBuilder
      }
      // audit_logs and activity_log
      return auditBuilder
    })

    const result = await deleteOpportunity('opp-1')

    expect(result).toEqual({ success: true })

    const fromCalls = mockSupabase.from.mock.calls.map(
      (call: [string]) => call[0]
    )
    expect(fromCalls).toContain('audit_logs')
    expect(fromCalls).toContain('activity_log')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// updateOpportunityField
// ═══════════════════════════════════════════════════════════════════════════
describe('updateOpportunityField', () => {
  it('returns error for non-editable field', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: TEST_USER },
      error: null,
    })

    const result = await updateOpportunityField('opp-1', 'owner_id', 'hacker')

    expect(result).toEqual({
      success: false,
      error: 'Field "owner_id" is not editable',
    })
  })
})
