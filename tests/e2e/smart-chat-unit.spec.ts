/**
 * Smart Chat UX — Intent Classifier + Suggested Prompts Unit Validation
 * Sprint S-UX-1: T-UX-1.1 / T-UX-1.2 / T-UX-1.3
 *
 * Tests the deterministic intent classifier and suggested prompts engine
 * without requiring a running server or auth session.
 */
import { test, expect } from '@playwright/test'
import { classifyIntent, AUTO_ROUTE_CONFIDENCE } from '../../lib/ai/intent-classifier'
import { getSuggestedPrompts } from '../../lib/ai/suggested-prompts'
import { AGENT_LABELS, AGENT_COLORS, INTENT_PATTERNS } from '../../lib/ai/intent-patterns'

// All 8 specialized agents
const ALL_AGENTS = ['capture', 'strategy', 'writer', 'compliance', 'pricing', 'blackhat', 'contracts', 'orals']

// ─── Intent Classifier ──────────────────────────────────────

test.describe('Intent Classifier', () => {
  test('routes "pWin" queries to Capture Agent', () => {
    const result = classifyIntent('What is our pWin for this opportunity?', ALL_AGENTS)
    expect(result.agent).toBe('capture')
    expect(result.confidence).toBeGreaterThanOrEqual(AUTO_ROUTE_CONFIDENCE)
  })

  test('routes "draft section" queries to Writer Agent', () => {
    const result = classifyIntent('Draft the technical approach section for volume 1', ALL_AGENTS)
    expect(result.agent).toBe('writer')
    expect(result.confidence).toBeGreaterThanOrEqual(AUTO_ROUTE_CONFIDENCE)
  })

  test('routes "compliance matrix" queries to Compliance Agent', () => {
    const result = classifyIntent('Review the compliance matrix and check all SHALL requirements', ALL_AGENTS)
    expect(result.agent).toBe('compliance')
    expect(result.confidence).toBeGreaterThanOrEqual(AUTO_ROUTE_CONFIDENCE)
  })

  test('routes "BOE" queries to Pricing Agent', () => {
    const result = classifyIntent('Generate a basis of estimate for the labor categories', ALL_AGENTS)
    expect(result.agent).toBe('pricing')
    expect(result.confidence).toBeGreaterThanOrEqual(AUTO_ROUTE_CONFIDENCE)
  })

  test('routes "win theme" queries to Strategy Agent', () => {
    const result = classifyIntent('Develop win themes and discriminators for this bid', ALL_AGENTS)
    expect(result.agent).toBe('strategy')
    expect(result.confidence).toBeGreaterThanOrEqual(AUTO_ROUTE_CONFIDENCE)
  })

  test('routes "competitor analysis" queries to Black Hat Agent', () => {
    const result = classifyIntent('Analyze the incumbent competitor and identify weaknesses', ALL_AGENTS)
    expect(result.agent).toBe('blackhat')
    expect(result.confidence).toBeGreaterThanOrEqual(AUTO_ROUTE_CONFIDENCE)
  })

  test('routes "FAR clause" queries to Contracts Agent', () => {
    const result = classifyIntent('Review the FAR 52.232 clause and contract terms', ALL_AGENTS)
    expect(result.agent).toBe('contracts')
    expect(result.confidence).toBeGreaterThanOrEqual(AUTO_ROUTE_CONFIDENCE)
  })

  test('routes "oral presentation" queries to Orals Coach', () => {
    const result = classifyIntent('Prepare for the oral presentation and generate evaluator Q&A', ALL_AGENTS)
    expect(result.agent).toBe('orals')
    expect(result.confidence).toBeGreaterThanOrEqual(AUTO_ROUTE_CONFIDENCE)
  })

  test('ambiguous input returns low confidence (< 0.6)', () => {
    const result = classifyIntent('hello, how are you today?', ALL_AGENTS)
    expect(result.confidence).toBeLessThan(AUTO_ROUTE_CONFIDENCE)
  })

  test('ambiguous input falls back to writer', () => {
    const result = classifyIntent('Can you help me with something?', ALL_AGENTS)
    expect(result.agent).toBe('writer')
  })

  test('role-blocked agent falls back with explanation', () => {
    // Only writer allowed — pricing query should still route to writer
    const result = classifyIntent('Generate a basis of estimate', ['writer'])
    expect(result.agent).toBe('writer')
    expect(result.reasoning).toContain('not available for your role')
  })

  test('filters to allowed agents only', () => {
    // Only compliance and contracts allowed
    const allowed = ['compliance', 'contracts']
    const result = classifyIntent('Draft the executive summary section', allowed)
    // Writer is not in allowed, so should NOT return writer
    expect(allowed).toContain(result.agent)
  })

  test('returns reasoning string for all classifications', () => {
    const result = classifyIntent('Score the pWin', ALL_AGENTS)
    expect(result.reasoning).toBeTruthy()
    expect(typeof result.reasoning).toBe('string')
    expect(result.reasoning.length).toBeGreaterThan(0)
  })

  test('confidence is between 0 and 1', () => {
    const inputs = [
      'What is our pWin?',
      'Draft the section',
      'Hello world',
      'FAR clause analysis for the IDIQ task order contract',
    ]
    for (const input of inputs) {
      const result = classifyIntent(input, ALL_AGENTS)
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    }
  })

  test('empty allowed agents returns general fallback', () => {
    const result = classifyIntent('What is our pWin?', [])
    expect(result.agent).toBe('general')
    expect(result.confidence).toBeLessThan(AUTO_ROUTE_CONFIDENCE)
  })
})

// ─── Suggested Prompts ──────────────────────────────────────

test.describe('Suggested Prompts', () => {
  test('returns max 4 prompts', () => {
    const prompts = getSuggestedPrompts('executive', 'Gate 1', ALL_AGENTS)
    expect(prompts.length).toBeLessThanOrEqual(4)
    expect(prompts.length).toBeGreaterThan(0)
  })

  test('filters prompts by allowed agents', () => {
    const prompts = getSuggestedPrompts('proposal_manager', 'Gate 4', ['writer', 'compliance'])
    for (const p of prompts) {
      expect(['writer', 'compliance']).toContain(p.agent)
    }
  })

  test('returns general prompts when no phase', () => {
    const prompts = getSuggestedPrompts('executive', null, ALL_AGENTS)
    expect(prompts.length).toBeGreaterThan(0)
    expect(prompts.length).toBeLessThanOrEqual(4)
  })

  test('returns prompts for all 6 gates', () => {
    for (let gate = 1; gate <= 6; gate++) {
      const prompts = getSuggestedPrompts('executive', `Gate ${gate}`, ALL_AGENTS)
      expect(prompts.length).toBeGreaterThan(0)
    }
  })

  test('each prompt has label, prompt text, and agent', () => {
    const prompts = getSuggestedPrompts('executive', 'Gate 3', ALL_AGENTS)
    for (const p of prompts) {
      expect(p.label).toBeTruthy()
      expect(p.prompt).toBeTruthy()
      expect(p.agent).toBeTruthy()
      expect(ALL_AGENTS).toContain(p.agent)
    }
  })

  test('contextualizes prompts with opportunity title', () => {
    const prompts = getSuggestedPrompts('executive', 'Gate 1', ALL_AGENTS, 'DHA Cyber Contract')
    const hasContextualized = prompts.some((p) => p.prompt.includes('DHA Cyber Contract'))
    expect(hasContextualized).toBe(true)
  })

  test('returns empty array when no agents allowed', () => {
    const prompts = getSuggestedPrompts('partner', 'Gate 1', [])
    expect(prompts).toEqual([])
  })
})

// ─── Intent Patterns Config ─────────────────────────────────

test.describe('Intent Patterns Config', () => {
  test('all 8 agents have labels', () => {
    for (const agent of ALL_AGENTS) {
      expect(AGENT_LABELS[agent]).toBeTruthy()
    }
  })

  test('all 8 agents have colors', () => {
    for (const agent of ALL_AGENTS) {
      expect(AGENT_COLORS[agent]).toBeTruthy()
      expect(AGENT_COLORS[agent]).toMatch(/^bg-/)
    }
  })

  test('all 8 agents have intent patterns', () => {
    for (const agent of ALL_AGENTS) {
      const pattern = INTENT_PATTERNS[agent]
      expect(pattern).toBeTruthy()
      expect(pattern.keywords.length).toBeGreaterThan(0)
      expect(pattern.patterns.length).toBeGreaterThan(0)
      expect(pattern.weight).toBeGreaterThan(0)
    }
  })

  test('AUTO_ROUTE_CONFIDENCE threshold is 0.6', () => {
    expect(AUTO_ROUTE_CONFIDENCE).toBe(0.6)
  })
})
