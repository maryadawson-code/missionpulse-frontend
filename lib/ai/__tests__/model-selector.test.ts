/**
 * Unit tests for Model Selection Engine — selects optimal model per task + classification.
 * Tests selectModel() for task-to-model mapping, budget guard, and CUI constraints.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (hoisted by Vitest) ─────────────────────────────

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockResolvedValue({ data: [] }),
      }),
    }),
  }),
}))

// ─── Imports (after mocks) ──────────────────────────────────

import { selectModel } from '../model-selector'
import type { TaskType } from '../types'

// ─── Tests ──────────────────────────────────────────────────

describe('Model Selector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── Task-to-model mapping ──────────────────────────────

  describe('selectModel(taskType, classification)', () => {
    it('selects claude-sonnet as primary for chat task (general-purpose model)', async () => {
      const result = await selectModel('chat', 'UNCLASSIFIED')

      expect(result.primary.model).toBe('claude-sonnet-4-5')
      expect(result.primary.engine).toBe('asksage')
      expect(result.fallback).not.toBeNull()
      expect(result.fallback?.model).toBe('claude-haiku-4-5')
    })

    it('selects claude-opus as primary for strategy task (most capable model)', async () => {
      const result = await selectModel('strategy', 'UNCLASSIFIED')

      expect(result.primary.model).toBe('claude-opus-4')
      expect(result.fallback).not.toBeNull()
      expect(result.fallback?.model).toBe('claude-sonnet-4-5')
    })

    it('selects gpt-4o as primary for pricing task', async () => {
      const result = await selectModel('pricing', 'UNCLASSIFIED')

      expect(result.primary.model).toBe('gpt-4o')
      expect(result.fallback).not.toBeNull()
      expect(result.fallback?.model).toBe('claude-sonnet-4-5')
    })

    it('selects claude-opus as primary for writer task', async () => {
      const result = await selectModel('writer', 'UNCLASSIFIED')

      expect(result.primary.model).toBe('claude-opus-4')
    })

    it('selects claude-sonnet for compliance task', async () => {
      const result = await selectModel('compliance', 'UNCLASSIFIED')

      expect(result.primary.model).toBe('claude-sonnet-4-5')
    })

    it('falls back to chat mapping for unknown task type', async () => {
      // Cast an unknown task type to bypass TypeScript
      const result = await selectModel(
        'nonexistent_task' as TaskType,
        'UNCLASSIFIED'
      )

      // Should fall back to TASK_MODEL_MAP.chat defaults
      expect(result.primary.model).toBe('claude-sonnet-4-5')
      expect(result.fallback?.model).toBe('claude-haiku-4-5')
    })

    // ─── CUI constraints ─────────────────────────────────

    it('forces AskSage engine for CUI classification', async () => {
      const result = await selectModel('strategy', 'CUI')

      expect(result.primary.engine).toBe('asksage')
      expect(result.classification).toBe('CUI')
      if (result.fallback) {
        expect(result.fallback.engine).toBe('asksage')
      }
    })

    it('forces AskSage engine for CUI//SP-PROPIN classification', async () => {
      const result = await selectModel('pricing', 'CUI//SP-PROPIN')

      expect(result.primary.engine).toBe('asksage')
      expect(result.classification).toBe('CUI//SP-PROPIN')
    })

    it('forces AskSage engine for OPSEC classification', async () => {
      const result = await selectModel('capture', 'OPSEC')

      expect(result.primary.engine).toBe('asksage')
      expect(result.classification).toBe('OPSEC')
    })

    // ─── Response shape ───────────────────────────────────

    it('returns correct ModelSelection shape', async () => {
      const result = await selectModel('chat', 'UNCLASSIFIED')

      expect(result).toHaveProperty('primary')
      expect(result).toHaveProperty('fallback')
      expect(result).toHaveProperty('classification')
      expect(result).toHaveProperty('budgetRemaining')

      expect(result.primary).toHaveProperty('model')
      expect(result.primary).toHaveProperty('engine')
      expect(result.primary).toHaveProperty('maxTokens')
      expect(result.primary).toHaveProperty('temperature')
      expect(result.primary).toHaveProperty('estimatedCostPer1k')
      expect(typeof result.budgetRemaining).toBe('number')
    })

    it('summarize task uses the cheapest model (claude-haiku)', async () => {
      const result = await selectModel('summarize', 'UNCLASSIFIED')

      expect(result.primary.model).toBe('claude-haiku-4-5')
      // primary and fallback are the same key → fallback is null
      expect(result.fallback).toBeNull()
    })
  })
})
