/**
 * Tests for lib/ai/proactive/deadline-risk.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock Supabase ──────────────────────────────────────────

const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  not: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  insert: mockInsert,
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn(() => ({ ...mockChain })),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
  }),
}))

import {
  assessDeadlineRisks,
  createDeadlineAlerts,
  type DeadlineRiskReport,
} from '@/lib/ai/proactive/deadline-risk'

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── assessDeadlineRisks ─────────────────────────────────────

describe('assessDeadlineRisks', () => {
  it('returns empty report when no opportunities found', async () => {
    // Default mock returns null data
    const result = await assessDeadlineRisks('company-1')
    expect(result.totalSections).toBe(0)
    expect(result.sections).toEqual([])
    expect(result.onTrack).toBe(0)
    expect(result.atRisk).toBe(0)
    expect(result.critical).toBe(0)
    expect(result.assessedAt).toBeTruthy()
  })

  it('returns empty report when opportunities is empty array', async () => {
    mockChain.order.mockResolvedValueOnce({ data: [], error: null })
    const result = await assessDeadlineRisks('company-1')
    expect(result.totalSections).toBe(0)
  })

  it('assesses opportunity without sections metadata as one section', async () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)

    mockChain.order.mockResolvedValueOnce({
      data: [{
        id: 'opp-1',
        title: 'Test Opportunity',
        due_date: futureDate.toISOString(),
        phase: 'Capture Planning',
        metadata: null,
      }],
      error: null,
    })

    const result = await assessDeadlineRisks('company-1')
    expect(result.totalSections).toBe(1)
    expect(result.sections[0].sectionName).toBe('Test Opportunity')
    expect(result.sections[0].completionPct).toBe(35) // Capture Planning default
  })

  it('assesses sections from metadata', async () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 10)

    mockChain.order.mockResolvedValueOnce({
      data: [{
        id: 'opp-1',
        title: 'Test Opp',
        due_date: futureDate.toISOString(),
        phase: 'Proposal Development',
        metadata: {
          sections: [
            { id: 's1', name: 'Technical Approach', due_date: futureDate.toISOString(), completion_pct: 80, started_at: startDate.toISOString() },
            { id: 's2', name: 'Past Performance', completion_pct: 10, started_at: startDate.toISOString() },
          ],
        },
      }],
      error: null,
    })

    const result = await assessDeadlineRisks('company-1')
    expect(result.totalSections).toBe(2)
    expect(result.sections.some(s => s.sectionName === 'Technical Approach')).toBe(true)
    expect(result.sections.some(s => s.sectionName === 'Past Performance')).toBe(true)
  })

  it('sorts results by risk level then days remaining', async () => {
    const soon = new Date()
    soon.setDate(soon.getDate() + 5)
    const later = new Date()
    later.setDate(later.getDate() + 60)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    mockChain.order.mockResolvedValueOnce({
      data: [
        {
          id: 'opp-1', title: 'Opp 1', due_date: later.toISOString(),
          phase: 'Proposal Development',
          metadata: { sections: [{ id: 's1', name: 'Easy Section', completion_pct: 95, started_at: startDate.toISOString() }] },
        },
        {
          id: 'opp-2', title: 'Opp 2', due_date: soon.toISOString(),
          phase: 'Proposal Development',
          metadata: { sections: [{ id: 's2', name: 'Hard Section', completion_pct: 5, started_at: startDate.toISOString() }] },
        },
      ],
      error: null,
    })

    const result = await assessDeadlineRisks('company-1')
    // Critical/at-risk should come before on_track
    const levels = result.sections.map(s => s.riskLevel)
    const levelOrder = { critical: 0, at_risk: 1, on_track: 2 }
    for (let i = 1; i < levels.length; i++) {
      expect(levelOrder[levels[i]]).toBeGreaterThanOrEqual(levelOrder[levels[i - 1]])
    }
  })
})

// ─── createDeadlineAlerts ────────────────────────────────────

describe('createDeadlineAlerts', () => {
  it('creates alerts for at_risk and critical sections', async () => {
    const report: DeadlineRiskReport = {
      assessedAt: new Date().toISOString(),
      totalSections: 3,
      onTrack: 1,
      atRisk: 1,
      critical: 1,
      sections: [
        {
          sectionId: 's1', sectionName: 'Section A', opportunityId: 'opp-1',
          opportunityTitle: 'Opp 1', dueDate: '2026-04-01', completionPct: 10,
          projectedCompletionDate: '2026-05-01', daysRemaining: 5, daysBehind: 10,
          riskLevel: 'critical', riskScore: 90, velocity: 2,
          suggestedActions: ['Escalate'],
        },
        {
          sectionId: 's2', sectionName: 'Section B', opportunityId: 'opp-1',
          opportunityTitle: 'Opp 1', dueDate: '2026-04-01', completionPct: 70,
          projectedCompletionDate: '2026-03-30', daysRemaining: 10, daysBehind: 0,
          riskLevel: 'at_risk', riskScore: 50, velocity: 5,
          suggestedActions: ['Monitor daily'],
        },
        {
          sectionId: 's3', sectionName: 'Section C', opportunityId: 'opp-1',
          opportunityTitle: 'Opp 1', dueDate: '2026-04-01', completionPct: 90,
          projectedCompletionDate: '2026-03-20', daysRemaining: 20, daysBehind: 0,
          riskLevel: 'on_track', riskScore: 10, velocity: 8,
          suggestedActions: [],
        },
      ],
    }

    const result = await createDeadlineAlerts('company-1', report)
    expect(result.alertsCreated).toBe(2) // at_risk + critical only
    expect(mockInsert).toHaveBeenCalledTimes(2)
  })

  it('returns 0 alerts when all sections are on track', async () => {
    const report: DeadlineRiskReport = {
      assessedAt: new Date().toISOString(),
      totalSections: 1,
      onTrack: 1,
      atRisk: 0,
      critical: 0,
      sections: [{
        sectionId: 's1', sectionName: 'Good Section', opportunityId: 'opp-1',
        opportunityTitle: 'Opp', dueDate: '2026-05-01', completionPct: 95,
        projectedCompletionDate: '2026-03-15', daysRemaining: 50, daysBehind: 0,
        riskLevel: 'on_track', riskScore: 5, velocity: 10,
        suggestedActions: [],
      }],
    }

    const result = await createDeadlineAlerts('company-1', report)
    expect(result.alertsCreated).toBe(0)
  })
})
