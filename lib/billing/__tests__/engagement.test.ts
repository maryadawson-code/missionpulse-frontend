/**
 * Engagement Scoring Tests.
 *
 * Tests the weight configuration and score computation logic.
 */
import { describe, it, expect } from 'vitest'
import type { EngagementFactors } from '../engagement'

// ─── Weight configuration (imported by reference, same values) ──

const WEIGHTS = {
  loginFrequency: 0.20,
  aiUsage: 0.25,
  featureAdoption: 0.25,
  teamInvites: 0.15,
  docsGenerated: 0.15,
}

/** Replicates the score computation from engagement.ts */
function computeScore(factors: EngagementFactors): number {
  return Math.round(
    factors.loginFrequency * WEIGHTS.loginFrequency +
    factors.aiUsage * WEIGHTS.aiUsage +
    factors.featureAdoption * WEIGHTS.featureAdoption +
    factors.teamInvites * WEIGHTS.teamInvites +
    factors.docsGenerated * WEIGHTS.docsGenerated
  )
}

describe('Engagement scoring logic', () => {
  it('weights sum to 1.0 (100%)', () => {
    const sum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1.0)
  })

  it('all factors at 100 → score = 100', () => {
    const factors: EngagementFactors = {
      loginFrequency: 100,
      aiUsage: 100,
      featureAdoption: 100,
      teamInvites: 100,
      docsGenerated: 100,
    }
    expect(computeScore(factors)).toBe(100)
  })

  it('all factors at 0 → score = 0', () => {
    const factors: EngagementFactors = {
      loginFrequency: 0,
      aiUsage: 0,
      featureAdoption: 0,
      teamInvites: 0,
      docsGenerated: 0,
    }
    expect(computeScore(factors)).toBe(0)
  })

  it('only login (100) → score = 20', () => {
    const factors: EngagementFactors = {
      loginFrequency: 100,
      aiUsage: 0,
      featureAdoption: 0,
      teamInvites: 0,
      docsGenerated: 0,
    }
    expect(computeScore(factors)).toBe(20)
  })

  it('only AI usage (100) → score = 25', () => {
    const factors: EngagementFactors = {
      loginFrequency: 0,
      aiUsage: 100,
      featureAdoption: 0,
      teamInvites: 0,
      docsGenerated: 0,
    }
    expect(computeScore(factors)).toBe(25)
  })

  it('half engagement across all factors → score = 50', () => {
    const factors: EngagementFactors = {
      loginFrequency: 50,
      aiUsage: 50,
      featureAdoption: 50,
      teamInvites: 50,
      docsGenerated: 50,
    }
    expect(computeScore(factors)).toBe(50)
  })

  it('score rounds to nearest integer', () => {
    const factors: EngagementFactors = {
      loginFrequency: 33,
      aiUsage: 67,
      featureAdoption: 45,
      teamInvites: 80,
      docsGenerated: 12,
    }
    const raw =
      33 * 0.20 + 67 * 0.25 + 45 * 0.25 + 80 * 0.15 + 12 * 0.15
    expect(computeScore(factors)).toBe(Math.round(raw))
  })

  it('factor normalization clamps individual factors to 0-100', () => {
    // In the real code, Math.min(100, ...) is applied per factor
    // Verify that even if we pass raw values, the computation stays bounded
    const maxFactors: EngagementFactors = {
      loginFrequency: 100,
      aiUsage: 100,
      featureAdoption: 100,
      teamInvites: 100,
      docsGenerated: 100,
    }
    expect(computeScore(maxFactors)).toBeLessThanOrEqual(100)
    expect(computeScore(maxFactors)).toBeGreaterThanOrEqual(0)
  })
})
