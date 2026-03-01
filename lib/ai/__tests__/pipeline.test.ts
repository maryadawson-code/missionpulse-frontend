/**
 * Unit tests for AI Request/Response Pipeline — single entry point for all AI operations.
 * Tests aiRequest() for the full pipeline: classify -> select -> route -> log.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (hoisted by Vitest) ─────────────────────────────

vi.mock('@/lib/ai/classification-router', () => ({
  classifyRequest: vi.fn(),
}))

vi.mock('@/lib/ai/model-selector', () => ({
  selectModel: vi.fn(),
}))

vi.mock('@/lib/ai/router', () => ({
  routedQuery: vi.fn(),
}))

vi.mock('@/lib/ai/logger', () => ({
  logTokenUsage: vi.fn(),
}))

vi.mock('@/lib/cache/semantic-cache', () => ({
  getCachedResponse: vi.fn(),
  setCachedResponse: vi.fn(),
}))

vi.mock('@/lib/billing/token-gate', () => ({
  checkTokenGate: vi.fn(),
  recordTokenUsage: vi.fn(),
}))

vi.mock('@/lib/rbac/config', () => ({
  resolveRole: vi.fn(),
  getAllowedAgents: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/logging/logger', () => ({
  createLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

// ─── Imports (after mocks) ──────────────────────────────────

import { aiRequest } from '../pipeline'
import { classifyRequest } from '../classification-router'
import { selectModel } from '../model-selector'
import { routedQuery } from '../router'
import { logTokenUsage } from '../logger'
import { checkTokenGate, recordTokenUsage } from '@/lib/billing/token-gate'
import { getCachedResponse, setCachedResponse } from '@/lib/cache/semantic-cache'
import { resolveRole, getAllowedAgents } from '@/lib/rbac/config'
import { createClient } from '@/lib/supabase/server'

// ─── Default mock values ────────────────────────────────────

const ALL_AGENTS = [
  'chat', 'strategy', 'compliance', 'capture', 'writer',
  'contracts', 'orals', 'pricing', 'summarize', 'classify',
]

const LONG_AI_RESPONSE =
  'This is a detailed AI response with enough length to be classified as high confidence by the inferConfidence function which checks for over 500 characters. We need to make sure this response is long enough to trigger the high confidence path in the pipeline. Adding more text here to ensure we exceed the 500 character threshold that is used in the inferConfidence helper function within the pipeline module.'

function setupDefaultMocks() {
  // Supabase client
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
        },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { company_id: 'company-456', role: 'executive' },
          }),
        }),
      }),
    }),
  } as object)

  // RBAC
  vi.mocked(resolveRole).mockReturnValue('executive')
  vi.mocked(getAllowedAgents).mockReturnValue(ALL_AGENTS)

  // Token gate
  vi.mocked(checkTokenGate).mockResolvedValue({
    allowed: true,
    threshold: 'normal',
    balance: {
      consumed: 1000,
      allocated: 50000,
      purchased: 0,
      overage_used: 0,
      remaining: 49000,
      total_available: 50000,
      usage_percent: 2,
      period_start: '2026-02-01',
      period_end: '2026-02-28',
    },
    message: null,
    upgrade_cta: false,
    grace_period: false,
  })
  vi.mocked(recordTokenUsage).mockResolvedValue({ balance: null })

  // Classification
  vi.mocked(classifyRequest).mockResolvedValue({
    level: 'UNCLASSIFIED',
    reasons: [],
    patterns_matched: [],
  })

  // Model selector
  vi.mocked(selectModel).mockResolvedValue({
    primary: {
      model: 'claude-sonnet-4-5',
      engine: 'asksage',
      maxTokens: 8192,
      temperature: 0.5,
      estimatedCostPer1k: 0.003,
    },
    fallback: {
      model: 'claude-haiku-4-5',
      engine: 'asksage',
      maxTokens: 4096,
      temperature: 0.3,
      estimatedCostPer1k: 0.00025,
    },
    classification: 'UNCLASSIFIED',
    budgetRemaining: 450,
  })

  // Router
  vi.mocked(routedQuery).mockResolvedValue({
    content: LONG_AI_RESPONSE,
    model: 'claude-sonnet-4-5',
    tokensUsed: { input: 200, output: 400, total: 600 },
    provider: 'asksage',
  })

  // Cache
  vi.mocked(getCachedResponse).mockResolvedValue(null)
  vi.mocked(setCachedResponse).mockResolvedValue(undefined)

  // Logger
  vi.mocked(logTokenUsage).mockResolvedValue(undefined)
}

// ─── Tests ──────────────────────────────────────────────────

describe('AI Pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupDefaultMocks()
  })

  // ─── Full pipeline flow ─────────────────────────────────

  describe('aiRequest(options)', () => {
    it('valid request flows through full pipeline: classify -> select -> route -> log', async () => {
      const result = await aiRequest({
        taskType: 'strategy',
        prompt: 'Develop a win strategy for this DoD opportunity',
      })

      // Step 1: Classification was called
      expect(classifyRequest).toHaveBeenCalledWith(
        'Develop a win strategy for this DoD opportunity',
        undefined
      )

      // Step 2: Model selection was called with the classified level
      expect(selectModel).toHaveBeenCalledWith('strategy', 'UNCLASSIFIED')

      // Step 3: Cache check was called
      expect(getCachedResponse).toHaveBeenCalled()

      // Step 4: Routed query was called
      expect(routedQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-4-5',
          prompt: 'Develop a win strategy for this DoD opportunity',
        }),
        'UNCLASSIFIED'
      )

      // Step 5: Token usage was logged
      expect(logTokenUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          agent_id: 'strategy',
          input_tokens: 200,
          output_tokens: 400,
          user_id: 'user-123',
        })
      )

      // Result shape is correct
      expect(result.content).toBeTruthy()
      expect(result.model_used).toBe('claude-sonnet-4-5')
      expect(result.engine).toBe('asksage')
      expect(result.tokens_in).toBe(200)
      expect(result.tokens_out).toBe(400)
      expect(result.classification).toBe('UNCLASSIFIED')
      expect(typeof result.latency_ms).toBe('number')
    })

    it('token gate blocks when company has insufficient tokens', async () => {
      vi.mocked(checkTokenGate).mockResolvedValueOnce({
        allowed: false,
        threshold: 'hard_block',
        balance: null,
        message: 'Monthly AI token limit exceeded (120%).',
        upgrade_cta: true,
        grace_period: false,
      })

      const result = await aiRequest({
        taskType: 'strategy',
        prompt: 'Analyze competitor landscape',
        opportunityId: 'opp-789',
      })

      // Pipeline should return early with the gate message
      expect(result.content).toBe('Monthly AI token limit exceeded (120%).')
      expect(result.model_used).toBe('none')
      expect(result.tokens_in).toBe(0)
      expect(result.tokens_out).toBe(0)

      // Should NOT have called classify, select, or route
      expect(classifyRequest).not.toHaveBeenCalled()
      expect(selectModel).not.toHaveBeenCalled()
      expect(routedQuery).not.toHaveBeenCalled()
    })

    it('ungated tasks (chat) bypass RBAC agent access check', async () => {
      // Even if getAllowedAgents returns an empty list, chat should still work
      vi.mocked(getAllowedAgents).mockReturnValue([])

      const result = await aiRequest({
        taskType: 'chat',
        prompt: 'Hello, how can you help?',
      })

      // Chat is an ungated task, so it should still go through
      expect(result.content).toBeTruthy()
      expect(result.model_used).not.toBe('none')
    })

    it('provider error returns graceful fallback response', async () => {
      vi.mocked(routedQuery).mockRejectedValueOnce(
        new Error('Provider timeout after 30s')
      )

      const result = await aiRequest({
        taskType: 'chat',
        prompt: 'Help me with compliance for Section L',
      })

      // Should return the graceful fallback message
      expect(result.content).toContain('AI processing is currently unavailable')
      expect(result.model_used).toBe('none')
      expect(result.engine).toBe('asksage')
      expect(result.confidence).toBe('low')
      expect(result.tokens_in).toBe(0)
      expect(result.tokens_out).toBe(0)
      expect(result.classification).toBe('UNCLASSIFIED')
    })

    it('returns cached response when available (cache hit)', async () => {
      vi.mocked(getCachedResponse).mockResolvedValueOnce({
        content: 'Cached strategy response',
        model_used: 'claude-sonnet-4-5',
        confidence: 'high',
        cached_at: new Date().toISOString(),
      })

      const result = await aiRequest({
        taskType: 'strategy',
        prompt: 'Develop a win strategy',
      })

      // Should return cached content
      expect(result.content).toBe('Cached strategy response')
      expect(result.tokens_in).toBe(0)
      expect(result.tokens_out).toBe(0)

      // routedQuery should NOT have been called (cache hit)
      expect(routedQuery).not.toHaveBeenCalled()
      // logTokenUsage should NOT have been called (cache hit)
      expect(logTokenUsage).not.toHaveBeenCalled()
    })

    it('passes systemPrompt and context through to the routed query', async () => {
      await aiRequest({
        taskType: 'writer',
        prompt: 'Draft executive summary',
        systemPrompt: 'You are an expert proposal writer.',
        context: 'DoD IDIQ contract for IT services',
      })

      expect(routedQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'Draft executive summary',
          systemPrompt: 'You are an expert proposal writer.',
          context: 'DoD IDIQ contract for IT services',
        }),
        'UNCLASSIFIED'
      )
    })
  })
})
