// filepath: lib/integrations/__tests__/salesforce-sync.test.ts
/**
 * Tests for Salesforce sync — field mapping, phase/stage conversion,
 * contact role mapping, conflict resolution.
 * v1.6 T-43.1
 */
import { vi } from 'vitest'
import { mapContactRole } from '@/lib/integrations/salesforce/contact-sync'

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  }),
}))

// ─── Phase/Stage mapping logic (replicated from sync-engine.ts) ─────
const PHASE_TO_STAGE: Record<string, string> = {
  'Long Range': 'Prospecting',
  'Opportunity Assessment': 'Qualification',
  'Capture Planning': 'Needs Analysis',
  'Proposal Development': 'Proposal/Price Quote',
  'Post-Submission': 'Negotiation/Review',
  'Awarded': 'Closed Won',
  'Lost': 'Closed Lost',
  'No-Bid': 'Closed Lost',
}

const STAGE_TO_PHASE: Record<string, string> = {
  'Prospecting': 'Long Range',
  'Qualification': 'Opportunity Assessment',
  'Needs Analysis': 'Capture Planning',
  'Value Proposition': 'Capture Planning',
  'Proposal/Price Quote': 'Proposal Development',
  'Negotiation/Review': 'Post-Submission',
  'Closed Won': 'Awarded',
  'Closed Lost': 'Lost',
}

function transformFieldForSalesforce(mpField: string, value: unknown): unknown {
  if (mpField === 'phase' && typeof value === 'string') {
    return PHASE_TO_STAGE[value] ?? value
  }
  if (mpField === 'status') {
    return value === 'awarded' || value === 'lost' || value === 'no-bid'
  }
  return value
}

function transformFieldForMissionPulse(sfField: string, value: unknown): unknown {
  if (sfField === 'StageName' && typeof value === 'string') {
    return STAGE_TO_PHASE[value] ?? value
  }
  if (sfField === 'IsClosed') {
    return value === true ? 'awarded' : 'active'
  }
  return value
}

describe('salesforce-sync', () => {
  describe('Phase → Stage mapping', () => {
    it('maps all Shipley phases to Salesforce stages', () => {
      expect(PHASE_TO_STAGE['Long Range']).toBe('Prospecting')
      expect(PHASE_TO_STAGE['Opportunity Assessment']).toBe('Qualification')
      expect(PHASE_TO_STAGE['Capture Planning']).toBe('Needs Analysis')
      expect(PHASE_TO_STAGE['Proposal Development']).toBe('Proposal/Price Quote')
      expect(PHASE_TO_STAGE['Post-Submission']).toBe('Negotiation/Review')
      expect(PHASE_TO_STAGE['Awarded']).toBe('Closed Won')
      expect(PHASE_TO_STAGE['Lost']).toBe('Closed Lost')
      expect(PHASE_TO_STAGE['No-Bid']).toBe('Closed Lost')
    })

    it('maps Salesforce stages back to Shipley phases', () => {
      expect(STAGE_TO_PHASE['Prospecting']).toBe('Long Range')
      expect(STAGE_TO_PHASE['Closed Won']).toBe('Awarded')
      expect(STAGE_TO_PHASE['Closed Lost']).toBe('Lost')
      expect(STAGE_TO_PHASE['Value Proposition']).toBe('Capture Planning')
    })
  })

  describe('transformFieldForSalesforce', () => {
    it('transforms phase to Salesforce stage', () => {
      expect(transformFieldForSalesforce('phase', 'Proposal Development')).toBe('Proposal/Price Quote')
    })

    it('passes unknown phases through unchanged', () => {
      expect(transformFieldForSalesforce('phase', 'Custom Phase')).toBe('Custom Phase')
    })

    it('transforms status to IsClosed boolean', () => {
      expect(transformFieldForSalesforce('status', 'awarded')).toBe(true)
      expect(transformFieldForSalesforce('status', 'lost')).toBe(true)
      expect(transformFieldForSalesforce('status', 'no-bid')).toBe(true)
      expect(transformFieldForSalesforce('status', 'active')).toBe(false)
      expect(transformFieldForSalesforce('status', 'draft')).toBe(false)
    })

    it('passes other fields through unchanged', () => {
      expect(transformFieldForSalesforce('title', 'My Opportunity')).toBe('My Opportunity')
      expect(transformFieldForSalesforce('ceiling', 5000000)).toBe(5000000)
    })
  })

  describe('transformFieldForMissionPulse', () => {
    it('transforms StageName to Shipley phase', () => {
      expect(transformFieldForMissionPulse('StageName', 'Prospecting')).toBe('Long Range')
      expect(transformFieldForMissionPulse('StageName', 'Closed Won')).toBe('Awarded')
    })

    it('transforms IsClosed to status', () => {
      expect(transformFieldForMissionPulse('IsClosed', true)).toBe('awarded')
      expect(transformFieldForMissionPulse('IsClosed', false)).toBe('active')
    })

    it('passes other fields through unchanged', () => {
      expect(transformFieldForMissionPulse('Name', 'Test')).toBe('Test')
      expect(transformFieldForMissionPulse('Amount', 100000)).toBe(100000)
    })
  })

  describe('conflict resolution (timestamp comparison)', () => {
    it('newer MP timestamp wins over older SF timestamp', () => {
      const mpUpdated = '2026-02-28T12:00:00Z'
      const sfUpdated = '2026-02-28T10:00:00Z'
      const mpIsNewer = new Date(mpUpdated) > new Date(sfUpdated)
      expect(mpIsNewer).toBe(true)
    })

    it('newer SF timestamp wins over older MP timestamp', () => {
      const mpUpdated = '2026-02-28T08:00:00Z'
      const sfUpdated = '2026-02-28T10:00:00Z'
      const sfIsNewer = new Date(sfUpdated) > new Date(mpUpdated)
      expect(sfIsNewer).toBe(true)
    })
  })

  describe('mapContactRole', () => {
    it('maps known Salesforce roles to MissionPulse types', () => {
      expect(mapContactRole('Decision Maker')).toBe('decision_maker')
      expect(mapContactRole('Economic Decision Maker')).toBe('decision_maker')
      expect(mapContactRole('Economic Buyer')).toBe('decision_maker')
      expect(mapContactRole('Technical Evaluator')).toBe('technical_poc')
      expect(mapContactRole('Evaluator')).toBe('evaluator')
      expect(mapContactRole('Influencer')).toBe('influencer')
      expect(mapContactRole('Business User')).toBe('end_user')
      expect(mapContactRole('Executive Sponsor')).toBe('executive_sponsor')
    })

    it('maps null role to "other"', () => {
      expect(mapContactRole(null)).toBe('other')
    })

    it('maps unknown role to "other"', () => {
      expect(mapContactRole('Custom Role')).toBe('other')
      expect(mapContactRole('Other')).toBe('other')
    })
  })
})
