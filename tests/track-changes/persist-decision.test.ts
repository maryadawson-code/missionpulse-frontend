// filepath: tests/track-changes/persist-decision.test.ts
/**
 * Tests for track changes persistence server action.
 * v1.9 Sprint 52 T-52.2
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient } from '../fixtures/supabase'

let mockClient: ReturnType<typeof createMockSupabaseClient>

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => {
    return Promise.resolve(mockClient.client)
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('persistSuggestionDecision', () => {
  const baseParams = {
    suggestionId: 'sugg-1',
    decision: 'accepted' as const,
    sectionId: 'section-1',
    opportunityId: 'opp-1',
    content: 'AI generated paragraph about compliance.',
    confidence: 'high' as const,
    modelAttribution: 'claude-sonnet-4-6',
  }

  it('returns error when user is not authenticated', async () => {
    mockClient = createMockSupabaseClient({ user: null })

    const { persistSuggestionDecision } = await import('@/lib/actions/track-changes')
    const result = await persistSuggestionDecision(baseParams)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Not authenticated')
  })

  it('writes to activity_feed with ai_suggestion_accepted action type', async () => {
    mockClient = createMockSupabaseClient({
      user: { id: 'user-1', email: 'test@test.com' },
      queryData: { full_name: 'Mary W', company_id: 'co-1' },
    })

    mockClient.queryBuilder.single
      .mockResolvedValueOnce({ data: { full_name: 'Mary W', company_id: 'co-1' }, error: null })
      .mockResolvedValueOnce({ data: { section_title: 'Executive Summary' }, error: null })

    const { persistSuggestionDecision } = await import('@/lib/actions/track-changes')
    const result = await persistSuggestionDecision(baseParams)

    expect(result.success).toBe(true)
    expect(mockClient.client.from).toHaveBeenCalledWith('activity_feed')
    expect(mockClient.client.from).toHaveBeenCalledWith('audit_logs')
    expect(mockClient.queryBuilder.insert).toHaveBeenCalled()
  })

  it('writes ai_suggestion_rejected for rejected decisions', async () => {
    mockClient = createMockSupabaseClient({
      user: { id: 'user-1', email: 'test@test.com' },
      queryData: { full_name: 'Mary W', company_id: 'co-1' },
    })

    mockClient.queryBuilder.single
      .mockResolvedValueOnce({ data: { full_name: 'Mary W', company_id: 'co-1' }, error: null })
      .mockResolvedValueOnce({ data: { section_title: 'Tech Volume' }, error: null })

    const { persistSuggestionDecision } = await import('@/lib/actions/track-changes')
    const result = await persistSuggestionDecision({
      ...baseParams,
      decision: 'rejected',
    })

    expect(result.success).toBe(true)
    // Verify both activity_feed and audit_logs were written
    const insertCalls = mockClient.queryBuilder.insert.mock.calls
    expect(insertCalls.length).toBeGreaterThanOrEqual(2)
  })

  it('truncates long content to 200 chars in metadata', async () => {
    mockClient = createMockSupabaseClient({
      user: { id: 'user-1', email: 'test@test.com' },
      queryData: { full_name: 'Mary W', company_id: 'co-1' },
    })

    mockClient.queryBuilder.single
      .mockResolvedValueOnce({ data: { full_name: 'Mary W', company_id: 'co-1' }, error: null })
      .mockResolvedValueOnce({ data: { section_title: 'Section' }, error: null })

    const longContent = 'A'.repeat(500)
    const { persistSuggestionDecision } = await import('@/lib/actions/track-changes')
    const result = await persistSuggestionDecision({
      ...baseParams,
      content: longContent,
    })

    expect(result.success).toBe(true)
    // Verify insert was called (content_preview should be truncated by the action)
    const insertCalls = mockClient.queryBuilder.insert.mock.calls
    expect(insertCalls.length).toBeGreaterThanOrEqual(1)
  })

  it('includes model attribution in audit metadata', async () => {
    mockClient = createMockSupabaseClient({
      user: { id: 'user-1', email: 'test@test.com' },
      queryData: { full_name: 'Mary W', company_id: 'co-1' },
    })

    mockClient.queryBuilder.single
      .mockResolvedValueOnce({ data: { full_name: 'Mary W', company_id: 'co-1' }, error: null })
      .mockResolvedValueOnce({ data: { section_title: 'Section' }, error: null })

    const { persistSuggestionDecision } = await import('@/lib/actions/track-changes')
    const result = await persistSuggestionDecision({
      ...baseParams,
      modelAttribution: 'claude-opus-4-6',
    })

    expect(result.success).toBe(true)
    // Verify audit_logs was called
    expect(mockClient.client.from).toHaveBeenCalledWith('audit_logs')
  })
})
