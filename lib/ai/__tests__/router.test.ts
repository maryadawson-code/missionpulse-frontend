/**
 * Unit tests for AI Router — classification-aware provider routing.
 * Tests routeRequest(), routedQuery(), and getProviderStatus().
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (hoisted by Vitest) ─────────────────────────────

vi.mock('@/lib/ai/providers/routing-config', () => ({
  getPrimaryProviderId: vi.fn().mockResolvedValue('anthropic'),
  getFallbackProviderId: vi.fn().mockResolvedValue('openai'),
}))

vi.mock('@/lib/ai/providers/asksage', () => ({
  createAskSageProvider: vi.fn().mockResolvedValue({
    id: 'asksage',
    name: 'AskSage (FedRAMP)',
    isFedRAMPAuthorized: true,
    isConfigured: () => true,
    query: vi.fn().mockResolvedValue({
      content: 'AskSage response',
      model: 'claude-haiku-4-5',
      tokensUsed: { input: 100, output: 200, total: 300 },
      provider: 'asksage',
    }),
    classify: vi.fn(),
    ping: vi.fn(),
  }),
}))

vi.mock('@/lib/ai/providers/anthropic', () => ({
  createAnthropicProvider: vi.fn().mockResolvedValue({
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    isFedRAMPAuthorized: false,
    isConfigured: () => true,
    query: vi.fn().mockResolvedValue({
      content: 'Anthropic response',
      model: 'claude-sonnet-4-5',
      tokensUsed: { input: 150, output: 250, total: 400 },
      provider: 'anthropic',
    }),
    classify: vi.fn(),
    ping: vi.fn(),
  }),
}))

vi.mock('@/lib/ai/providers/openai', () => ({
  createOpenAIProvider: vi.fn().mockResolvedValue({
    id: 'openai',
    name: 'OpenAI (GPT)',
    isFedRAMPAuthorized: false,
    isConfigured: () => true,
    query: vi.fn().mockResolvedValue({
      content: 'OpenAI response',
      model: 'gpt-4o',
      tokensUsed: { input: 120, output: 180, total: 300 },
      provider: 'openai',
    }),
    classify: vi.fn(),
    ping: vi.fn(),
  }),
}))

// ─── Imports (after mocks) ──────────────────────────────────

import { routeRequest, routedQuery, getProviderStatus } from '../router'
// Types used inline as string literals in tests

// ─── Tests ──────────────────────────────────────────────────

describe('AI Router', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the internal provider cache between tests by re-importing
    // The cache is module-scoped, so we reset it via dynamic import side-effects
  })

  // ─── routeRequest ───────────────────────────────────────

  describe('routeRequest(classification)', () => {
    it('routes CUI classification to FedRAMP-authorized provider only', async () => {
      const result = await routeRequest('CUI')

      expect(result.classification).toBe('CUI')
      expect(result.provider.id).toBe('asksage')
      expect(result.provider.isFedRAMPAuthorized).toBe(true)
      expect(result.reason).toContain('FedRAMP-only routing')
      // Fallback should be null since AskSage is the only FedRAMP provider
      expect(result.fallback).toBeNull()
    })

    it('routes CUI//SP-PROPIN classification to FedRAMP provider', async () => {
      const result = await routeRequest('CUI//SP-PROPIN')

      expect(result.classification).toBe('CUI//SP-PROPIN')
      expect(result.provider.id).toBe('asksage')
      expect(result.provider.isFedRAMPAuthorized).toBe(true)
      expect(result.reason).toContain('FedRAMP-only routing')
    })

    it('routes OPSEC classification to FedRAMP provider', async () => {
      const result = await routeRequest('OPSEC')

      expect(result.classification).toBe('OPSEC')
      expect(result.provider.id).toBe('asksage')
      expect(result.provider.isFedRAMPAuthorized).toBe(true)
    })

    it('routes UNCLASSIFIED to configured primary provider with fallback', async () => {
      const result = await routeRequest('UNCLASSIFIED')

      expect(result.classification).toBe('UNCLASSIFIED')
      // Primary is configured as 'anthropic' via mock
      expect(result.provider.id).toBe('anthropic')
      // Fallback is configured as 'openai' via mock
      expect(result.fallback).not.toBeNull()
      expect(result.fallback?.id).toBe('openai')
      expect(result.reason).toContain('UNCLASSIFIED')
    })

    it('returns correct RouteResult shape', async () => {
      const result = await routeRequest('UNCLASSIFIED')

      expect(result).toHaveProperty('provider')
      expect(result).toHaveProperty('fallback')
      expect(result).toHaveProperty('classification')
      expect(result).toHaveProperty('reason')
      expect(result.provider).toHaveProperty('id')
      expect(result.provider).toHaveProperty('name')
      expect(result.provider).toHaveProperty('isFedRAMPAuthorized')
      expect(typeof result.reason).toBe('string')
    })
  })

  // ─── routedQuery ────────────────────────────────────────

  describe('routedQuery(request, classification)', () => {
    it('executes query on the routed provider for UNCLASSIFIED', async () => {
      const response = await routedQuery(
        {
          model: 'claude-sonnet-4-5',
          prompt: 'Test prompt',
          maxTokens: 1024,
        },
        'UNCLASSIFIED'
      )

      expect(response.content).toBe('Anthropic response')
      expect(response.provider).toBe('anthropic')
    })

    it('executes query on FedRAMP provider for CUI', async () => {
      const response = await routedQuery(
        {
          model: 'claude-haiku-4-5',
          prompt: 'CUI-classified prompt',
        },
        'CUI'
      )

      expect(response.content).toBe('AskSage response')
      expect(response.provider).toBe('asksage')
    })
  })

  // ─── getProviderStatus ──────────────────────────────────

  describe('getProviderStatus()', () => {
    it('returns array of provider status objects', async () => {
      const statuses = await getProviderStatus()

      expect(Array.isArray(statuses)).toBe(true)
      expect(statuses.length).toBe(3)
    })

    it('includes correct fields for each provider', async () => {
      const statuses = await getProviderStatus()

      for (const status of statuses) {
        expect(status).toHaveProperty('id')
        expect(status).toHaveProperty('name')
        expect(status).toHaveProperty('configured')
        expect(status).toHaveProperty('fedRamp')
        expect(status).toHaveProperty('isPrimary')
        expect(status).toHaveProperty('isFallback')
      }
    })

    it('marks the correct primary and fallback providers', async () => {
      const statuses = await getProviderStatus()

      const primary = statuses.find((s) => s.isPrimary)
      const fallback = statuses.find((s) => s.isFallback)

      expect(primary?.id).toBe('anthropic')
      expect(fallback?.id).toBe('openai')
    })

    it('marks AskSage as FedRAMP authorized', async () => {
      const statuses = await getProviderStatus()

      const asksage = statuses.find((s) => s.id === 'asksage')
      expect(asksage?.fedRamp).toBe(true)

      const anthropic = statuses.find((s) => s.id === 'anthropic')
      expect(anthropic?.fedRamp).toBe(false)
    })
  })
})
