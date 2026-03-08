/**
 * Tests for lib/ai/research-router.ts
 *
 * The module reads PERPLEXITY_API_KEY and ANTHROPIC_API_KEY at top-level as
 * consts from process.env. We must set them before the module evaluates.
 * vi.hoisted() runs before imports, so we set env there.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Set env vars before any imports evaluate (vi.hoisted runs first)
vi.hoisted(() => {
  process.env.PERPLEXITY_API_KEY = 'pplx-test-key'
  process.env.ANTHROPIC_API_KEY = 'anthropic-test-key'
})

// ─── Mock logger ─────────────────────────────────────────────

vi.mock('@/lib/logging/logger', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}))

// ─── Mock fetch ──────────────────────────────────────────────

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { runResearch, type ResearchQuery } from '@/lib/ai/research-router'

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── CUI Routing ─────────────────────────────────────────────

describe('CUI routing', () => {
  it('returns asksage engine for CUI content', async () => {
    const query: ResearchQuery = {
      query: 'Who is the incumbent on this contract?',
      agentType: 'capture',
      isCUI: true,
    }
    const result = await runResearch(query)
    expect(result.engine).toBe('asksage')
    expect(result.content).toBe('')
    expect(result.skippedReason).toContain('CUI')
  })
})

// ─── Engine Selection: No Research Needed ────────────────────

describe('no research needed', () => {
  it('returns none for writer agent type', async () => {
    const result = await runResearch({
      query: 'Write a technical approach section.',
      agentType: 'writer',
      isCUI: false,
    })
    expect(result.engine).toBe('none')
    expect(result.skippedReason).toContain('writer')
  })

  it('returns none for orals agent type', async () => {
    const result = await runResearch({
      query: 'Prepare oral presentation Q&A.',
      agentType: 'orals',
      isCUI: false,
    })
    expect(result.engine).toBe('none')
    expect(result.skippedReason).toContain('orals')
  })

  it('returns none for contracts agent type', async () => {
    const result = await runResearch({
      query: 'Review contract clauses.',
      agentType: 'contracts',
      isCUI: false,
    })
    expect(result.engine).toBe('none')
    expect(result.skippedReason).toContain('contracts')
  })
})

// ─── Engine Selection: Capture/Strategy/Blackhat ─────────────

describe('capture/strategy/blackhat routing (with API keys)', () => {
  it('uses anthropic-search for capture without deep research signals', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: 'Research result about the opportunity.', citations: [{ url: 'https://sam.gov/example' }] }],
      }),
    })

    const result = await runResearch({
      query: 'Analyze this opportunity.',
      agentType: 'capture',
      isCUI: false,
    })
    expect(result.engine).toBe('anthropic-search')
    expect(result.content).toContain('Research result')
    expect(result.sources).toContain('https://sam.gov/example')
  })

  it('uses perplexity-deep for deep research signals', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Incumbent is Leidos.' } }],
        citations: ['https://usaspending.gov/award/1'],
      }),
    })

    const result = await runResearch({
      query: 'Who is the incumbent on this contract?',
      agentType: 'strategy',
      isCUI: false,
    })
    expect(result.engine).toBe('perplexity-deep')
    expect(result.content).toContain('Leidos')
    expect(result.sources).toContain('https://usaspending.gov/award/1')
  })
})

// ─── Engine Selection: Compliance/Pricing ────────────────────

describe('compliance and pricing routing (with API keys)', () => {
  it('uses anthropic-search for compliance', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: 'FedRAMP update.', citations: [] }],
      }),
    })

    const result = await runResearch({
      query: 'Check FedRAMP status.',
      agentType: 'compliance',
      isCUI: false,
    })
    expect(result.engine).toBe('anthropic-search')
  })

  it('uses anthropic-search for pricing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: 'GSA rates.', citations: [] }],
      }),
    })

    const result = await runResearch({
      query: 'GSA rate check.',
      agentType: 'pricing',
      isCUI: false,
    })
    expect(result.engine).toBe('anthropic-search')
  })
})

// ─── API Error Handling ──────────────────────────────────────

describe('API error handling', () => {
  it('handles Anthropic API error gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    })

    const result = await runResearch({
      query: 'Analyze opportunity.',
      agentType: 'capture',
      isCUI: false,
    })
    expect(result.engine).toBe('anthropic-search')
    expect(result.content).toBe('')
    expect(result.skippedReason).toContain('500')
  })

  it('handles Anthropic fetch exception gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network timeout'))

    const result = await runResearch({
      query: 'Analyze opportunity.',
      agentType: 'capture',
      isCUI: false,
    })
    expect(result.engine).toBe('anthropic-search')
    expect(result.content).toBe('')
    expect(result.skippedReason).toContain('Network timeout')
  })

  it('handles Perplexity API error gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => 'Rate limited',
    })

    const result = await runResearch({
      query: 'Who is the incumbent on this recompete?',
      agentType: 'capture',
      isCUI: false,
    })
    expect(result.engine).toBe('perplexity-deep')
    expect(result.content).toBe('')
    expect(result.skippedReason).toContain('429')
  })

  it('handles Perplexity fetch exception gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'))

    const result = await runResearch({
      query: 'Who is the incumbent on this recompete?',
      agentType: 'capture',
      isCUI: false,
    })
    expect(result.engine).toBe('perplexity-deep')
    expect(result.content).toBe('')
    expect(result.skippedReason).toContain('Connection refused')
  })
})

// ─── Opportunity Context ─────────────────────────────────────

describe('opportunity context in prompts', () => {
  it('includes opportunity context in search requests', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: 'Result.', citations: [] }],
      }),
    })

    await runResearch({
      query: 'Analyze this opportunity.',
      agentType: 'capture',
      isCUI: false,
      opportunityContext: {
        title: 'MHS GENESIS Support',
        agency: 'DHA',
        vehicle: 'MHS EITS',
        ceiling: 5000000,
      },
    })

    const fetchCall = mockFetch.mock.calls[0]
    const body = JSON.parse(fetchCall[1].body)
    const userMessage = body.messages[0].content
    expect(userMessage).toContain('DHA')
    expect(userMessage).toContain('MHS EITS')
    expect(userMessage).toContain('5,000,000')
  })
})
