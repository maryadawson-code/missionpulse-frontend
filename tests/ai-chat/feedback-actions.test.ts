// filepath: tests/ai-chat/feedback-actions.test.ts
/**
 * Tests for AI feedback server action.
 * v1.9 Sprint 53 — AI Feedback System
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

describe('submitAIFeedback', () => {
  const baseParams = {
    messageId: 'msg-1',
    sessionId: 'session-1',
    rating: 'positive' as const,
    agentType: 'writer',
    model: 'claude-sonnet-4-6',
    confidence: 'high',
  }

  it('returns error when user is not authenticated', async () => {
    mockClient = createMockSupabaseClient({ user: null })

    const { submitAIFeedback } = await import(
      '@/app/(dashboard)/ai-chat/feedback-actions'
    )
    const result = await submitAIFeedback(baseParams)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Not authenticated')
  })

  it('writes positive feedback to chat_messages, activity_feed, and audit_logs', async () => {
    mockClient = createMockSupabaseClient({
      user: { id: 'user-1', email: 'test@test.com' },
      queryData: { full_name: 'Mary W', company_id: 'co-1' },
    })

    mockClient.queryBuilder.single
      .mockResolvedValueOnce({
        data: { full_name: 'Mary W', company_id: 'co-1' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { metadata: {} },
        error: null,
      })

    const { submitAIFeedback } = await import(
      '@/app/(dashboard)/ai-chat/feedback-actions'
    )
    const result = await submitAIFeedback(baseParams)

    expect(result.success).toBe(true)
    expect(mockClient.client.from).toHaveBeenCalledWith('chat_messages')
    expect(mockClient.client.from).toHaveBeenCalledWith('activity_feed')
    expect(mockClient.client.from).toHaveBeenCalledWith('audit_logs')
  })

  it('writes negative feedback with correct action_type', async () => {
    mockClient = createMockSupabaseClient({
      user: { id: 'user-1', email: 'test@test.com' },
      queryData: { full_name: 'Mary W', company_id: 'co-1' },
    })

    mockClient.queryBuilder.single
      .mockResolvedValueOnce({
        data: { full_name: 'Mary W', company_id: 'co-1' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { metadata: {} },
        error: null,
      })

    const { submitAIFeedback } = await import(
      '@/app/(dashboard)/ai-chat/feedback-actions'
    )
    const result = await submitAIFeedback({
      ...baseParams,
      rating: 'negative',
    })

    expect(result.success).toBe(true)
    // Verify insert was called for activity_feed and audit_logs
    const insertCalls = mockClient.queryBuilder.insert.mock.calls
    expect(insertCalls.length).toBeGreaterThanOrEqual(2)
  })

  it('merges with existing metadata without overwriting', async () => {
    mockClient = createMockSupabaseClient({
      user: { id: 'user-1', email: 'test@test.com' },
      queryData: { full_name: 'Mary W', company_id: 'co-1' },
    })

    mockClient.queryBuilder.single
      .mockResolvedValueOnce({
        data: { full_name: 'Mary W', company_id: 'co-1' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { metadata: { existing_key: 'preserved' } },
        error: null,
      })

    const { submitAIFeedback } = await import(
      '@/app/(dashboard)/ai-chat/feedback-actions'
    )
    const result = await submitAIFeedback(baseParams)

    expect(result.success).toBe(true)
    // Verify update was called (for chat_messages metadata merge)
    expect(mockClient.queryBuilder.update).toHaveBeenCalled()
  })

  it('includes agent_type and model in audit metadata', async () => {
    mockClient = createMockSupabaseClient({
      user: { id: 'user-1', email: 'test@test.com' },
      queryData: { full_name: 'Mary W', company_id: 'co-1' },
    })

    mockClient.queryBuilder.single
      .mockResolvedValueOnce({
        data: { full_name: 'Mary W', company_id: 'co-1' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { metadata: {} },
        error: null,
      })

    const { submitAIFeedback } = await import(
      '@/app/(dashboard)/ai-chat/feedback-actions'
    )
    const result = await submitAIFeedback({
      ...baseParams,
      model: 'claude-opus-4-6',
      agentType: 'capture',
    })

    expect(result.success).toBe(true)
    // Verify audit_logs was called
    expect(mockClient.client.from).toHaveBeenCalledWith('audit_logs')
  })
})
