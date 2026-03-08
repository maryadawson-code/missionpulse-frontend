import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ──────────────────────────────────────────────────

const mockFrom = vi.fn()

function createChainMock(terminalValue: unknown = { data: null, error: null }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  const methods = ['select', 'eq', 'order', 'limit', 'contains']
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

vi.mock('@/lib/docgen/docx-engine', () => ({
  generateTechVolume: vi.fn().mockResolvedValue(Buffer.from('tech-volume')),
}))

vi.mock('@/lib/docgen/xlsx-engine', () => ({
  generateComplianceMatrix: vi.fn().mockResolvedValue(Buffer.from('compliance')),
  generateCostModel: vi.fn().mockResolvedValue(Buffer.from('cost-model')),
}))

vi.mock('@/lib/docgen/pptx-engine', () => ({
  generateGateDecisionDeck: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
}))

vi.mock('@/lib/docgen/binder-toc', () => ({
  generateBinderTOC: vi.fn().mockResolvedValue(Buffer.from('toc')),
}))

vi.mock('@/lib/docgen/templates/tech-volume', () => ({
  buildTechVolumeData: vi.fn().mockReturnValue({
    opportunityTitle: 'Test',
    solicitationNumber: 'SOL-1',
    sections: [],
  }),
}))

vi.mock('@/lib/docgen/templates/compliance-matrix', () => ({
  buildComplianceRows: vi.fn().mockReturnValue([]),
}))

vi.mock('@/lib/docgen/templates/cost-model', () => ({
  buildCostModelCLINs: vi.fn().mockReturnValue([]),
}))

vi.mock('@/lib/docgen/templates/gate-decision', () => ({
  buildGateDecisionData: vi.fn().mockReturnValue({
    opportunityTitle: 'Test',
    agency: 'DoD',
    gateName: 'Gate 1',
    gateNumber: 1,
    recommendation: 'go',
    pwin: 60,
    metrics: [],
    risks: [],
    nextSteps: [],
  }),
}))

vi.mock('archiver', () => {
  return {
    default: vi.fn().mockImplementation(() => {
      const events: Record<string, Function> = {}
      return {
        on: vi.fn().mockImplementation((event: string, cb: Function) => {
          events[event] = cb
          return this
        }),
        append: vi.fn(),
        finalize: vi.fn().mockImplementation(() => {
          // Simulate data + end events
          if (events.data) events.data(Buffer.from('zip-chunk'))
          if (events.end) events.end()
        }),
      }
    }),
  }
})

import { assembleBinder } from '@/lib/docgen/binder'

// ─── Tests ──────────────────────────────────────────────────

describe('binder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('assembleBinder', () => {
    it('should throw if opportunity not found', async () => {
      const oppChain = createChainMock({ data: null, error: null })
      mockFrom.mockReturnValue(oppChain)

      await expect(assembleBinder('opp-not-found')).rejects.toThrow('not found')
    })

    it('should assemble binder with all documents', async () => {
      const oppData = {
        id: 'opp-1',
        title: 'Test Opportunity',
        agency: 'DoD',
        ceiling: 5000000,
        pwin: 65,
        phase: 'Proposal Development',
        company_id: 'comp-1',
        status: 'active',
        solicitation_number: 'SOL-001',
      }

      const oppChain = createChainMock({ data: oppData, error: null })

      // For Promise.all fetches: sections and compliance_requirements
      const sectionsChain = createChainMock()
      sectionsChain.order = vi.fn().mockResolvedValue({
        data: [
          { id: 's1', section_title: 'Introduction', content: 'Intro text', section_number: 1, status: 'complete' },
        ],
        error: null,
      })

      const complianceChain = createChainMock()
      // compliance uses eq then resolves (no order)
      // We need to handle the different from() calls
      let callCount = 0
      mockFrom.mockImplementation((table: string) => {
        callCount++
        if (table === 'opportunities') return oppChain
        if (table === 'proposal_sections') return sectionsChain
        if (table === 'compliance_requirements') {
          const c = createChainMock()
          c.eq = vi.fn().mockResolvedValue({
            data: [
              { id: 'c1', reference: 'L.1', requirement: 'Must comply', section: 'Technical', priority: 'high', status: 'Addressed' },
            ],
            error: null,
          })
          return c
        }
        if (table === 'document_sync_state') {
          const c = createChainMock()
          c.eq = vi.fn().mockResolvedValue({ data: null, error: null })
          return c
        }
        return createChainMock()
      })

      const result = await assembleBinder('opp-1')
      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(result.filename).toContain('Test_Opportunity')
      expect(result.filename).toContain('.zip')
      expect(result.fileCount).toBe(5) // tech, compliance, cost, gate, toc
    })

    it('should handle pullFromCloud option', async () => {
      const oppData = {
        id: 'opp-1',
        title: 'Cloud Test',
        agency: 'VA',
        ceiling: 1000000,
        pwin: 50,
        phase: 'Capture Planning',
        company_id: 'comp-1',
        status: 'active',
        solicitation_number: 'SOL-002',
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'opportunities') {
          return createChainMock({ data: oppData, error: null })
        }
        if (table === 'document_sync_state') {
          const c = createChainMock()
          c.eq = vi.fn().mockResolvedValue({ data: [], error: null })
          return c
        }
        if (table === 'proposal_sections') {
          const c = createChainMock()
          c.order = vi.fn().mockResolvedValue({ data: [], error: null })
          return c
        }
        if (table === 'compliance_requirements') {
          const c = createChainMock()
          c.eq = vi.fn().mockResolvedValue({ data: [], error: null })
          return c
        }
        return createChainMock()
      })

      const result = await assembleBinder('opp-1', { pullFromCloud: true })
      expect(result.buffer).toBeInstanceOf(Buffer)
    })
  })
})
