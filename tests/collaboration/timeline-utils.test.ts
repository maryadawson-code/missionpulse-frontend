// filepath: tests/collaboration/timeline-utils.test.ts
/**
 * Tests for lib/proposals/timeline-utils.ts — Proposal Timeline Utilities
 * v1.3 Sprint 31
 *
 * Tests pure TypeScript helpers for milestone timeline calculations:
 * daysBetween, sortMilestones, calculatePosition, getTimelineRange.
 *
 * Import: daysBetween, sortMilestones, calculatePosition, getTimelineRange
 *         from '@/lib/proposals/timeline-utils'
 */

import {
  daysBetween,
  sortMilestones,
  calculatePosition,
  getTimelineRange,
} from '@/lib/proposals/timeline-utils'
import type { ProposalMilestone } from '@/lib/types/sync'

interface TestResult {
  name: string
  passed: boolean
  error?: string
}

// ─── Helper: Create a minimal ProposalMilestone ──────────────

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

// ─── Test 1: daysBetween — 30 days apart ─────────────────────

function testDaysBetween(): TestResult {
  try {
    const days = daysBetween('2026-01-01', '2026-01-31')

    if (days !== 30) {
      return {
        name: 'testDaysBetween',
        passed: false,
        error: `Expected 30 days between 2026-01-01 and 2026-01-31, got ${days}`,
      }
    }

    // Verify order doesn't matter (absolute value)
    const daysReversed = daysBetween('2026-01-31', '2026-01-01')
    if (daysReversed !== 30) {
      return {
        name: 'testDaysBetween',
        passed: false,
        error: `Expected 30 days (reversed order), got ${daysReversed}`,
      }
    }

    return { name: 'testDaysBetween', passed: true }
  } catch (err) {
    return {
      name: 'testDaysBetween',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Test 2: daysBetween same day = 0 ────────────────────────

function testDaysBetweenSameDay(): TestResult {
  try {
    const days = daysBetween('2026-06-15', '2026-06-15')

    if (days !== 0) {
      return {
        name: 'testDaysBetweenSameDay',
        passed: false,
        error: `Expected 0 days for same date, got ${days}`,
      }
    }

    return { name: 'testDaysBetweenSameDay', passed: true }
  } catch (err) {
    return {
      name: 'testDaysBetweenSameDay',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Test 3: sortMilestones — ascending by scheduled_date ────

function testSortMilestones(): TestResult {
  try {
    const milestones: ProposalMilestone[] = [
      makeMilestone({ title: 'Third', scheduled_date: '2026-06-01' }),
      makeMilestone({ title: 'First', scheduled_date: '2026-01-15' }),
      makeMilestone({ title: 'Second', scheduled_date: '2026-03-20' }),
    ]

    const sorted = sortMilestones(milestones)

    // Should not mutate the original
    if (milestones[0].title !== 'Third') {
      return {
        name: 'testSortMilestones',
        passed: false,
        error: 'sortMilestones should not mutate the input array',
      }
    }

    // Verify ascending order
    if (sorted[0].title !== 'First') {
      return {
        name: 'testSortMilestones',
        passed: false,
        error: `Expected first sorted item to be 'First', got '${sorted[0].title}'`,
      }
    }
    if (sorted[1].title !== 'Second') {
      return {
        name: 'testSortMilestones',
        passed: false,
        error: `Expected second sorted item to be 'Second', got '${sorted[1].title}'`,
      }
    }
    if (sorted[2].title !== 'Third') {
      return {
        name: 'testSortMilestones',
        passed: false,
        error: `Expected third sorted item to be 'Third', got '${sorted[2].title}'`,
      }
    }

    // Verify sorted array has same length
    if (sorted.length !== 3) {
      return {
        name: 'testSortMilestones',
        passed: false,
        error: `Expected sorted array length=3, got ${sorted.length}`,
      }
    }

    return { name: 'testSortMilestones', passed: true }
  } catch (err) {
    return {
      name: 'testSortMilestones',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Test 4: calculatePosition — midpoint = 50% ─────────────

function testCalculatePosition(): TestResult {
  try {
    // A date exactly in the middle of a 100-day range should be 50%
    const start = '2026-01-01'
    const totalDays = 100
    const midDate = '2026-02-19' // ~50 days after Jan 1

    // Calculate: (50 / 100) * 100 = 50
    const position = calculatePosition(midDate, start, totalDays)

    // Allow a small tolerance due to date rounding
    if (Math.abs(position - 50) > 1) {
      return {
        name: 'testCalculatePosition',
        passed: false,
        error: `Expected position ~50 for midpoint, got ${position}`,
      }
    }

    // Edge case: position at start = 0%
    const startPosition = calculatePosition(start, start, totalDays)
    if (startPosition !== 0) {
      return {
        name: 'testCalculatePosition',
        passed: false,
        error: `Expected position=0 at start, got ${startPosition}`,
      }
    }

    // Edge case: position at end = 100%
    const endDate = '2026-04-11' // 100 days after Jan 1
    const endPosition = calculatePosition(endDate, start, totalDays)
    if (endPosition !== 100) {
      return {
        name: 'testCalculatePosition',
        passed: false,
        error: `Expected position=100 at end, got ${endPosition}`,
      }
    }

    // Edge case: totalDays=0 → returns 50 (centered)
    const zeroPosition = calculatePosition('2026-01-01', '2026-01-01', 0)
    if (zeroPosition !== 50) {
      return {
        name: 'testCalculatePosition',
        passed: false,
        error: `Expected position=50 when totalDays=0, got ${zeroPosition}`,
      }
    }

    // Clamping: position before start should be 0
    const beforeStart = calculatePosition('2025-12-01', start, totalDays)
    if (beforeStart !== 0) {
      return {
        name: 'testCalculatePosition',
        passed: false,
        error: `Expected position=0 for date before start (clamped), got ${beforeStart}`,
      }
    }

    return { name: 'testCalculatePosition', passed: true }
  } catch (err) {
    return {
      name: 'testCalculatePosition',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Test 5: getTimelineRange — correct start, end, totalDays

function testTimelineRange(): TestResult {
  try {
    const milestones: ProposalMilestone[] = [
      makeMilestone({ scheduled_date: '2026-06-01' }),
      makeMilestone({ scheduled_date: '2026-01-01' }),
      makeMilestone({ scheduled_date: '2026-03-15' }),
    ]

    const range = getTimelineRange(milestones)

    // Start should be the earliest date
    if (range.start !== '2026-01-01') {
      return {
        name: 'testTimelineRange',
        passed: false,
        error: `Expected start='2026-01-01', got '${range.start}'`,
      }
    }

    // End should be the latest date
    if (range.end !== '2026-06-01') {
      return {
        name: 'testTimelineRange',
        passed: false,
        error: `Expected end='2026-06-01', got '${range.end}'`,
      }
    }

    // totalDays should be daysBetween(start, end)
    const expectedDays = daysBetween('2026-01-01', '2026-06-01')
    if (range.totalDays !== expectedDays) {
      return {
        name: 'testTimelineRange',
        passed: false,
        error: `Expected totalDays=${expectedDays}, got ${range.totalDays}`,
      }
    }

    // totalDays should be 151 (Jan 1 to Jun 1)
    if (range.totalDays !== 151) {
      return {
        name: 'testTimelineRange',
        passed: false,
        error: `Expected 151 days from Jan 1 to Jun 1, got ${range.totalDays}`,
      }
    }

    // Edge case: empty milestones
    const emptyRange = getTimelineRange([])
    if (emptyRange.totalDays !== 0) {
      return {
        name: 'testTimelineRange',
        passed: false,
        error: `Expected totalDays=0 for empty milestones, got ${emptyRange.totalDays}`,
      }
    }

    // Edge case: single milestone → start === end, totalDays = 0
    const singleRange = getTimelineRange([
      makeMilestone({ scheduled_date: '2026-04-10' }),
    ])
    if (singleRange.start !== '2026-04-10' || singleRange.end !== '2026-04-10') {
      return {
        name: 'testTimelineRange',
        passed: false,
        error: `Single milestone: expected start=end='2026-04-10', got start='${singleRange.start}', end='${singleRange.end}'`,
      }
    }
    if (singleRange.totalDays !== 0) {
      return {
        name: 'testTimelineRange',
        passed: false,
        error: `Single milestone: expected totalDays=0, got ${singleRange.totalDays}`,
      }
    }

    return { name: 'testTimelineRange', passed: true }
  } catch (err) {
    return {
      name: 'testTimelineRange',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Export all tests ────────────────────────────────────────

export const tests = [
  testDaysBetween,
  testDaysBetweenSameDay,
  testSortMilestones,
  testCalculatePosition,
  testTimelineRange,
]
