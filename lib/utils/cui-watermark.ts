/**
 * CUI Watermark utility for overlay marking on sensitive pages.
 * Used by Pricing (SP-PROPIN) and Black Hat (OPSEC) modules.
 */

export type CUIMarking = 'SP-PROPIN' | 'OPSEC' | 'SP-PRVCY'

export function getCUIWatermarkText(marking: CUIMarking): string {
  return `CUI//${marking}`
}

export function getCUIWatermarkStyle(): React.CSSProperties {
  return {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.03,
    fontSize: '6rem',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#f59e0b',
    transform: 'rotate(-30deg)',
    userSelect: 'none',
  }
}
