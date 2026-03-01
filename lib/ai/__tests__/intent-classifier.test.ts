/**
 * Unit tests for Intent Classifier — deterministic regex/keyword engine.
 * Pure function tests: no mocking needed.
 */

import { describe, it, expect } from 'vitest'
import { classifyIntent, AUTO_ROUTE_CONFIDENCE } from '../intent-classifier'

// ─── All agents used in tests ───────────────────────────────

const ALL_AGENTS = [
  'capture',
  'strategy',
  'writer',
  'compliance',
  'pricing',
  'blackhat',
  'contracts',
  'orals',
]

// ─── Tests ──────────────────────────────────────────────────

describe('Intent Classifier', () => {
  describe('classifyIntent(message, allowedAgents)', () => {
    // ─── Writer agent ───────────────────────────────────

    it('classifies "write a draft executive summary" as writer agent', () => {
      const result = classifyIntent(
        'write a draft executive summary',
        ALL_AGENTS
      )

      expect(result.agent).toBe('writer')
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.reasoning).toBeTruthy()
    })

    it('classifies "draft the technical approach section" as writer agent', () => {
      const result = classifyIntent(
        'draft the technical approach section',
        ALL_AGENTS
      )

      expect(result.agent).toBe('writer')
    })

    // ─── Compliance agent ─────────────────────────────

    it('classifies "check compliance requirements" as compliance agent', () => {
      const result = classifyIntent(
        'check compliance requirements',
        ALL_AGENTS
      )

      expect(result.agent).toBe('compliance')
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('classifies "extract shall requirements from the RFP" as compliance', () => {
      const result = classifyIntent(
        'extract shall requirements from the RFP',
        ALL_AGENTS
      )

      expect(result.agent).toBe('compliance')
    })

    // ─── Capture agent ────────────────────────────────

    it('classifies "what is our p-win" as capture agent', () => {
      const result = classifyIntent('what is our p-win', ALL_AGENTS)

      expect(result.agent).toBe('capture')
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('classifies "should we bid on this opportunity" as capture agent', () => {
      const result = classifyIntent(
        'should we bid on this opportunity',
        ALL_AGENTS
      )

      expect(result.agent).toBe('capture')
    })

    // ─── Pricing agent ────────────────────────────────

    it('classifies "calculate the labor rates for LCAT" as pricing agent', () => {
      const result = classifyIntent(
        'calculate the labor rates for LCAT',
        ALL_AGENTS
      )

      expect(result.agent).toBe('pricing')
    })

    it('classifies "what is the basis of estimate" as pricing agent', () => {
      const result = classifyIntent(
        'what is the basis of estimate',
        ALL_AGENTS
      )

      expect(result.agent).toBe('pricing')
    })

    // ─── Strategy agent ───────────────────────────────

    it('classifies "develop win themes and discriminators" as strategy agent', () => {
      const result = classifyIntent(
        'develop win themes and discriminators',
        ALL_AGENTS
      )

      expect(result.agent).toBe('strategy')
    })

    // ─── Contracts agent ──────────────────────────────

    it('classifies "review the FAR clauses for this contract" as contracts agent', () => {
      const result = classifyIntent(
        'review the FAR clauses for this contract',
        ALL_AGENTS
      )

      expect(result.agent).toBe('contracts')
    })

    // ─── Orals agent ──────────────────────────────────

    it('classifies "prepare for the oral presentation" as orals agent', () => {
      const result = classifyIntent(
        'prepare for the oral presentation',
        ALL_AGENTS
      )

      expect(result.agent).toBe('orals')
    })

    // ─── Blackhat agent ───────────────────────────────

    it('classifies "analyze competitor weaknesses" as blackhat agent', () => {
      const result = classifyIntent(
        'analyze competitor weaknesses',
        ALL_AGENTS
      )

      expect(result.agent).toBe('blackhat')
    })

    // ─── Fallback / Edge Cases ────────────────────────

    it('returns writer (fallback) for ambiguous input with no strong matches', () => {
      const result = classifyIntent('hello, can you help me?', ALL_AGENTS)

      // No keywords match, so should fall back to writer (FALLBACK_AGENT)
      expect(result.agent).toBe('writer')
      expect(result.confidence).toBeLessThan(AUTO_ROUTE_CONFIDENCE)
    })

    it('returns writer fallback for empty message', () => {
      const result = classifyIntent('', ALL_AGENTS)

      expect(result.agent).toBe('writer')
      expect(result.confidence).toBeLessThanOrEqual(0.4)
      expect(result.reasoning).toContain('No specific intent detected')
    })

    // ─── RBAC filtering ───────────────────────────────

    it('filters to only allowed agents — top match not available', () => {
      // Only allow writer and pricing, NOT compliance
      const result = classifyIntent('check compliance requirements', [
        'writer',
        'pricing',
      ])

      // Compliance would be top match but is not in allowedAgents
      // Should fall back to writer (the FALLBACK_AGENT) since it is allowed
      expect(result.agent).toBe('writer')
      expect(result.reasoning).toContain('not available')
    })

    it('uses first allowed agent when writer fallback is also unavailable', () => {
      // Only allow pricing — neither the top match (compliance) nor writer are allowed
      const result = classifyIntent('check compliance requirements', [
        'pricing',
      ])

      expect(result.agent).toBe('pricing')
    })

    it('returns first allowed agent for empty message when writer is not allowed', () => {
      const result = classifyIntent('', ['pricing', 'strategy'])

      // Writer is not in the allowed list, so should use first allowed
      expect(result.agent).toBe('pricing')
      expect(result.confidence).toBeLessThanOrEqual(0.4)
    })

    // ─── Confidence ───────────────────────────────────

    it('returns higher confidence for messages with multiple keyword hits', () => {
      const singleKeyword = classifyIntent('what is the price', ALL_AGENTS)
      const multipleKeywords = classifyIntent(
        'calculate the pricing for LCAT labor rates with wrap rate and overhead G&A fee',
        ALL_AGENTS
      )

      expect(multipleKeywords.confidence).toBeGreaterThan(
        singleKeyword.confidence
      )
    })

    // ─── ClassificationResult shape ───────────────────

    it('always returns { agent, confidence, reasoning }', () => {
      const result = classifyIntent('test message', ALL_AGENTS)

      expect(result).toHaveProperty('agent')
      expect(result).toHaveProperty('confidence')
      expect(result).toHaveProperty('reasoning')
      expect(typeof result.agent).toBe('string')
      expect(typeof result.confidence).toBe('number')
      expect(typeof result.reasoning).toBe('string')
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })
  })
})
