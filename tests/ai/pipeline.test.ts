import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock all pipeline dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@test.com' } },
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { company_id: 'company-1', role: 'executive' },
        error: null,
      }),
    })),
  }),
}))

vi.mock('@/lib/billing/token-gate', () => ({
  checkTokenGate: vi.fn(),
  recordTokenUsage: vi.fn().mockResolvedValue({ balance: null }),
}))

vi.mock('@/lib/ai/classification-router', () => ({
  classifyRequest: vi.fn().mockResolvedValue({
    level: 'UNCLASSIFIED',
    reasons: [],
    patterns_matched: [],
  }),
}))

vi.mock('@/lib/ai/model-selector', () => ({
  selectModel: vi.fn().mockResolvedValue({
    primary: {
      model: 'test-model',
      engine: 'asksage',
      maxTokens: 4096,
      temperature: 0.7,
      estimatedCostPer1k: 0.01,
    },
  }),
}))

vi.mock('@/lib/ai/router', () => ({
  routedQuery: vi.fn().mockResolvedValue({
    content: 'Test response from AI',
    model: 'test-model',
    provider: 'asksage',
    tokensUsed: { input: 100, output: 200 },
  }),
}))

vi.mock('@/lib/ai/logger', () => ({
  logTokenUsage: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/cache/semantic-cache', () => ({
  getCachedResponse: vi.fn().mockResolvedValue(null),
  setCachedResponse: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/rbac/config', () => ({
  resolveRole: vi.fn().mockReturnValue('executive'),
  getAllowedAgents: vi.fn().mockReturnValue([
    'chat', 'capture', 'compliance', 'strategy', 'blackhat',
    'pricing', 'orals', 'contracts', 'writer', 'summarize', 'classify',
  ]),
}))

describe('AI Pipeline — Token Gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error content when token balance is exhausted (hard block)', async () => {
    const { checkTokenGate } = await import('@/lib/billing/token-gate')
    vi.mocked(checkTokenGate).mockResolvedValueOnce({
      allowed: false,
      threshold: 'hard_block',
      balance: null,
      message: 'Monthly AI token limit exceeded (120%).',
      upgrade_cta: true,
      grace_period: false,
    })

    const { aiRequest } = await import('@/lib/ai/pipeline')
    const result = await aiRequest({
      taskType: 'chat',
      prompt: 'Test prompt',
    })

    expect(result.content).toContain('token limit')
    expect(result.model_used).toBe('none')
    expect(result.tokens_in).toBe(0)
    expect(result.tokens_out).toBe(0)
  })

  it('proceeds with AI call when token balance is sufficient', async () => {
    const { checkTokenGate } = await import('@/lib/billing/token-gate')
    vi.mocked(checkTokenGate).mockResolvedValueOnce({
      allowed: true,
      threshold: 'normal',
      balance: {
        allocated: 500_000,
        consumed: 100_000,
        purchased: 0,
        overage_used: 0,
        remaining: 400_000,
        total_available: 500_000,
        usage_percent: 20,
        period_start: '2026-03-01',
        period_end: '2026-04-01',
      },
      message: null,
      upgrade_cta: false,
      grace_period: false,
    })

    const { aiRequest } = await import('@/lib/ai/pipeline')
    const result = await aiRequest({
      taskType: 'chat',
      prompt: 'Test prompt',
    })

    expect(result.content).toBe('Test response from AI')
    expect(result.model_used).toBe('test-model')
    expect(result.tokens_in).toBe(100)
    expect(result.tokens_out).toBe(200)
  })

  it('soft block without grace period returns error', async () => {
    const { checkTokenGate } = await import('@/lib/billing/token-gate')
    vi.mocked(checkTokenGate).mockResolvedValueOnce({
      allowed: false,
      threshold: 'soft_block',
      balance: null,
      message: 'Monthly AI token limit reached.',
      upgrade_cta: true,
      grace_period: false,
    })

    const { aiRequest } = await import('@/lib/ai/pipeline')
    const result = await aiRequest({
      taskType: 'chat',
      prompt: 'Test prompt',
    })

    expect(result.content).toContain('token limit')
    expect(result.model_used).toBe('none')
  })
})
