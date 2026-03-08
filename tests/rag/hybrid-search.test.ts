import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ──────────────────────────────────────────────────

const mockRpc = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    from: vi.fn(),
    rpc: mockRpc,
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
  })),
}))

vi.mock('@/lib/ai/pipeline', () => ({
  aiRequest: vi.fn().mockResolvedValue({
    content: JSON.stringify(Array.from({ length: 384 }, () => 0.1)),
  }),
}))

import { hybridSearch } from '@/lib/rag/hybrid-search'

// ─── Tests ──────────────────────────────────────────────────

describe('hybrid-search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('hybridSearch', () => {
    it('should return empty results when both searches return nothing', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null })

      const results = await hybridSearch('test query', 'comp-1')
      expect(results).toEqual([])
    })

    it('should combine vector and keyword results via RRF', async () => {
      // First call: match_documents (vector)
      // Second call: keyword_search_documents (keyword)
      mockRpc
        .mockResolvedValueOnce({
          data: [
            { id: 'doc-1', content: 'First doc', similarity: 0.9, metadata: {} },
            { id: 'doc-2', content: 'Second doc', similarity: 0.7, metadata: {} },
          ],
          error: null,
        })
        .mockResolvedValueOnce({
          data: [
            { id: 'doc-2', content: 'Second doc', similarity: 0.8, metadata: {} },
            { id: 'doc-3', content: 'Third doc', similarity: 0.6, metadata: {} },
          ],
          error: null,
        })

      const results = await hybridSearch('test query', 'comp-1', undefined, { minScore: 0.001 })
      expect(results.length).toBeGreaterThan(0)

      // doc-2 appears in both, so it should have 'both' source
      const doc2 = results.find((r) => r.id === 'doc-2')
      if (doc2) {
        expect(doc2.source).toBe('both')
        expect(doc2.vectorScore).toBe(0.7)
        expect(doc2.keywordScore).toBe(0.8)
      }

      // doc-1 is vector only
      const doc1 = results.find((r) => r.id === 'doc-1')
      if (doc1) {
        expect(doc1.source).toBe('vector')
      }

      // doc-3 is keyword only
      const doc3 = results.find((r) => r.id === 'doc-3')
      if (doc3) {
        expect(doc3.source).toBe('keyword')
      }
    })

    it('should respect finalTopN config', async () => {
      const vectorData = Array.from({ length: 15 }, (_, i) => ({
        id: `v-${i}`,
        content: `Vector doc ${i}`,
        similarity: 0.9 - i * 0.05,
        metadata: {},
      }))
      const keywordData = Array.from({ length: 15 }, (_, i) => ({
        id: `k-${i}`,
        content: `Keyword doc ${i}`,
        similarity: 0.8 - i * 0.04,
        metadata: {},
      }))

      mockRpc
        .mockResolvedValueOnce({ data: vectorData, error: null })
        .mockResolvedValueOnce({ data: keywordData, error: null })

      const results = await hybridSearch('test', 'comp-1', undefined, { finalTopN: 5 })
      expect(results.length).toBeLessThanOrEqual(5)
    })

    it('should pass documentType filter to searches', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null })

      await hybridSearch('test', 'comp-1', 'proposal')

      // Check that rpc was called with document type filter
      expect(mockRpc).toHaveBeenCalledWith('match_documents', expect.objectContaining({
        filter_document_type: 'proposal',
      }))
    })

    it('should handle rpc errors gracefully', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'rpc error' } })

      const results = await hybridSearch('test', 'comp-1')
      expect(results).toEqual([])
    })

    it('should filter results below minScore', async () => {
      mockRpc
        .mockResolvedValueOnce({
          data: [{ id: 'doc-1', content: 'Doc', similarity: 0.01, metadata: {} }],
          error: null,
        })
        .mockResolvedValueOnce({ data: [], error: null })

      // With a high minScore, the low-ranked result should be filtered out
      const results = await hybridSearch('test', 'comp-1', undefined, { minScore: 0.5 })
      expect(results.length).toBe(0)
    })

    it('should use fallback embedding when AI response is not valid JSON', async () => {
      const { aiRequest } = await import('@/lib/ai/pipeline')
      vi.mocked(aiRequest).mockResolvedValueOnce({ content: 'not json', provider: 'test' } as any)

      mockRpc.mockResolvedValue({ data: [], error: null })

      // Should not throw — falls back to createFallbackEmbedding
      const results = await hybridSearch('test', 'comp-1')
      expect(results).toEqual([])
    })
  })
})
