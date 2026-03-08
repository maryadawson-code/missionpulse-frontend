import { describe, it, expect } from 'vitest'
import {
  createOpportunitySchema,
  updateOpportunitySchema,
  aiQuerySchema,
} from '@/lib/api/schemas'

describe('API Schemas', () => {
  describe('createOpportunitySchema', () => {
    it('validates a minimal opportunity', () => {
      const result = createOpportunitySchema.safeParse({ title: 'Test Opportunity' })
      expect(result.success).toBe(true)
    })

    it('rejects missing title', () => {
      const result = createOpportunitySchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('rejects empty title', () => {
      const result = createOpportunitySchema.safeParse({ title: '' })
      expect(result.success).toBe(false)
    })

    it('accepts full opportunity', () => {
      const result = createOpportunitySchema.safeParse({
        title: 'Test Opp',
        agency: 'DHA',
        ceiling: 5_000_000,
        pwin: 65,
        phase: 'capture',
        status: 'active',
        naics_code: '541512',
      })
      expect(result.success).toBe(true)
    })

    it('rejects negative ceiling', () => {
      const result = createOpportunitySchema.safeParse({
        title: 'Test',
        ceiling: -100,
      })
      expect(result.success).toBe(false)
    })

    it('rejects pwin > 100', () => {
      const result = createOpportunitySchema.safeParse({
        title: 'Test',
        pwin: 150,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('updateOpportunitySchema', () => {
    it('accepts partial update', () => {
      const result = updateOpportunitySchema.safeParse({ agency: 'VA' })
      expect(result.success).toBe(true)
    })

    it('accepts empty object (no required fields)', () => {
      const result = updateOpportunitySchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })

  describe('aiQuerySchema', () => {
    it('validates a minimal query', () => {
      const result = aiQuerySchema.safeParse({ query: 'What is this opportunity?' })
      expect(result.success).toBe(true)
    })

    it('rejects missing query', () => {
      const result = aiQuerySchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('rejects empty query', () => {
      const result = aiQuerySchema.safeParse({ query: '' })
      expect(result.success).toBe(false)
    })

    it('accepts query with optional fields', () => {
      const result = aiQuerySchema.safeParse({
        query: 'Analyze this',
        opportunityId: '550e8400-e29b-41d4-a716-446655440000',
        agent: 'capture',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid UUID for opportunityId', () => {
      const result = aiQuerySchema.safeParse({
        query: 'Test',
        opportunityId: 'not-a-uuid',
      })
      expect(result.success).toBe(false)
    })
  })
})
