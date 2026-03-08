import { describe, it, expect } from 'vitest'
import { getCUIWatermarkText, getCUIWatermarkStyle } from '@/lib/utils/cui-watermark'

describe('CUI Watermark', () => {
  describe('getCUIWatermarkText', () => {
    it('returns CUI//SP-PROPIN for SP-PROPIN', () => {
      expect(getCUIWatermarkText('SP-PROPIN')).toBe('CUI//SP-PROPIN')
    })
    it('returns CUI//OPSEC for OPSEC', () => {
      expect(getCUIWatermarkText('OPSEC')).toBe('CUI//OPSEC')
    })
    it('returns CUI//SP-PRVCY for SP-PRVCY', () => {
      expect(getCUIWatermarkText('SP-PRVCY')).toBe('CUI//SP-PRVCY')
    })
  })

  describe('getCUIWatermarkStyle', () => {
    it('returns fixed position overlay style', () => {
      const style = getCUIWatermarkStyle()
      expect(style.position).toBe('fixed')
      expect(style.pointerEvents).toBe('none')
      expect(style.zIndex).toBe(50)
    })
    it('has very low opacity', () => {
      const style = getCUIWatermarkStyle()
      expect(style.opacity).toBeLessThanOrEqual(0.1)
    })
    it('rotates text', () => {
      const style = getCUIWatermarkStyle()
      expect(style.transform).toContain('rotate')
    })
    it('disables user selection', () => {
      const style = getCUIWatermarkStyle()
      expect(style.userSelect).toBe('none')
    })
  })
})
