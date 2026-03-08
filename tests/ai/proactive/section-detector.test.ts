/**
 * Tests for lib/ai/proactive/section-detector.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock Supabase ──────────────────────────────────────────

const mockSingle = vi.fn()
const mockInsert = vi.fn().mockResolvedValue({ error: null })

const mockChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  single: mockSingle,
  insert: mockInsert,
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn(() => ({ ...mockChain })),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
  }),
}))

import {
  detectMissingSections,
  createGapAlerts,
  batchDetectGaps,
  type GapReport,
} from '@/lib/ai/proactive/section-detector'

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── detectMissingSections ───────────────────────────────────

describe('detectMissingSections', () => {
  it('returns empty report when opportunity not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: null })
    const result = await detectMissingSections('opp-1', 'comp-1')
    expect(result.totalRequirements).toBe(0)
    expect(result.totalSections).toBe(0)
    expect(result.gaps).toEqual([])
    expect(result.summary.overallComplianceScore).toBe(100)
  })

  it('returns empty report when no requirements or sections in metadata', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: 'opp-1', title: 'Test Opp', metadata: {} },
      error: null,
    })
    const result = await detectMissingSections('opp-1', 'comp-1')
    expect(result.gaps).toEqual([])
  })

  it('detects unassigned requirements', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'opp-1',
        title: 'Test Opp',
        metadata: {
          compliance_matrix: [
            { id: 'req-1', requirement_text: 'Must provide FHIR R4 integration.', section_id: null, status: null },
            { id: 'req-2', requirement_text: 'Must comply with CMMC Level 2.', section_id: 'sec-1', status: null },
          ],
          sections: [
            { id: 'sec-1', title: 'Security', content: 'We comply with CMMC Level 2 and all requirements.', requirement_ids: ['req-2'] },
          ],
        },
      },
      error: null,
    })

    const result = await detectMissingSections('opp-1', 'comp-1')
    const unassigned = result.gaps.filter(g => g.type === 'unassigned_requirement')
    expect(unassigned.length).toBe(1)
    expect(unassigned[0].severity).toBe('high')
    expect(unassigned[0].description).toContain('FHIR R4')
  })

  it('detects empty sections', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'opp-1',
        title: 'Test Opp',
        metadata: {
          compliance_matrix: [],
          sections: [
            { id: 'sec-1', title: 'Technical Approach', content: null, requirement_ids: [] },
            { id: 'sec-2', title: 'Past Performance', content: 'Short', requirement_ids: [] },
          ],
        },
      },
      error: null,
    })

    const result = await detectMissingSections('opp-1', 'comp-1')
    const empty = result.gaps.filter(g => g.type === 'empty_section')
    expect(empty.length).toBe(2) // both null and short content
  })

  it('detects orphan sections not tied to requirements', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'opp-1',
        title: 'Test Opp',
        metadata: {
          compliance_matrix: [
            { id: 'req-1', requirement_text: 'Must provide FHIR R4 integration with a minimum of 12 interfaces.', section_id: 'sec-1', status: null },
          ],
          sections: [
            { id: 'sec-1', title: 'Technical', content: 'We integrate FHIR R4 with 12 interfaces across all MTFs in the DHA network.', requirement_ids: ['req-1'] },
            { id: 'sec-2', title: 'Appendix', content: 'Supporting documentation for the technical approach and compliance matrix.', requirement_ids: [] },
          ],
        },
      },
      error: null,
    })

    const result = await detectMissingSections('opp-1', 'comp-1')
    const orphan = result.gaps.filter(g => g.type === 'orphan_section')
    expect(orphan.length).toBe(1)
    expect(orphan[0].severity).toBe('low')
    expect(orphan[0].title).toContain('Appendix')
  })

  it('sorts gaps by severity (high first)', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'opp-1',
        title: 'Test Opp',
        metadata: {
          compliance_matrix: [
            { id: 'req-1', requirement_text: 'Unassigned requirement about FHIR R4 integration capabilities.', section_id: null, status: null },
          ],
          sections: [
            { id: 'sec-1', title: 'Empty Section', content: null, requirement_ids: [] },
          ],
        },
      },
      error: null,
    })

    const result = await detectMissingSections('opp-1', 'comp-1')
    expect(result.gaps.length).toBeGreaterThan(1)
    expect(result.gaps[0].severity).toBe('high') // unassigned = high
  })

  it('calculates compliance score correctly', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'opp-1',
        title: 'Test Opp',
        metadata: {
          compliance_matrix: [
            { id: 'req-1', requirement_text: 'Requirement one is assigned to a section for compliance.', section_id: 'sec-1', status: null },
            { id: 'req-2', requirement_text: 'Requirement two is not assigned to any section at all.', section_id: null, status: null },
          ],
          sections: [
            { id: 'sec-1', title: 'Section 1', content: 'Detailed content about requirement one compliance approach.', requirement_ids: ['req-1'] },
          ],
        },
      },
      error: null,
    })

    const result = await detectMissingSections('opp-1', 'comp-1')
    expect(result.summary.overallComplianceScore).toBe(50) // 1 of 2 assigned
  })
})

// ─── createGapAlerts ─────────────────────────────────────────

describe('createGapAlerts', () => {
  it('creates alerts for all gaps', async () => {
    const report: GapReport = {
      opportunityId: 'opp-1',
      opportunityTitle: 'Test',
      assessedAt: new Date().toISOString(),
      totalRequirements: 2,
      totalSections: 1,
      gaps: [
        {
          id: 'gap-1', type: 'unassigned_requirement', severity: 'high',
          title: 'Unassigned', description: 'Test gap description.',
          suggestedFix: 'Fix it', opportunityId: 'opp-1', detectedAt: new Date().toISOString(),
        },
      ],
      summary: { unassignedRequirements: 1, emptySections: 0, orphanSections: 0, overallComplianceScore: 50 },
    }

    const result = await createGapAlerts(report, 'comp-1')
    expect(result.alertsCreated).toBe(1)
    expect(mockInsert).toHaveBeenCalledTimes(1)
  })

  it('returns 0 when no gaps', async () => {
    const report: GapReport = {
      opportunityId: 'opp-1', opportunityTitle: 'Test',
      assessedAt: new Date().toISOString(), totalRequirements: 0, totalSections: 0,
      gaps: [],
      summary: { unassignedRequirements: 0, emptySections: 0, orphanSections: 0, overallComplianceScore: 100 },
    }
    const result = await createGapAlerts(report, 'comp-1')
    expect(result.alertsCreated).toBe(0)
  })
})

// ─── batchDetectGaps ─────────────────────────────────────────

describe('batchDetectGaps', () => {
  it('returns empty when no opportunities found', async () => {
    mockChain.in.mockResolvedValueOnce({ data: null, error: null })
    const result = await batchDetectGaps('comp-1')
    expect(result.reports).toEqual([])
    expect(result.totalGaps).toBe(0)
  })
})
