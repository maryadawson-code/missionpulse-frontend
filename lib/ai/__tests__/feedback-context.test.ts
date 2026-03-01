/**
 * Tests for AI Agent Self-Learning Feedback Loop
 *
 * v1.9 Sprint 53
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient, createMockQueryBuilder } from '@/tests/fixtures/supabase'

// Mock Supabase server client
const mockCreateClient = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockCreateClient(),
}))

// Import after mocks
const { buildFeedbackContext, getAgentSatisfactionScores } = await import(
  '../feedback-context'
)

describe('buildFeedbackContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when not authenticated', async () => {
    const { client } = createMockSupabaseClient({ user: null })
    mockCreateClient.mockReturnValue(client)

    const result = await buildFeedbackContext('capture')
    expect(result).toBeNull()
  })

  it('returns null when fewer than 3 feedback entries for agent', async () => {
    const profileBuilder = createMockQueryBuilder()
    profileBuilder.single.mockResolvedValue({
      data: { company_id: 'comp-1' },
      error: null,
    })

    const feedbackBuilder = createMockQueryBuilder()
    // Override thenable to return only 2 entries, both for a different agent
    feedbackBuilder.then = (resolve: (_v: { data: unknown; error: null }) => void) =>
      resolve({
        data: [
          { action_type: 'ai_feedback_positive', metadata: { agent_type: 'capture' }, created_at: '2026-02-15' },
          { action_type: 'ai_feedback_negative', metadata: { agent_type: 'capture' }, created_at: '2026-02-14' },
        ],
        error: null,
      })

    let callCount = 0
    const client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'u-1', email: 'test@test.com' } },
          error: null,
        }),
      },
      from: vi.fn(() => {
        callCount++
        return callCount === 1 ? profileBuilder : feedbackBuilder
      }),
    }
    mockCreateClient.mockReturnValue(client)

    const result = await buildFeedbackContext('capture')
    expect(result).toBeNull()
  })

  it('builds correct instructions from positive + negative feedback', async () => {
    const profileBuilder = createMockQueryBuilder()
    profileBuilder.single.mockResolvedValue({
      data: { company_id: 'comp-1' },
      error: null,
    })

    const feedbackData = [
      { action_type: 'ai_feedback_positive', metadata: { agent_type: 'capture' }, created_at: '2026-02-20' },
      { action_type: 'ai_feedback_positive', metadata: { agent_type: 'capture' }, created_at: '2026-02-19' },
      { action_type: 'ai_feedback_positive', metadata: { agent_type: 'capture' }, created_at: '2026-02-18' },
      { action_type: 'ai_feedback_negative', metadata: { agent_type: 'capture', comment: 'Too generic' }, created_at: '2026-02-17' },
      { action_type: 'ai_feedback_positive', metadata: { agent_type: 'capture' }, created_at: '2026-02-16' },
    ]

    const feedbackBuilder = createMockQueryBuilder()
    feedbackBuilder.then = (resolve: (_v: { data: unknown; error: null }) => void) =>
      resolve({ data: feedbackData, error: null })

    let callCount = 0
    const client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'u-1', email: 'test@test.com' } },
          error: null,
        }),
      },
      from: vi.fn(() => {
        callCount++
        return callCount === 1 ? profileBuilder : feedbackBuilder
      }),
    }
    mockCreateClient.mockReturnValue(client)

    const result = await buildFeedbackContext('capture')
    expect(result).not.toBeNull()
    expect(result!.instructions).toContain('LEARNING FROM USER FEEDBACK')
    expect(result!.instructions).toContain('80% positive')
    expect(result!.instructions).toContain('4 positive')
    expect(result!.instructions).toContain('1 negative')
  })

  it('includes negative comments in instruction string', async () => {
    const profileBuilder = createMockQueryBuilder()
    profileBuilder.single.mockResolvedValue({
      data: { company_id: 'comp-1' },
      error: null,
    })

    const feedbackData = [
      { action_type: 'ai_feedback_positive', metadata: { agent_type: 'strategy' }, created_at: '2026-02-20' },
      { action_type: 'ai_feedback_negative', metadata: { agent_type: 'strategy', comment: 'Missing cost details' }, created_at: '2026-02-19' },
      { action_type: 'ai_feedback_negative', metadata: { agent_type: 'strategy', comment: 'Too vague' }, created_at: '2026-02-18' },
      { action_type: 'ai_feedback_positive', metadata: { agent_type: 'strategy' }, created_at: '2026-02-17' },
    ]

    const feedbackBuilder = createMockQueryBuilder()
    feedbackBuilder.then = (resolve: (_v: { data: unknown; error: null }) => void) =>
      resolve({ data: feedbackData, error: null })

    let callCount = 0
    const client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'u-1', email: 'test@test.com' } },
          error: null,
        }),
      },
      from: vi.fn(() => {
        callCount++
        return callCount === 1 ? profileBuilder : feedbackBuilder
      }),
    }
    mockCreateClient.mockReturnValue(client)

    const result = await buildFeedbackContext('strategy')
    expect(result).not.toBeNull()
    expect(result!.instructions).toContain('Missing cost details')
    expect(result!.instructions).toContain('Too vague')
  })

  it('calculates satisfaction score correctly', async () => {
    const profileBuilder = createMockQueryBuilder()
    profileBuilder.single.mockResolvedValue({
      data: { company_id: 'comp-1' },
      error: null,
    })

    // 7 positive, 3 negative = 70%
    const feedbackData = [
      ...Array.from({ length: 7 }, (_, i) => ({
        action_type: 'ai_feedback_positive',
        metadata: { agent_type: 'writer' },
        created_at: `2026-02-${20 - i}`,
      })),
      ...Array.from({ length: 3 }, (_, i) => ({
        action_type: 'ai_feedback_negative',
        metadata: { agent_type: 'writer' },
        created_at: `2026-02-${10 - i}`,
      })),
    ]

    const feedbackBuilder = createMockQueryBuilder()
    feedbackBuilder.then = (resolve: (_v: { data: unknown; error: null }) => void) =>
      resolve({ data: feedbackData, error: null })

    let callCount = 0
    const client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'u-1', email: 'test@test.com' } },
          error: null,
        }),
      },
      from: vi.fn(() => {
        callCount++
        return callCount === 1 ? profileBuilder : feedbackBuilder
      }),
    }
    mockCreateClient.mockReturnValue(client)

    const result = await buildFeedbackContext('writer')
    expect(result).not.toBeNull()
    expect(result!.satisfactionScore).toBe(70)
    expect(result!.totalPositive).toBe(7)
    expect(result!.totalNegative).toBe(3)
  })
})

describe('getAgentSatisfactionScores', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns correct per-agent shape', async () => {
    const feedbackData = [
      { action_type: 'ai_feedback_positive', metadata: { agent_type: 'capture' } },
      { action_type: 'ai_feedback_positive', metadata: { agent_type: 'capture' } },
      { action_type: 'ai_feedback_negative', metadata: { agent_type: 'capture' } },
      { action_type: 'ai_feedback_positive', metadata: { agent_type: 'writer' } },
      { action_type: 'ai_feedback_positive', metadata: { agent_type: 'writer' } },
    ]

    const feedbackBuilder = createMockQueryBuilder()
    feedbackBuilder.then = (resolve: (_v: { data: unknown; error: null }) => void) =>
      resolve({ data: feedbackData, error: null })

    const client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'u-1' } },
          error: null,
        }),
      },
      from: vi.fn(() => feedbackBuilder),
    }
    mockCreateClient.mockReturnValue(client)

    const scores = await getAgentSatisfactionScores('comp-1')

    expect(scores).toHaveLength(2)

    const captureScore = scores.find((s) => s.agentType === 'capture')
    expect(captureScore).toBeDefined()
    expect(captureScore!.satisfactionScore).toBe(67)
    expect(captureScore!.totalPositive).toBe(2)
    expect(captureScore!.totalNegative).toBe(1)
    expect(captureScore!.totalFeedback).toBe(3)

    const writerScore = scores.find((s) => s.agentType === 'writer')
    expect(writerScore).toBeDefined()
    expect(writerScore!.satisfactionScore).toBe(100)
    expect(writerScore!.totalPositive).toBe(2)
    expect(writerScore!.totalNegative).toBe(0)
    expect(writerScore!.totalFeedback).toBe(2)
  })
})
