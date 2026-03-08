import { describe, it, expect } from 'vitest'
import { SHIPLEY_PHASES, STATUS_OPTIONS, PRIORITY_OPTIONS } from '@/lib/utils/formatting'

describe('Formatting Constants', () => {
  describe('SHIPLEY_PHASES', () => {
    it('has 6 gates', () => {
      expect(SHIPLEY_PHASES).toHaveLength(6)
    })
    it('each phase has value, short, and label', () => {
      for (const phase of SHIPLEY_PHASES) {
        expect(phase).toHaveProperty('value')
        expect(phase).toHaveProperty('short')
        expect(phase).toHaveProperty('label')
        expect(phase.value).toMatch(/^Gate \d$/)
        expect(phase.short).toMatch(/^G\d$/)
        expect(phase.label.length).toBeGreaterThan(0)
      }
    })
    it('phases are in order', () => {
      expect(SHIPLEY_PHASES[0].value).toBe('Gate 1')
      expect(SHIPLEY_PHASES[5].value).toBe('Gate 6')
    })
  })

  describe('STATUS_OPTIONS', () => {
    it('has expected statuses', () => {
      expect(STATUS_OPTIONS).toContain('Active')
      expect(STATUS_OPTIONS).toContain('Won')
      expect(STATUS_OPTIONS).toContain('Lost')
      expect(STATUS_OPTIONS).toContain('No-Bid')
      expect(STATUS_OPTIONS).toContain('Draft')
    })
  })

  describe('PRIORITY_OPTIONS', () => {
    it('has 4 priorities in correct order', () => {
      expect(PRIORITY_OPTIONS).toEqual(['Critical', 'High', 'Medium', 'Low'])
    })
  })
})
