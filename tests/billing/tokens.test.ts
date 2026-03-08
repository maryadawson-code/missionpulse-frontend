import { describe, it, expect } from 'vitest'
import { TOKEN_ALLOCATIONS } from '@/lib/billing/tokens'

describe('TOKEN_ALLOCATIONS', () => {
  it('exports all tier keys', () => {
    expect(TOKEN_ALLOCATIONS).toHaveProperty('trial')
    expect(TOKEN_ALLOCATIONS).toHaveProperty('starter')
    expect(TOKEN_ALLOCATIONS).toHaveProperty('professional')
    expect(TOKEN_ALLOCATIONS).toHaveProperty('enterprise')
  })

  it('has correct ordering: enterprise > professional > starter > trial', () => {
    expect(TOKEN_ALLOCATIONS.enterprise).toBeGreaterThan(TOKEN_ALLOCATIONS.professional)
    expect(TOKEN_ALLOCATIONS.professional).toBeGreaterThan(TOKEN_ALLOCATIONS.starter)
    expect(TOKEN_ALLOCATIONS.starter).toBeGreaterThan(TOKEN_ALLOCATIONS.trial)
  })

  it('all values are positive integers', () => {
    for (const [, value] of Object.entries(TOKEN_ALLOCATIONS)) {
      expect(value).toBeGreaterThan(0)
      expect(Number.isInteger(value)).toBe(true)
    }
  })

  it('trial = 50K, starter = 500K, professional = 2M, enterprise = 10M', () => {
    expect(TOKEN_ALLOCATIONS.trial).toBe(50_000)
    expect(TOKEN_ALLOCATIONS.starter).toBe(500_000)
    expect(TOKEN_ALLOCATIONS.professional).toBe(2_000_000)
    expect(TOKEN_ALLOCATIONS.enterprise).toBe(10_000_000)
  })
})
