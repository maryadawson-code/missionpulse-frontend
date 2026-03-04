// filepath: tests/collaboration/timeline-utils.test.ts
/**
 * Tests for lib/proposals/timeline-utils.ts — Proposal Timeline Utilities
 * v1.3 Sprint 31 → Migrated to Vitest (v1.6 T-42.1)
 */

import {
  daysBetween,
  sortMilestones,
  calculatePosition,
  getTimelineRange,
} from '@/lib/proposals/timeline-utils'
import type { ProposalMilestone } from '@/lib/types/sync'

function makeMilestone(overrides: Partial<ProposalMilestone> = {}): ProposalMilestone {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    opportunity_id: overrides.opportunity_id ?? 'opp-001',
    company_id: overrides.company_id ?? 'comp-001',
    milestone_type: overrides.milestone_type ?? 'custom',
    title: overrides.title ?? 'Test Milestone',
    scheduled_date: overrides.scheduled_date ?? '2026-03-15',
    actual_date: overrides.actual_date ?? null,
    status: overrides.status ?? 'upcoming',
    notes: overrides.notes ?? null,
    created_by: overrides.created_by ?? 'user-001',
    created_at: overrides.created_at ?? '2026-02-22T00:00:00Z',
    updated_at: overrides.updated_at ?? '2026-02-22T00:00:00Z',
  }
}

describe('timeline-utils', () => {
  it('daysBetween returns 30 for dates 30 days apart', () => {
    expect(daysBetween('2026-01-01', '2026-01-31')).toBe(30)
    // Order doesn't matter (absolute value)
    expect(daysBetween('2026-01-31', '2026-01-01')).toBe(30)
  })

  it('daysBetween returns 0 for the same day', () => {
    expect(daysBetween('2026-06-15', '2026-06-15')).toBe(0)
  })

  it('sortMilestones sorts ascending by scheduled_date without mutating input', () => {
    const milestones: ProposalMilestone[] = [
      makeMilestone({ title: 'Third', scheduled_date: '2026-06-01' }),
      makeMilestone({ title: 'First', scheduled_date: '2026-01-15' }),
      makeMilestone({ title: 'Second', scheduled_date: '2026-03-20' }),
    ]

    const sorted = sortMilestones(milestones)

    // Should not mutate the original
    expect(milestones[0].title).toBe('Third')

    expect(sorted).toHaveLength(3)
    expect(sorted[0].title).toBe('First')
    expect(sorted[1].title).toBe('Second')
    expect(sorted[2].title).toBe('Third')
  })

  it('calculatePosition returns correct percentages', () => {
    const start = '2026-01-01'
    const totalDays = 100

    // Midpoint ≈ 50%
    const midDate = '2026-02-19' // ~50 days after Jan 1
    const position = calculatePosition(midDate, start, totalDays)
    expect(Math.abs(position - 50)).toBeLessThanOrEqual(1)

    // Start = 0%
    expect(calculatePosition(start, start, totalDays)).toBe(0)

    // End = 100%
    const endDate = '2026-04-11' // 100 days after Jan 1
    expect(calculatePosition(endDate, start, totalDays)).toBe(100)

    // totalDays=0 → returns 50 (centered)
    expect(calculatePosition('2026-01-01', '2026-01-01', 0)).toBe(50)

    // Before start → clamped to 0
    expect(calculatePosition('2025-12-01', start, totalDays)).toBe(0)
  })

  it('getTimelineRange returns correct start, end, and totalDays', () => {
    const milestones: ProposalMilestone[] = [
      makeMilestone({ scheduled_date: '2026-06-01' }),
      makeMilestone({ scheduled_date: '2026-01-01' }),
      makeMilestone({ scheduled_date: '2026-03-15' }),
    ]

    const range = getTimelineRange(milestones)

    expect(range.start).toBe('2026-01-01')
    expect(range.end).toBe('2026-06-01')
    expect(range.totalDays).toBe(daysBetween('2026-01-01', '2026-06-01'))
    expect(range.totalDays).toBe(151)

    // Empty milestones
    const emptyRange = getTimelineRange([])
    expect(emptyRange.totalDays).toBe(0)

    // Single milestone
    const singleRange = getTimelineRange([makeMilestone({ scheduled_date: '2026-04-10' })])
    expect(singleRange.start).toBe('2026-04-10')
    expect(singleRange.end).toBe('2026-04-10')
    expect(singleRange.totalDays).toBe(0)
  })
})
