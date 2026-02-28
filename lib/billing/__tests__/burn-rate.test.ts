/**
 * Burn Rate Projection Tests.
 *
 * Tests the projection math (linear extrapolation, capping, edge cases).
 */
import { describe, it, expect } from 'vitest'

/**
 * Pure projection function — mirrors the logic in burn-rate.ts
 * without Supabase dependencies.
 */
function project(params: {
  remaining: number
  avgDaily: number
  periodEnd: string
}): { daysRemaining: number | null; exhaustionDate: string | null } {
  const { remaining, avgDaily, periodEnd } = params

  if (remaining <= 0) {
    return {
      daysRemaining: 0,
      exhaustionDate: new Date().toISOString().slice(0, 10),
    }
  }

  if (avgDaily <= 0) {
    return { daysRemaining: null, exhaustionDate: null }
  }

  const daysRemaining = Math.ceil(remaining / avgDaily)
  const exhaustionDate = new Date()
  exhaustionDate.setDate(exhaustionDate.getDate() + daysRemaining)

  const periodEndDate = new Date(periodEnd)
  if (exhaustionDate < periodEndDate) {
    return {
      daysRemaining,
      exhaustionDate: exhaustionDate.toISOString().slice(0, 10),
    }
  }

  // Won't exhaust this period
  return { daysRemaining: null, exhaustionDate: null }
}

describe('Burn rate projection math', () => {
  const PERIOD_END = '2026-03-01T00:00:00Z'

  it('50% consumed → projects days remaining from avg daily', () => {
    // 50K remaining at 10K/day = 5 days — fits within far-future period end
    const result = project({
      remaining: 50_000,
      avgDaily: 10_000,
      periodEnd: '2026-12-31T00:00:00Z',
    })
    expect(result.daysRemaining).toBe(5)
    expect(result.exhaustionDate).not.toBeNull()
  })

  it('zero consumption → no exhaustion date', () => {
    const result = project({
      remaining: 100_000,
      avgDaily: 0,
      periodEnd: PERIOD_END,
    })
    expect(result.daysRemaining).toBeNull()
    expect(result.exhaustionDate).toBeNull()
  })

  it('already exhausted (remaining ≤ 0) → daysRemaining = 0', () => {
    const result = project({
      remaining: 0,
      avgDaily: 5000,
      periodEnd: PERIOD_END,
    })
    expect(result.daysRemaining).toBe(0)
    expect(result.exhaustionDate).toBe(new Date().toISOString().slice(0, 10))
  })

  it('over-consumed (remaining negative) → daysRemaining = 0', () => {
    const result = project({
      remaining: -5000,
      avgDaily: 3000,
      periodEnd: PERIOD_END,
    })
    expect(result.daysRemaining).toBe(0)
  })

  it('low daily usage → won\'t exhaust before period end', () => {
    // 100K remaining, 10/day → 10000 days, well beyond period
    const result = project({
      remaining: 100_000,
      avgDaily: 10,
      periodEnd: PERIOD_END,
    })
    expect(result.daysRemaining).toBeNull()
    expect(result.exhaustionDate).toBeNull()
  })

  it('exhaustion date is capped at period end', () => {
    // Very low usage: ~1000 days at 100 tokens/day
    const result = project({
      remaining: 100_000,
      avgDaily: 100,
      periodEnd: PERIOD_END,
    })
    // 100K / 100 = 1000 days — well beyond March 1
    expect(result.exhaustionDate).toBeNull()
  })

  it('high daily usage → exhaustion date in near future', () => {
    const result = project({
      remaining: 10_000,
      avgDaily: 5_000,
      periodEnd: '2026-12-31T00:00:00Z', // Far future period end
    })
    expect(result.daysRemaining).toBe(2) // ceil(10K / 5K) = 2
    expect(result.exhaustionDate).not.toBeNull()
  })

  it('daily aggregation: average daily = total / days_with_data', () => {
    // This tests the averaging formula used in burn-rate.ts
    const totalTokens = 15_000
    const daysWithData = 5
    const avgDaily = Math.round(totalTokens / daysWithData)
    expect(avgDaily).toBe(3000)
  })
})
