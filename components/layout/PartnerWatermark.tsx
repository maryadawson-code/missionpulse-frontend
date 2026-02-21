'use client'

interface PartnerWatermarkProps {
  companyName: string
}

/**
 * Renders a diagonal watermark overlay on every page visible to partners.
 * Includes company name and timestamp for traceability.
 */
export function PartnerWatermark({ companyName }: PartnerWatermarkProps) {
  const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ')

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem',
        opacity: 0.04,
        transform: 'rotate(-30deg)',
        userSelect: 'none',
      }}
    >
      <span
        style={{
          fontSize: '3rem',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          color: '#f59e0b',
          whiteSpace: 'nowrap',
        }}
      >
        PARTNER: {companyName}
      </span>
      <span
        style={{
          fontSize: '1.5rem',
          fontFamily: 'monospace',
          color: '#f59e0b',
        }}
      >
        {timestamp}
      </span>
    </div>
  )
}
