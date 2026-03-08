/**
 * Tests for lib/ai/fine-tune/data-exporter.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock Supabase ──────────────────────────────────────────

const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: (...args: unknown[]) => mockFrom(...args),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
  }),
}))

import {
  exportTrainingData,
  validateTrainingData,
  type TrainingPair,
} from '@/lib/ai/fine-tune/data-exporter'

beforeEach(() => {
  vi.clearAllMocks()
})

function makeChain(resolvedData: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: resolvedData, error: null }),
    single: vi.fn().mockResolvedValue({ data: resolvedData, error: null }),
    insert: vi.fn().mockResolvedValue({ error: null }),
  }
}

// ─── exportTrainingData ──────────────────────────────────────

describe('exportTrainingData', () => {
  it('returns empty result when no approvals found', async () => {
    mockFrom.mockReturnValue(makeChain(null))

    const result = await exportTrainingData('company-1')
    expect(result.totalExported).toBe(0)
    expect(result.pairs).toEqual([])
    expect(result.jsonlContent).toBe('')
    expect(result.qualityMetrics.avgConfidence).toBe(0)
  })

  it('returns empty result when approvals is empty array', async () => {
    mockFrom.mockReturnValue(makeChain([]))

    const result = await exportTrainingData('company-1')
    expect(result.totalExported).toBe(0)
  })

  it('exports matching approval-interaction pairs', async () => {
    const approvals = [
      {
        id: 'a1',
        status: 'approved',
        confidence_score: 0.9,
        agent_type: 'writer',
        opportunity_id: 'opp-1',
        ai_output: 'Generated proposal section.',
        human_edited: null,
        reviewed_at: '2026-01-15',
        reviewer_id: 'user-2',
        created_at: '2026-01-10',
      },
    ]
    const interactions = [
      {
        opportunity_id: 'opp-1',
        agent_type: 'writer',
        prompt: 'Write a technical approach section.',
        tokens_input: 100,
        tokens_output: 200,
        created_at: '2026-01-10',
        company_id: 'company-1',
      },
    ]

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return makeChain(approvals)
      return makeChain(interactions)
    })

    const result = await exportTrainingData('company-1')
    expect(result.totalExported).toBe(1)
    expect(result.pairs[0].prompt).toBe('Write a technical approach section.')
    expect(result.pairs[0].completion).toBe('Generated proposal section.')
    expect(result.pairs[0].metadata.confidence).toBe('high')
    expect(result.pairs[0].metadata.tokens).toBe(300)
    expect(result.jsonlContent).toContain('"role":"system"')
    expect(result.jsonlContent).toContain('"role":"user"')
    expect(result.jsonlContent).toContain('"role":"assistant"')
  })

  it('uses human_edited version when available', async () => {
    const approvals = [{
      id: 'a1', status: 'approved', confidence_score: 0.85, agent_type: 'writer',
      opportunity_id: 'opp-1', ai_output: 'Original AI text.',
      human_edited: 'Human-edited improved text.',
      reviewed_at: '2026-01-15', reviewer_id: 'user-2', created_at: '2026-01-10',
    }]
    const interactions = [{
      opportunity_id: 'opp-1', agent_type: 'writer',
      prompt: 'Write section.', tokens_input: 50, tokens_output: 100,
      created_at: '2026-01-10', company_id: 'company-1',
    }]

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return makeChain(approvals)
      return makeChain(interactions)
    })

    const result = await exportTrainingData('company-1')
    expect(result.pairs[0].completion).toBe('Human-edited improved text.')
  })

  it('filters by taskTypes when provided', async () => {
    const approvals = [
      { id: 'a1', status: 'approved', confidence_score: 0.9, agent_type: 'writer', opportunity_id: 'opp-1', ai_output: 'Text.', human_edited: null, reviewed_at: '2026-01-15', reviewer_id: null, created_at: '2026-01-10' },
      { id: 'a2', status: 'approved', confidence_score: 0.9, agent_type: 'capture', opportunity_id: 'opp-2', ai_output: 'Capture text.', human_edited: null, reviewed_at: '2026-01-16', reviewer_id: null, created_at: '2026-01-11' },
    ]
    const interactions = [
      { opportunity_id: 'opp-1', agent_type: 'writer', prompt: 'Write.', tokens_input: 50, tokens_output: 50, created_at: '2026-01-10', company_id: 'company-1' },
      { opportunity_id: 'opp-2', agent_type: 'capture', prompt: 'Analyze.', tokens_input: 50, tokens_output: 50, created_at: '2026-01-11', company_id: 'company-1' },
    ]

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return makeChain(approvals)
      return makeChain(interactions)
    })

    const result = await exportTrainingData('company-1', { taskTypes: ['writer'] })
    expect(result.totalExported).toBe(1)
    expect(result.totalFiltered).toBe(1)
    expect(result.pairs[0].metadata.taskType).toBe('writer')
  })

  it('filters out pairs with empty prompt or completion', async () => {
    const approvals = [{
      id: 'a1', status: 'approved', confidence_score: 0.9, agent_type: 'writer',
      opportunity_id: 'opp-no-match', ai_output: 'Text.',
      human_edited: null, reviewed_at: '2026-01-15', reviewer_id: null, created_at: '2026-01-10',
    }]
    // No matching interaction
    const interactions: unknown[] = []

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return makeChain(approvals)
      return makeChain(interactions)
    })

    const result = await exportTrainingData('company-1')
    expect(result.totalExported).toBe(0)
    expect(result.totalFiltered).toBe(1)
  })
})

// ─── validateTrainingData ────────────────────────────────────

describe('validateTrainingData', () => {
  function makePair(overrides: Partial<TrainingPair> = {}): TrainingPair {
    return {
      prompt: 'Write a section about our FHIR R4 integration approach.',
      completion: 'Our team has deployed FHIR R4 interfaces at 12 MTFs across the DHA enterprise.',
      system: 'You are a writer assistant.',
      metadata: {
        taskType: 'writer',
        confidence: 'high',
        opportunityId: 'opp-1',
        acceptedAt: '2026-01-15',
        acceptedBy: 'user-1',
        tokens: 300,
      },
      ...overrides,
    }
  }

  it('returns valid when 10+ pairs with good unique data', async () => {
    const pairs = Array.from({ length: 15 }, (_, i) => makePair({
      prompt: `Write a section about topic number ${i} for the FHIR R4 integration approach.`,
    }))
    const result = await validateTrainingData(pairs)
    expect(result.valid).toBe(true)
    expect(result.issues.length).toBe(0)
    expect(result.stats.totalPairs).toBe(15)
    expect(result.stats.uniqueTaskTypes).toBe(1)
  })

  it('flags fewer than 10 pairs', async () => {
    const pairs = Array.from({ length: 5 }, () => makePair())
    const result = await validateTrainingData(pairs)
    expect(result.valid).toBe(false)
    expect(result.issues.some(i => i.includes('minimum 10'))).toBe(true)
  })

  it('flags short average completion length', async () => {
    const pairs = Array.from({ length: 15 }, () => makePair({ completion: 'Short.' }))
    const result = await validateTrainingData(pairs)
    expect(result.valid).toBe(false)
    expect(result.issues.some(i => i.includes('very short'))).toBe(true)
  })

  it('flags duplicate prompts', async () => {
    const pairs = Array.from({ length: 15 }, () => makePair())
    // All identical prompts = high duplication
    const result = await validateTrainingData(pairs)
    expect(result.valid).toBe(false)
    expect(result.issues.some(i => i.includes('duplicate'))).toBe(true)
  })

  it('reports correct stats', async () => {
    const pairs = [
      ...Array.from({ length: 6 }, (_, i) => makePair({ prompt: `Unique prompt ${i} for writer task` })),
      ...Array.from({ length: 6 }, (_, i) => makePair({
        prompt: `Unique prompt ${i} for capture task`,
        metadata: { ...makePair().metadata, taskType: 'capture' },
      })),
    ]
    const result = await validateTrainingData(pairs)
    expect(result.stats.totalPairs).toBe(12)
    expect(result.stats.uniqueTaskTypes).toBe(2)
    expect(result.stats.avgPromptLength).toBeGreaterThan(0)
    expect(result.stats.avgCompletionLength).toBeGreaterThan(0)
  })
})
