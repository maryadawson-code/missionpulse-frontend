import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ──────────────────────────────────────────────────

vi.mock('@/lib/ai/pipeline', () => ({
  aiRequest: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
  })),
}))

import { extractEntities } from '@/lib/rag/entity-extractor'
import { aiRequest } from '@/lib/ai/pipeline'

// ─── Tests ──────────────────────────────────────────────────

describe('entity-extractor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('extractEntities', () => {
    it('should extract entities from AI response', async () => {
      vi.mocked(aiRequest).mockResolvedValue({
        content: JSON.stringify({
          entities: [
            { name: 'VA', type: 'agency', context: 'The VA program', confidence: 0.9, attributes: {} },
            { name: 'FHIR', type: 'technology', context: 'FHIR integration', confidence: 0.85, attributes: {} },
          ],
          relationships: [
            { source: 'VA', target: 'FHIR', type: 'related_to', strength: 0.7 },
          ],
        }),
        provider: 'test',
      } as any)

      const result = await extractEntities(
        'The VA program requires FHIR integration for EHR modernization.',
        'doc-1',
        'Test Doc',
        'comp-1'
      )

      expect(result.entities.length).toBe(2)
      expect(result.entities[0].name).toBe('VA')
      expect(result.entities[0].type).toBe('agency')
      expect(result.relationships.length).toBe(1)
      expect(result.documentId).toBe('doc-1')
      expect(result.processedChunks).toBeGreaterThanOrEqual(1)
    })

    it('should handle empty AI response', async () => {
      vi.mocked(aiRequest).mockResolvedValue({
        content: '',
        provider: 'test',
      } as any)

      const result = await extractEntities('Some text', 'doc-1', 'Test', 'comp-1')
      expect(result.entities).toEqual([])
      expect(result.relationships).toEqual([])
    })

    it('should handle invalid JSON in AI response', async () => {
      vi.mocked(aiRequest).mockResolvedValue({
        content: 'This is not JSON at all',
        provider: 'test',
      } as any)

      const result = await extractEntities('Some text', 'doc-1', 'Test', 'comp-1')
      expect(result.entities).toEqual([])
    })

    it('should deduplicate entities by name+type, keeping highest confidence', async () => {
      vi.mocked(aiRequest).mockResolvedValue({
        content: JSON.stringify({
          entities: [
            { name: 'VA', type: 'agency', context: 'First mention', confidence: 0.7, attributes: {} },
            { name: 'VA', type: 'agency', context: 'Second mention', confidence: 0.95, attributes: {} },
          ],
          relationships: [],
        }),
        provider: 'test',
      } as any)

      const result = await extractEntities('VA mentioned twice in short text', 'doc-1', 'Test', 'comp-1')
      expect(result.entities.length).toBe(1)
      expect(result.entities[0].confidence).toBe(0.95)
    })

    it('should filter out entities with invalid types', async () => {
      vi.mocked(aiRequest).mockResolvedValue({
        content: JSON.stringify({
          entities: [
            { name: 'VA', type: 'agency', confidence: 0.9, attributes: {} },
            { name: 'Something', type: 'invalid_type', confidence: 0.8, attributes: {} },
          ],
          relationships: [],
        }),
        provider: 'test',
      } as any)

      const result = await extractEntities('Text', 'doc-1', 'Test', 'comp-1')
      expect(result.entities.length).toBe(1)
      expect(result.entities[0].name).toBe('VA')
    })

    it('should filter out relationships with invalid types', async () => {
      vi.mocked(aiRequest).mockResolvedValue({
        content: JSON.stringify({
          entities: [],
          relationships: [
            { source: 'A', target: 'B', type: 'related_to', strength: 0.5 },
            { source: 'C', target: 'D', type: 'invalid_rel', strength: 0.5 },
          ],
        }),
        provider: 'test',
      } as any)

      const result = await extractEntities('Text', 'doc-1', 'Test', 'comp-1')
      expect(result.relationships.length).toBe(1)
    })

    it('should split long content into chunks', async () => {
      vi.mocked(aiRequest).mockResolvedValue({
        content: JSON.stringify({ entities: [], relationships: [] }),
        provider: 'test',
      } as any)

      // Create content larger than 4000 chars
      const longContent = 'A'.repeat(5000) + '\n\n' + 'B'.repeat(5000)
      const result = await extractEntities(longContent, 'doc-1', 'Test', 'comp-1')
      expect(result.processedChunks).toBeGreaterThan(1)
    })

    it('should clamp confidence values between 0 and 1', async () => {
      vi.mocked(aiRequest).mockResolvedValue({
        content: JSON.stringify({
          entities: [
            { name: 'VA', type: 'agency', confidence: 1.5, attributes: {} },
            { name: 'DoD', type: 'agency', confidence: -0.5, attributes: {} },
          ],
          relationships: [],
        }),
        provider: 'test',
      } as any)

      const result = await extractEntities('VA and DoD', 'doc-1', 'Test', 'comp-1')
      expect(result.entities[0].confidence).toBeLessThanOrEqual(1)
      expect(result.entities[1].confidence).toBeGreaterThanOrEqual(0)
    })

    it('should handle AI response with embedded JSON', async () => {
      vi.mocked(aiRequest).mockResolvedValue({
        content: 'Here are the results: {"entities": [{"name": "AWS", "type": "technology", "confidence": 0.8, "attributes": {}}], "relationships": []}',
        provider: 'test',
      } as any)

      const result = await extractEntities('AWS GovCloud', 'doc-1', 'Test', 'comp-1')
      expect(result.entities.length).toBe(1)
      expect(result.entities[0].name).toBe('AWS')
    })
  })
})
