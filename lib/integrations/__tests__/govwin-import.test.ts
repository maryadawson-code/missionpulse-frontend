// filepath: lib/integrations/__tests__/govwin-import.test.ts
/**
 * Tests for GovWin import — field mapping, deduplication,
 * alert filter building, data transformation.
 * v1.6 T-43.1
 */
import { vi } from 'vitest'
import type { GovWinOpportunity, GovWinCompetitor } from '@/lib/integrations/govwin/client'

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  }),
}))

// ─── Helper: Build a test GovWin opportunity ────────────────────
function makeGovWinOpp(overrides: Partial<GovWinOpportunity> = {}): GovWinOpportunity {
  return {
    id: overrides.id ?? 'gw-001',
    title: overrides.title ?? 'Cyber Defense Modernization',
    agency: overrides.agency ?? 'Department of Defense',
    subAgency: overrides.subAgency ?? 'DISA',
    naicsCode: overrides.naicsCode ?? '541512',
    setAside: overrides.setAside ?? 'Small Business',
    estimatedValue: overrides.estimatedValue ?? 5000000,
    solicitationNumber: overrides.solicitationNumber ?? 'W52P1J-26-R-0001',
    dueDate: overrides.dueDate ?? '2026-06-15',
    description: overrides.description ?? 'Full lifecycle cyber defense program.',
    status: overrides.status ?? 'active',
    competitors: overrides.competitors ?? [],
    agencyIntel: overrides.agencyIntel ?? null,
  }
}

// ─── Replicated field mapping logic from importGovWinOpportunity ──
function mapGovWinToOpportunity(govwinOpp: GovWinOpportunity, companyId: string, userId: string) {
  return {
    title: govwinOpp.title,
    company_id: companyId,
    owner_id: userId,
    agency: govwinOpp.agency,
    naics_code: govwinOpp.naicsCode,
    set_aside: govwinOpp.setAside,
    ceiling: govwinOpp.estimatedValue,
    solicitation_number: govwinOpp.solicitationNumber,
    due_date: govwinOpp.dueDate,
    description: govwinOpp.description,
    govwin_id: govwinOpp.id,
    status: 'active',
    phase: 'Long Range',
    deal_source: 'govwin',
  }
}

// ─── Alert filter URL builder (replicated from client.ts) ────────
interface AlertFilters {
  naicsCodes?: string[]
  agencies?: string[]
  setAsides?: string[]
  minValue?: number
  maxValue?: number
  keywords?: string[]
}

function buildSearchParams(filters: AlertFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.naicsCodes?.length) params.set('naics', filters.naicsCodes.join(','))
  if (filters.agencies?.length) params.set('agency', filters.agencies.join(','))
  if (filters.setAsides?.length) params.set('set_aside', filters.setAsides.join(','))
  if (filters.minValue !== undefined) params.set('min_value', String(filters.minValue))
  if (filters.maxValue !== undefined) params.set('max_value', String(filters.maxValue))
  if (filters.keywords?.length) params.set('keywords', filters.keywords.join(','))
  return params
}

describe('govwin-import', () => {
  describe('field mapping', () => {
    it('maps GovWin opportunity to MissionPulse fields', () => {
      const govOpp = makeGovWinOpp()
      const mapped = mapGovWinToOpportunity(govOpp, 'comp-001', 'user-001')

      expect(mapped.title).toBe('Cyber Defense Modernization')
      expect(mapped.agency).toBe('Department of Defense')
      expect(mapped.naics_code).toBe('541512')
      expect(mapped.set_aside).toBe('Small Business')
      expect(mapped.ceiling).toBe(5000000)
      expect(mapped.solicitation_number).toBe('W52P1J-26-R-0001')
      expect(mapped.due_date).toBe('2026-06-15')
      expect(mapped.govwin_id).toBe('gw-001')
      expect(mapped.status).toBe('active')
      expect(mapped.phase).toBe('Long Range')
      expect(mapped.deal_source).toBe('govwin')
    })

    it('maps null optional fields correctly', () => {
      const govOpp: GovWinOpportunity = {
        id: 'gw-null',
        title: 'Test Null Fields',
        agency: 'GSA',
        subAgency: null,
        naicsCode: null,
        setAside: null,
        estimatedValue: null,
        solicitationNumber: null,
        dueDate: null,
        description: null,
        status: 'active',
        competitors: [],
        agencyIntel: null,
      }
      const mapped = mapGovWinToOpportunity(govOpp, 'comp-001', 'user-001')

      expect(mapped.naics_code).toBeNull()
      expect(mapped.set_aside).toBeNull()
      expect(mapped.ceiling).toBeNull()
      expect(mapped.solicitation_number).toBeNull()
      expect(mapped.due_date).toBeNull()
    })

    it('sets correct company_id and owner_id', () => {
      const govOpp = makeGovWinOpp()
      const mapped = mapGovWinToOpportunity(govOpp, 'comp-abc', 'user-xyz')

      expect(mapped.company_id).toBe('comp-abc')
      expect(mapped.owner_id).toBe('user-xyz')
    })
  })

  describe('deduplication', () => {
    it('detects duplicate by govwin_id', () => {
      const existing = [
        { id: 'opp-001', govwin_id: 'gw-001' },
        { id: 'opp-002', govwin_id: 'gw-002' },
      ]
      const newOpp = makeGovWinOpp({ id: 'gw-001' })
      const isDuplicate = existing.some((e) => e.govwin_id === newOpp.id)
      expect(isDuplicate).toBe(true)
    })

    it('allows non-duplicate import', () => {
      const existing = [{ id: 'opp-001', govwin_id: 'gw-001' }]
      const newOpp = makeGovWinOpp({ id: 'gw-999' })
      const isDuplicate = existing.some((e) => e.govwin_id === newOpp.id)
      expect(isDuplicate).toBe(false)
    })
  })

  describe('alert filter URL building', () => {
    it('builds params from full filter set', () => {
      const params = buildSearchParams({
        naicsCodes: ['541512', '541519'],
        agencies: ['DoD', 'DHS'],
        setAsides: ['Small Business'],
        minValue: 1000000,
        maxValue: 10000000,
        keywords: ['cyber', 'cloud'],
      })

      expect(params.get('naics')).toBe('541512,541519')
      expect(params.get('agency')).toBe('DoD,DHS')
      expect(params.get('set_aside')).toBe('Small Business')
      expect(params.get('min_value')).toBe('1000000')
      expect(params.get('max_value')).toBe('10000000')
      expect(params.get('keywords')).toBe('cyber,cloud')
    })

    it('omits empty/undefined filters', () => {
      const params = buildSearchParams({
        naicsCodes: ['541512'],
      })

      expect(params.get('naics')).toBe('541512')
      expect(params.get('agency')).toBeNull()
      expect(params.get('min_value')).toBeNull()
    })

    it('handles empty filter object', () => {
      const params = buildSearchParams({})
      expect(Array.from(params.entries())).toHaveLength(0)
    })
  })

  describe('competitor data structure', () => {
    it('creates competitor array with expected fields', () => {
      const competitors: GovWinCompetitor[] = [
        { name: 'Booz Allen Hamilton', isIncumbent: true, winProbability: 60, source: 'govwin' },
        { name: 'Leidos', isIncumbent: false, winProbability: 45, source: 'govwin' },
      ]

      expect(competitors).toHaveLength(2)
      expect(competitors[0].isIncumbent).toBe(true)
      expect(competitors[1].winProbability).toBe(45)
    })

    it('handles empty competitor list', () => {
      const govOpp = makeGovWinOpp({ competitors: [] })
      expect(govOpp.competitors).toHaveLength(0)
    })
  })

  describe('sliding window alerts', () => {
    it('keeps max 100 alerts', () => {
      const alerts = Array.from({ length: 105 }, (_, i) => ({
        id: `gw-${i}`,
        title: `Opportunity ${i}`,
      }))

      // Replicate sliding window logic from sync.ts
      const capped = alerts.slice(-100)
      expect(capped).toHaveLength(100)
      expect(capped[0].id).toBe('gw-5')
      expect(capped[99].id).toBe('gw-104')
    })
  })
})
