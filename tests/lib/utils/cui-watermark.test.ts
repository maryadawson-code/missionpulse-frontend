import { describe, it, expect } from 'vitest'
import { getCUIWatermarkText, getCUIWatermarkStyle } from '@/lib/utils/cui-watermark'
import type { CUIMarking } from '@/lib/utils/cui-watermark'

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
  it('returns a CSSProperties object with fixed positioning', () => {
    const style = getCUIWatermarkStyle()
    expect(style.position).toBe('fixed')
    expect(style.pointerEvents).toBe('none')
    expect(style.zIndex).toBe(50)
    expect(style.opacity).toBe(0.03)
    expect(style.userSelect).toBe('none')
    expect(style.fontFamily).toBe('monospace')
    expect(style.transform).toBe('rotate(-30deg)')
  })
})
