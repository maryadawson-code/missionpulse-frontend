import { describe, it, expect } from 'vitest'
import {
  SHIPLEY_PHASES,
  OPPORTUNITY_STATUSES,
  PRIORITIES,
  SET_ASIDES,
} from '@/lib/types/opportunities'

describe('Opportunity Types & Constants', () => {
  describe('SHIPLEY_PHASES', () => {
    it('has 6 gates', () => {
      expect(SHIPLEY_PHASES).toHaveLength(6)
    })
    it('starts at Gate 1 and ends at Gate 6', () => {
      expect(SHIPLEY_PHASES[0]).toBe('Gate 1')
      expect(SHIPLEY_PHASES[5]).toBe('Gate 6')
    })
  })

  describe('OPPORTUNITY_STATUSES', () => {
    it('includes Active, Won, Lost, No-Bid', () => {
      expect(OPPORTUNITY_STATUSES).toContain('Active')
      expect(OPPORTUNITY_STATUSES).toContain('Won')
      expect(OPPORTUNITY_STATUSES).toContain('Lost')
      expect(OPPORTUNITY_STATUSES).toContain('No-Bid')
    })
    it('has 4 statuses', () => {
      expect(OPPORTUNITY_STATUSES).toHaveLength(4)
    })
  })

  describe('PRIORITIES', () => {
    it('has 4 levels', () => {
      expect(PRIORITIES).toEqual(['Low', 'Medium', 'High', 'Critical'])
    })
  })

  describe('SET_ASIDES', () => {
    it('includes common set-asides', () => {
      expect(SET_ASIDES).toContain('SDVOSB')
      expect(SET_ASIDES).toContain('8(a)')
      expect(SET_ASIDES).toContain('HUBZone')
      expect(SET_ASIDES).toContain('Small Business')
      expect(SET_ASIDES).toContain('Full & Open')
    })
    it('has 7 options', () => {
      expect(SET_ASIDES).toHaveLength(7)
    })
  })
})
