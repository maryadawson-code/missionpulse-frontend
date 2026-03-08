import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ──────────────────────────────────────────────────

const mockFrom = vi.fn()

function createChainMock(terminalValue: unknown = { data: null, error: null }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  const methods = ['select', 'eq', 'order', 'limit']
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  chain.single = vi.fn().mockResolvedValue(terminalValue)
  return chain
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    from: mockFrom,
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
  })),
}))

import {
  searchKnowledgeGraph,
  getEntitiesByType,
  findDocumentsWithEntity,
  getEntityCooccurrence,
  buildKnowledgeGraphContext,
} from '@/lib/rag/knowledge-graph'

// ─── Tests ──────────────────────────────────────────────────

describe('knowledge-graph', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('searchKnowledgeGraph', () => {
    it('should return empty results when no logs found', async () => {
      const chain = createChainMock()
      chain.limit = vi.fn().mockResolvedValue({ data: null, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await searchKnowledgeGraph('FHIR', 'comp-1')
      expect(result.nodes).toEqual([])
      expect(result.edges).toEqual([])
      expect(result.totalDocuments).toBe(0)
      expect(result.query).toBe('FHIR')
    })

    it('should return empty results for empty logs array', async () => {
      const chain = createChainMock()
      chain.limit = vi.fn().mockResolvedValue({ data: [], error: null })
      mockFrom.mockReturnValue(chain)

      const result = await searchKnowledgeGraph('FHIR', 'comp-1')
      expect(result.nodes).toEqual([])
    })

    it('should aggregate entities from logs', async () => {
      const logs = [
        {
          record_id: 'doc-1',
          new_values: {
            entities: [
              { name: 'FHIR', type: 'technology', confidence: 0.9 },
              { name: 'AWS', type: 'technology', confidence: 0.8 },
            ],
            relationships: [
              { source: 'FHIR', target: 'VA', type: 'related_to' },
            ],
          },
          created_at: '2025-01-01',
        },
        {
          record_id: 'doc-2',
          new_values: {
            entities: [
              { name: 'FHIR', type: 'technology', confidence: 0.95 },
            ],
            relationships: [],
          },
          created_at: '2025-01-02',
        },
      ]

      const chain = createChainMock()
      chain.limit = vi.fn().mockResolvedValue({ data: logs, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await searchKnowledgeGraph('FHIR', 'comp-1')
      expect(result.nodes.length).toBe(1)
      expect(result.nodes[0].name).toBe('FHIR')
      expect(result.nodes[0].occurrenceCount).toBe(2)
      expect(result.nodes[0].documentIds).toEqual(['doc-1', 'doc-2'])
      expect(result.nodes[0].confidence).toBe(0.95)
      expect(result.totalDocuments).toBe(2)
    })

    it('should filter by entity type when provided', async () => {
      const logs = [
        {
          record_id: 'doc-1',
          new_values: {
            entities: [
              { name: 'FHIR', type: 'technology', confidence: 0.9 },
              { name: 'FHIR Clinic', type: 'agency', confidence: 0.7 },
            ],
            relationships: [],
          },
          created_at: '2025-01-01',
        },
      ]

      const chain = createChainMock()
      chain.limit = vi.fn().mockResolvedValue({ data: logs, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await searchKnowledgeGraph('FHIR', 'comp-1', 'technology')
      expect(result.nodes.length).toBe(1)
      expect(result.nodes[0].type).toBe('technology')
    })

    it('should collect edges matching query', async () => {
      const logs = [
        {
          record_id: 'doc-1',
          new_values: {
            entities: [],
            relationships: [
              { source: 'FHIR', target: 'VA', type: 'related_to' },
              { source: 'AWS', target: 'Cloud', type: 'related_to' },
            ],
          },
          created_at: '2025-01-01',
        },
      ]

      const chain = createChainMock()
      chain.limit = vi.fn().mockResolvedValue({ data: logs, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await searchKnowledgeGraph('FHIR', 'comp-1')
      expect(result.edges.length).toBe(1)
      expect(result.edges[0].source).toBe('FHIR')
    })

    it('should handle logs with null new_values', async () => {
      const logs = [
        { record_id: 'doc-1', new_values: null, created_at: '2025-01-01' },
      ]

      const chain = createChainMock()
      chain.limit = vi.fn().mockResolvedValue({ data: logs, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await searchKnowledgeGraph('FHIR', 'comp-1')
      expect(result.nodes).toEqual([])
    })
  })

  describe('getEntitiesByType', () => {
    it('should return empty when no logs', async () => {
      const chain = createChainMock()
      chain.limit = vi.fn().mockResolvedValue({ data: null, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await getEntitiesByType('comp-1', 'technology')
      expect(result).toEqual([])
    })

    it('should filter and aggregate by type', async () => {
      const logs = [
        {
          record_id: 'doc-1',
          new_values: {
            entities: [
              { name: 'FHIR', type: 'technology', confidence: 0.9 },
              { name: 'VA', type: 'agency', confidence: 0.8 },
            ],
          },
        },
      ]

      const chain = createChainMock()
      chain.limit = vi.fn().mockResolvedValue({ data: logs, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await getEntitiesByType('comp-1', 'technology')
      expect(result.length).toBe(1)
      expect(result[0].name).toBe('FHIR')
    })

    it('should respect limit param', async () => {
      const entities = Array.from({ length: 10 }, (_, i) => ({
        name: `Tech${i}`,
        type: 'technology',
        confidence: 0.5,
      }))
      const logs = [{ record_id: 'doc-1', new_values: { entities } }]

      const chain = createChainMock()
      chain.limit = vi.fn().mockResolvedValue({ data: logs, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await getEntitiesByType('comp-1', 'technology', 3)
      expect(result.length).toBe(3)
    })
  })

  describe('findDocumentsWithEntity', () => {
    it('should return entity search results', async () => {
      const logs = [
        {
          record_id: 'doc-1',
          new_values: {
            entities: [{ name: 'FHIR', type: 'technology', confidence: 0.9 }],
            relationships: [],
          },
          created_at: '2025-01-01',
        },
      ]

      const chain = createChainMock()
      chain.limit = vi.fn().mockResolvedValue({ data: logs, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await findDocumentsWithEntity('comp-1', 'FHIR')
      expect(result.length).toBe(1)
      expect(result[0].entityName).toBe('FHIR')
      expect(result[0].documents[0].documentId).toBe('doc-1')
    })
  })

  describe('getEntityCooccurrence', () => {
    it('should return empty when no logs', async () => {
      const chain = createChainMock()
      chain.limit = vi.fn().mockResolvedValue({ data: null, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await getEntityCooccurrence('comp-1', 'technology', 'agency')
      expect(result).toEqual([])
    })

    it('should count co-occurrences between entity types', async () => {
      const logs = [
        {
          new_values: {
            entities: [
              { name: 'FHIR', type: 'technology' },
              { name: 'VA', type: 'agency' },
            ],
          },
        },
        {
          new_values: {
            entities: [
              { name: 'FHIR', type: 'technology' },
              { name: 'VA', type: 'agency' },
            ],
          },
        },
      ]

      const chain = createChainMock()
      chain.limit = vi.fn().mockResolvedValue({ data: logs, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await getEntityCooccurrence('comp-1', 'technology', 'agency')
      expect(result.length).toBe(1)
      expect(result[0].cooccurrenceCount).toBe(2)
    })
  })

  describe('buildKnowledgeGraphContext', () => {
    it('should return empty string when no nodes', async () => {
      const chain = createChainMock()
      chain.limit = vi.fn().mockResolvedValue({ data: [], error: null })
      mockFrom.mockReturnValue(chain)

      const result = await buildKnowledgeGraphContext('comp-1', 'FHIR')
      expect(result).toBe('')
    })

    it('should return formatted context string', async () => {
      const logs = [
        {
          record_id: 'doc-1',
          new_values: {
            entities: [{ name: 'FHIR', type: 'technology', confidence: 0.9 }],
            relationships: [],
          },
          created_at: '2025-01-01',
        },
      ]

      const chain = createChainMock()
      chain.limit = vi.fn().mockResolvedValue({ data: logs, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await buildKnowledgeGraphContext('comp-1', 'FHIR')
      expect(result).toContain('Knowledge Graph Context')
      expect(result).toContain('FHIR')
      expect(result).toContain('technology')
    })
  })
})
